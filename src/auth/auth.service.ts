import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import { LoginDto } from '../dto/login.dto';
import { IJwtTokens, IUserPayload } from '../types';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private readonly accessTokenAge: string;
  private readonly refreshTokenAge: string;

  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    this.accessTokenAge =
      this.configService.get<number>('ACCESS_TOKEN_AGE_MINUTES') + 'm';

    this.refreshTokenAge =
      this.configService.get<number>('REFRESH_TOKEN_AGE_DAYS') + 'd';
  }

  async login({ username, password }: LoginDto): Promise<IJwtTokens> {
    const user = await this.userService.getUserByUsername(username);

    if (!user) throw new NotFoundException('USER_NOT_FOUND');

    const isPasswordValid = await this.userService.compareUserPasswords(
      password,
      user.password,
    );

    if (!isPasswordValid) throw new BadRequestException('INVALID_PASSWORD');

    return this.generateTokens({
      id: user.id,
      username: user.username,
    });
  }

  async refresh(refreshToken: string) {
    const payload = this.jwtService.verify(refreshToken, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
    }) as IUserPayload;

    const user = await this.userService.getUserByUsername(payload.username);

    if (!user) throw new NotFoundException('USER_NOT_FOUND');

    return this.generateTokens({
      id: user.id,
      username: user.username,
    });
  }

  async generateTokens(payload: IUserPayload): Promise<IJwtTokens> {
    if (!payload.id || !payload.username) {
      throw new BadRequestException('INVALID_PAYLOAD');
    }

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.accessTokenAge,
      secret: this.configService.get<string>('JWT_SECRET'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.refreshTokenAge,
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
    });

    return { accessToken, refreshToken };
  }
}
