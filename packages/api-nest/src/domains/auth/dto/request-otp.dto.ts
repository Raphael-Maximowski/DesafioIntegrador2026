import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class RequestOtpDto {
  @ApiProperty({
    description:
      'Email of a registered user to send the one-time login code to.',
    example: 'ada@example.com',
    format: 'email',
  })
  @IsEmail()
  email: string;
}
