import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../database/entities';
import { Repository } from 'typeorm';
import { RegisterDto, UserVm } from '../dto';
import * as bcrypt from 'bcrypt';
import { plainToInstance } from 'class-transformer';
import { IApiResponse } from '../types';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async registerUser(registerDto: RegisterDto): Promise<IApiResponse> {
    const { username, password, name, surname } = registerDto;

    const isUsernameTaken = await this.isUsernameTaken(username);

    if (isUsernameTaken) {
      throw new ConflictException('USERNAME_ALREADY_TAKEN');
    }

    const hashedPassword = await this.hashUserPassword(password);

    const user = this.userRepository.create({
      username,
      password: hashedPassword,
      name,
      surname,
    });

    await this.userRepository.save(user);

    return { message: 'USER_SUCCESSFULLY_REGISTERED', date: new Date() };
  }

  private async isUsernameTaken(username: string): Promise<boolean> {
    const user = await this.userRepository.findOneBy({ username });
    return !!user;
  }

  private async hashUserPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }
}
