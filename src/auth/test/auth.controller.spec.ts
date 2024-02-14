import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { INestApplication } from '@nestjs/common';
import { LoginDto } from '../../common/dto/login.dto';
import { IJwtTokens } from '../../common/types';
import { ConfigService } from '@nestjs/config';
import { mock } from 'jest-mock-extended';
import * as request from 'supertest';
import { MockAuthGuard } from '../../common/mocks/mock-auth.guard';
import { RefreshTokenGuard } from '../../common/guards/refresh-token.guard';
import { activateAppSettings } from '../../common/utils/activate-app-settings';

describe('AuthController', () => {
  let app: INestApplication;
  let controller: AuthController;

  const authService = mock<AuthService>();

  const loginDto: LoginDto = {
    username: 'username',
    password: 'password',
  };

  const configService = mock<ConfigService>({
    get: jest.fn().mockReturnValue(5),
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        { provide: ConfigService, useValue: configService },
      ],
    })
      .overrideProvider(AuthService)
      .useValue(authService)
      .overrideGuard(RefreshTokenGuard)
      .useClass(MockAuthGuard)
      .compile();

    controller = module.get<AuthController>(AuthController);

    app = module.createNestApplication();

    activateAppSettings(app);

    await app.init();
  });

  jest.spyOn(authService, 'login').mockResolvedValue({
    accessToken: 'someToken',
    refreshToken: 'someToken',
  } as IJwtTokens);

  jest.spyOn(authService, 'refresh').mockResolvedValue({
    accessToken: 'someToken',
    refreshToken: 'someToken',
  } as IJwtTokens);

  it('Should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('Login: Should call methods with proper arguments', async () => {
    const res = {
      cookie: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    } as any;

    await controller.login(res, loginDto);

    expect(res.cookie).toHaveBeenCalledWith('accessToken', 'someToken', {
      maxAge: expect.any(Number),
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
    });

    expect(res.cookie).toHaveBeenCalledWith('refreshToken', 'someToken', {
      maxAge: expect.any(Number),
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
    });

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.send).toHaveBeenCalledWith({
      message: 'USER_SUCCESSFULLY_LOGGED_IN',
      date: expect.any(Date),
    });
  });

  it('/login (POST): Should set jwt tokens in cookies and return response', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send(loginDto)
      .expect(200)
      .expect('set-cookie', /accessToken/)
      .expect('set-cookie', /refreshToken/)
      .then((response) => {
        expect(response.body).toEqual({
          message: 'USER_SUCCESSFULLY_LOGGED_IN',
          date: expect.any(String),
        });
      });
  });

  it('/login (POST): Should finish with status code 400', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'username' })
      .expect(400);
  });

  it('/refresh (POST): Should set jwt tokens in cookies and return response', () => {
    return request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', 'refreshToken=someToken')
      .expect(200)
      .expect('set-cookie', /accessToken/)
      .expect('set-cookie', /refreshToken/)
      .then((response) => {
        expect(response.body).toEqual({
          message: 'TOKENS_SUCCESSFULLY_REFRESHED',
          date: expect.any(String),
        });
      });
  });

  it('/refresh (POST): Should finish with status code 400', () => {
    return request(app.getHttpServer())
      .post('/auth/refresh')
      .expect(400)
      .then((response) => {
        expect(response.body).toEqual({
          statusCode: 400,
          message: 'NO_REFRESH_TOKEN',
          error: 'Bad Request',
        });
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
