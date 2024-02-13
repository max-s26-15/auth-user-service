import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { RegisterDto, UserVm } from '../common/dto';
import { IApiResponse, IUser } from '../common/types';
import { CurrentUser, Public } from '../common/decorators';
import { AccessTokenGuard } from '../common/guards/access-token.guard';

@UseGuards(AccessTokenGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  async getProfile(@CurrentUser() user: IUser): Promise<UserVm> {
    const cachedProfile = await this.userService.getProfileFromCache(
      user.username,
    );

    if (cachedProfile) return cachedProfile;

    return this.userService.getProfile(user);
  }

  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<IApiResponse> {
    return this.userService.registerUser(registerDto);
  }
}
