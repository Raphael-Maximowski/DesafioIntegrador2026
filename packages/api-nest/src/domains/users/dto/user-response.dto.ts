import { User } from '../entities/user.entity';

/** Public shape of a user — never leak persistence internals beyond these fields. */
export class UserResponseDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
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
