import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { IUserPayload } from '../types';
import { UserService } from '../../user/user.service';

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private configService: ConfigService,
    private userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        AccessTokenStrategy.extractJwt,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  private static extractJwt(req: Request): string | null {
    if (req?.cookies && req.cookies['accessToken']) {
      return req.cookies['accessToken'] || null;
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
