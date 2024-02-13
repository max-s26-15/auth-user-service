import { Injectable } from '@nestjs/common';
import { RegisterDto } from 'src/common/dto';
import { IApiResponse, IUser } from 'src/common/types';
import { IUserService } from '../user-service.interface';
import { RedisService } from '../../redis/redis.service';
import { UserService } from '../user.service';
import { User } from '../../database/entities';

@Injectable()
export class ProxyUserService implements IUserService {
  constructor(
    private redisService: RedisService,
    private userService: UserService,
  ) {}

  async getProfile({ id, username }: IUser): Promise<User> {
    const cachedUser = await this.redisService.get<User>(username);

    if (cachedUser) return cachedUser;

    const user = await this.userService.getProfile({ id, username });

    await this.redisService.set(username, user, 60);

    return user;
  }

  async registerUser(registerDto: RegisterDto): Promise<IApiResponse> {
    return this.userService.registerUser(registerDto);
  }
}
