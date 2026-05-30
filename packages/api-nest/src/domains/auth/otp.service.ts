import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { randomInt } from 'crypto';
import type { Redis } from 'ioredis';
import { REDIS } from '../../common/redis/redis.module';

@Injectable()
export class OtpService {
  private readonly ttl = Number(process.env.OTP_TTL ?? 300);
  private readonly maxAttempts = Number(process.env.OTP_MAX_ATTEMPTS ?? 5);
  private readonly cooldown = Number(process.env.OTP_RESEND_COOLDOWN ?? 60);

  constructor(@Inject(REDIS) private readonly redis: Redis) {}

  private codeKey(email: string) {
    return `otp:${email}`;
  }
  private attemptsKey(email: string) {
    return `otp:attempts:${email}`;
  }
  private cooldownKey(email: string) {
    return `otp:cooldown:${email}`;
  }

  async issue(email: string): Promise<string> {
    const onCooldown = await this.redis.exists(this.cooldownKey(email));
    if (onCooldown) {
      throw new HttpException(
        'An OTP was requested recently — wait before requesting another',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');

    await this.redis
      .multi()
      .set(this.codeKey(email), code, 'EX', this.ttl)
      .del(this.attemptsKey(email))
      .set(this.cooldownKey(email), '1', 'EX', this.cooldown)
      .exec();

    return code;
  }

  async verify(email: string, code: string): Promise<void> {
    const stored = await this.redis.get(this.codeKey(email));
    if (!stored) {
      throw new UnauthorizedException('invalid or expired code');
    }

    if (stored !== code) {
      const attempts = await this.redis.incr(this.attemptsKey(email));
      await this.redis.expire(this.attemptsKey(email), this.ttl);
      if (attempts >= this.maxAttempts) {
        await this.clear(email);
        throw new UnauthorizedException(
          'too many attempts — request a new code',
        );
      }
      throw new UnauthorizedException('invalid code');
    }

    await this.clear(email);
  }

  private async clear(email: string): Promise<void> {
    await this.redis.del(
      this.codeKey(email),
      this.attemptsKey(email),
      this.cooldownKey(email),
    );
  }
}
