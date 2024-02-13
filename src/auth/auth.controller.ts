import {
  BadRequestException,
  Body,
  Controller,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from '../common/dto/login.dto';
import { IJwtTokens } from '../common/types';
import { Response, Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { RefreshTokenGuard } from '../common/guards/refresh-token.guard';

@Controller('auth')
export class AuthController {
  private readonly accessTokenAge: number;
  private readonly refreshTokenAge: number;

  constructor(
    private readonly authService: AuthService,
    private configService: ConfigService,
  ) {
    this.accessTokenAge =
      this.configService.get<number>('ACCESS_TOKEN_AGE_MINUTES') * 60 * 1000;

    this.refreshTokenAge =
      this.configService.get<number>('REFRESH_TOKEN_AGE_DAYS') *
      24 *
      60 *
      60 *
      1000;
  }

  @Post('login')
  async login(@Res() res: Response, @Body() loginDto: LoginDto): Promise<void> {
    const tokens = await this.authService.login(loginDto);

    this.setCookies(res, tokens);

    res
      .status(HttpStatus.OK)
      .send({ message: 'USER_SUCCESSFULLY_LOGGED_IN', date: new Date() });
  }

  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  async refresh(@Req() req: Request, @Res() res: Response) {
    if (!req?.cookies?.refreshToken) {
      throw new BadRequestException('NO_REFRESH_TOKEN');
    }

    const tokens = await this.authService.refresh(req.cookies.refreshToken);

    this.setCookies(res, tokens);

    res
      .status(200)
      .send({ message: 'TOKENS_SUCCESSFULLY_REFRESHED', date: new Date() });
  }

  private setCookies(
    res: Response,
    { accessToken, refreshToken }: IJwtTokens,
  ): void {
    res.cookie('accessToken', accessToken, {
      maxAge: this.accessTokenAge,
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
    });
    res.cookie('refreshToken', refreshToken, {
      maxAge: this.refreshTokenAge,
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
    });
  }
}
