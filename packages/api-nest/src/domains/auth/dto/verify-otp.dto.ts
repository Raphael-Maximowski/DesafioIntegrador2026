import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, Matches } from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({
    description: 'Email the OTP was issued to.',
    example: 'ada@example.com',
    format: 'email',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'The 6-digit one-time code received by email.',
    example: '123456',
    pattern: '^\\d{6}$',
  })
  @Matches(/^\d{6}$/, { message: 'code must be 6 digits' })
  code: string;
}
