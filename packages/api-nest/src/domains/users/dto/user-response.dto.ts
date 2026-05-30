import { ApiProperty } from '@nestjs/swagger';
import { User } from '../entities/user.entity';

export class UserResponseDto {
  @ApiProperty({
    description: 'User UUID.',
    format: 'uuid',
    example: '3f6c1a9e-9c2b-4f1a-bd4e-2a1c9d8e7f00',
  })
  id: string;

  @ApiProperty({ description: 'Given name.', example: 'Ada' })
  firstName: string;

  @ApiProperty({ description: 'Family name.', example: 'Lovelace' })
  lastName: string;

  @ApiProperty({
    description: 'Email address.',
    format: 'email',
    example: 'ada@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'When the user was created.',
    format: 'date-time',
  })
  createdAt: Date;

  static fromEntity(user: User): UserResponseDto {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      createdAt: user.createdAt,
    };
  }
}
