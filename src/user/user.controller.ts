import { Body, Controller, Get, Inject, Post, UseGuards } from '@nestjs/common';
import { RegisterDto, UserVm } from '../common/dto';
import { IApiResponse, IUser } from '../common/types';
import { CurrentUser, Public } from '../common/decorators';
import { AccessTokenGuard } from '../common/guards/access-token.guard';
import { IUserService, USER_SERVICE } from './user-service.interface';
import { plainToInstance } from 'class-transformer';

@UseGuards(AccessTokenGuard)
@Controller('user')
export class UserController {
  constructor(
    @Inject(USER_SERVICE)
    private userService: IUserService,
  ) {}

  @Get('profile')
  async getProfile(@CurrentUser() currentUser: IUser): Promise<UserVm> {
    const user = await this.userService.getProfile(currentUser);

    return plainToInstance(UserVm, user, { excludeExtraneousValues: true });
  }

  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<IApiResponse> {
    return this.userService.registerUser(registerDto);
  }
}
