import { ApiProperty } from '@nestjs/swagger';

export class MessageResponseDto {
  @ApiProperty({
    description: 'Human-readable result detail.',
    example: 'OTP sent',
  })
  detail: string;
}
