import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../database/entities';
import { Repository } from 'typeorm';
import { RegisterDto } from '../common/dto';
import * as bcrypt from 'bcrypt';
import { IApiResponse, IUser } from '../common/types';
import { IUserService } from './user-service.interface';

@Injectable()
export class UserService implements IUserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getProfile({ id, username }: IUser): Promise<User> {
    return await this.userRepository.findOneBy({ id, username });
  }

  async registerUser(registerDto: RegisterDto): Promise<IApiResponse> {
    const { username, password, name, surname } = registerDto;

    const isUsernameTaken = await this.isUsernameTaken(username);

    if (isUsernameTaken) throw new ConflictException('USERNAME_ALREADY_TAKEN');

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
    return await bcrypt.hash(password, 10);
  }

  async isUserExists(id: number, username: string): Promise<boolean> {
    const user = await this.userRepository.findOneBy({ id, username });
    return !!user;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { username },
      select: ['id', 'username', 'password'],
    });
  }
}
