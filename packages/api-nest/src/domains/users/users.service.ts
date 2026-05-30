import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(private readonly users: UsersRepository) {}

  async getByEmail(email: string): Promise<User> {
    const user = await this.users.findByEmail(email);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async register(dto: CreateUserDto): Promise<User> {
    try {
      return await this.users.create(dto);
    } catch (err) {
      if (
        err instanceof QueryFailedError &&
        (err as { code?: string }).code === '23505'
      ) {
        throw new ConflictException('email already taken');
      }
      throw err;
    }
  }
}
