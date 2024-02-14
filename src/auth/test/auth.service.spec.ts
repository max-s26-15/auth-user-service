import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { mock } from 'jest-mock-extended';
import { UserService } from '../../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { IUserPayload } from '../../common/types';
import { faker } from '@faker-js/faker';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { User } from '../../database/entities';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let authService: AuthService;

  let payload: IUserPayload;

  const userNotFoundError = new NotFoundException('USER_NOT_FOUND');
  const invalidPayloadError = new InternalServerErrorException(
    'INVALID_PAYLOAD',
  );

  const userService = mock<UserService>();

  const jwtService = mock<JwtService>({
    signAsync: jest.fn().mockResolvedValue(faker.string.uuid()),
  });

  const configService = mock<ConfigService>({
    get: jest.fn().mockReturnValue(15),
  });

  beforeEach(() => {
    jest.clearAllMocks();

    payload = {
      id: faker.number.int(),
      username: faker.internet.userName(),
    };
  });

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: userService,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
        {
          provide: ConfigService,
          useValue: configService,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  it('Should be defined', () => {
    expect(authService).toBeDefined();
  });

  it('generateTokens: Should return jwt tokens', async () => {
    jest.spyOn(jwtService, 'signAsync');
    jest.spyOn(jwtService, 'sign');

    await authService.generateTokens(payload);

    expect(jwtService.signAsync).toBeCalledTimes(2);
    expect(jwtService.sign).not.toBeCalled();
  });

  it('generateTokens: Should throw InternalServerErrorException if invalid payload', async () => {
    await expect(
      authService.generateTokens({ id: payload.id } as IUserPayload),
    ).rejects.toThrowError(invalidPayloadError);

    await expect(
      authService.generateTokens({
        username: payload.username,
      } as IUserPayload),
    ).rejects.toThrowError(invalidPayloadError);
  });

  it('generateTokens: Should return jwt tokens', async () => {
    const tokens = await authService.generateTokens(payload);

    expect(tokens).toEqual({
      accessToken: expect.any(String),
      refreshToken: expect.any(String),
    });
  });

  it('login: Should return jwt tokens', async () => {
    jest.spyOn(userService, 'getUserByUsername').mockResolvedValue({
      id: faker.number.int(),
      username: faker.internet.userName(),
      password: faker.internet.password(),
    } as User);

    jest.spyOn(bcrypt, 'compare').mockReturnValue(true as unknown);

    const tokens = await authService.login({
      username: faker.internet.userName(),
      password: faker.internet.password(),
    });

    expect(tokens).toEqual({
      accessToken: expect.any(String),
      refreshToken: expect.any(String),
    });
  });

  it('login: Should throw NotFoundException if user is not found', async () => {
    jest.spyOn(userService, 'getUserByUsername').mockResolvedValue(null);

    jest.spyOn(bcrypt, 'compare').mockReturnValue(true as unknown);

    await expect(
      authService.login({
        username: faker.internet.userName(),
        password: faker.internet.password(),
      }),
    ).rejects.toThrowError(userNotFoundError);
  });

  it('login: Should throw BadRequestException if password is not valid', async () => {
    jest.spyOn(userService, 'getUserByUsername').mockResolvedValue({} as User);

    jest.spyOn(bcrypt, 'compare').mockReturnValue(false as unknown);

    const error = new BadRequestException('INVALID_PASSWORD');

    await expect(
      authService.login({
        username: faker.internet.userName(),
        password: faker.internet.password(),
      }),
    ).rejects.toThrowError(error);
  });

  it('refresh: Should return jwt tokens', async () => {
    jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(payload);

    jest.spyOn(userService, 'getUserByUsername').mockResolvedValue({
      id: faker.number.int(),
      username: faker.internet.userName(),
    } as User);

    const tokens = await authService.refresh(faker.string.uuid());

    expect(tokens).toEqual({
      accessToken: expect.any(String),
      refreshToken: expect.any(String),
    });
  });

  it('refresh: Should throw InternalServerErrorException if invalid payload', () => {
    jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue({});

    return expect(
      authService.refresh(faker.string.uuid()),
    ).rejects.toThrowError(invalidPayloadError);
  });

  it('refresh: Should throw NotFoundException if user is not found', () => {
    jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(payload);

    jest.spyOn(userService, 'getUserByUsername').mockResolvedValue(null);

    return expect(
      authService.refresh(faker.string.uuid()),
    ).rejects.toThrowError(userNotFoundError);
  });
});
