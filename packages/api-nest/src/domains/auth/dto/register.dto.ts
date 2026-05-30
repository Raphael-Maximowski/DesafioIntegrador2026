import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ description: 'Given name.', example: 'Ada', minLength: 1 })
  @IsString()
  @MinLength(1)
  firstName: string;

  @ApiProperty({
    description: 'Family name.',
    example: 'Lovelace',
    minLength: 1,
  })
  @IsString()
  @MinLength(1)
  lastName: string;

  @ApiProperty({
    description: 'Unique email address — the login identity.',
    example: 'ada@example.com',
    format: 'email',
  })
  @IsEmail()
  email: string;
}
