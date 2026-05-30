import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';
import type { Redis } from 'ioredis';
import { REDIS } from '../../common/redis/redis.module';
import { TokenResponseDto } from './dto/token-response.dto';

interface RefreshPayload {
  userId: string;
  email: string;
  sid: string;
}

@Injectable()
export class TokenService {
  private readonly accessTtl = Number(process.env.JWT_ACCESS_TTL ?? 900);
  private readonly refreshTtl = Number(process.env.REFRESH_TTL ?? 604800);

  constructor(
    private readonly jwt: JwtService,
    @Inject(REDIS) private readonly redis: Redis,
  ) {}

  private refreshKey(token: string) {
    return `refresh:${token}`;
  }

  private sessionKey(sid: string) {
    return `session:${sid}`;
  }

  async issuePair(userId: string, email: string): Promise<TokenResponseDto> {
    const sid = randomBytes(16).toString('hex');
    const accessToken = await this.jwt.signAsync(
      { sub: userId, email, sid },
      { expiresIn: this.accessTtl },
    );

    const refreshToken = randomBytes(32).toString('hex');
    await this.redis
      .multi()
      .set(
        this.refreshKey(refreshToken),
        JSON.stringify({ userId, email, sid } satisfies RefreshPayload),
        'EX',
        this.refreshTtl,
      )
      .set(this.sessionKey(sid), refreshToken, 'EX', this.refreshTtl)
      .exec();

    return { accessToken, refreshToken };
  }

  async rotate(refreshToken: string): Promise<TokenResponseDto> {
    const raw = await this.redis.get(this.refreshKey(refreshToken));
    if (!raw)
      throw new UnauthorizedException('invalid or expired refresh token');

    const { userId, email, sid } = JSON.parse(raw) as RefreshPayload;
    await this.redis.del(this.refreshKey(refreshToken), this.sessionKey(sid));
    return this.issuePair(userId, email);
  }

  async revokeSession(sid: string): Promise<void> {
    const refreshToken = await this.redis.get(this.sessionKey(sid));
    const keys = [this.sessionKey(sid)];
    if (refreshToken) keys.push(this.refreshKey(refreshToken));
    await this.redis.del(...keys);
  }
}
