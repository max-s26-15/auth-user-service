import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { IUserPayload } from '../types';
import { Request } from 'express';
import { UserService } from '../../user/user.service';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private configService: ConfigService,
    private userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        RefreshTokenStrategy.extractJwt,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_REFRESH_SECRET'),
    });
  }

  private static extractJwt(req: Request): string | null {
    if (req?.cookies && req.cookies['refreshToken']) {
      return req.cookies['refreshToken'] || null;
    }

    return null;
  }

  async validate(payload: IUserPayload) {
    const { id, username } = payload;

    const isUserExists = await this.userService.isUserExists(id, username);

    if (!isUserExists) {
      return null;
    }

    return payload;
  }
}
