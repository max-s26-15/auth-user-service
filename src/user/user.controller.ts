import { Body, Controller, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { RegisterDto } from '../common/dto';
import { IApiResponse } from '../common/types';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<IApiResponse> {
    return this.userService.registerUser(registerDto);
  }
}
