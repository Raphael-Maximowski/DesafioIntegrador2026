import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { UsersService } from '../users/users.service';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { OtpService } from './otp.service';
import { TokenService } from './token.service';
import { RegisterDto } from './dto/register.dto';
import { TokenResponseDto } from './dto/token-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly otp: OtpService,
    private readonly tokens: TokenService,
    private readonly mailer: MailerService,
  ) {}

  async register(dto: RegisterDto): Promise<UserResponseDto> {
    const user = await this.users.register(dto);
    return UserResponseDto.fromEntity(user);
  }

  async requestOtp(email: string): Promise<{ detail: string }> {
    await this.users.getByEmail(email);
    const code = await this.otp.issue(email);

    await this.mailer.sendMail({
      to: email,
      subject: 'Your login code',
      text: `Your login code is ${code}. It expires in a few minutes.`,
      html: `<p>Your login code is <strong>${code}</strong>.</p><p>It expires in a few minutes.</p>`,
    });

    return { detail: 'OTP sent' };
  }

  async verifyOtp(email: string, code: string): Promise<TokenResponseDto> {
    await this.otp.verify(email, code);
    const user = await this.users.getByEmail(email);
    return this.tokens.issuePair(user.id, user.email);
  }

  refresh(refreshToken: string): Promise<TokenResponseDto> {
    return this.tokens.rotate(refreshToken);
  }

  async logout(sid: string): Promise<{ detail: string }> {
    await this.tokens.revokeSession(sid);
    return { detail: 'logged out' };
  }
}
