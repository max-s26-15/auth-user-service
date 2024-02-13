import { RegisterDto } from '../common/dto';
import { IApiResponse, IUser } from '../common/types';
import { User } from '../database/entities';

export interface IUserService {
  getProfile: (user: IUser) => Promise<User>;

  registerUser: (registerDto: RegisterDto) => Promise<IApiResponse>;
}

export const USER_SERVICE = Symbol('IUserService');
