import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from '../user.controller';
import { UserService } from '../user.service';
import { mock } from 'jest-mock-extended';
import { USER_SERVICE } from '../user-service.interface';
import { AccessTokenGuard } from '../../common/guards/access-token.guard';
import { MockAuthGuard } from '../../common/mocks/mock-auth.guard';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { IApiResponse } from '../../common/types';
import { activateAppSettings } from '../../common/utils/activate-app-settings';

describe('UserController', () => {
  let app: INestApplication;
  let controller: UserController;

  const user = {
    username: 'Batman',
    name: 'Bruce',
    surname: 'Wayne',
  };

  const registerApiResponse: IApiResponse = {
    message: 'USER_SUCCESSFULLY_REGISTERED',
    date: new Date(),
  };

  const userService = mock<UserService>({
    getProfile: jest.fn().mockReturnValue({
      id: 1,
      ...user,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    registerUser: jest.fn().mockReturnValue(registerApiResponse),
  });

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: USER_SERVICE, useValue: userService }],
    })
      .overrideGuard(AccessTokenGuard)
      .useClass(MockAuthGuard)
      .compile();

    controller = module.get<UserController>(UserController);

    app = module.createNestApplication();

    activateAppSettings(app);

    await app.init();
  });

  it('Should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('Profile: Should return user dto', async () => {
    const req = { user: { id: 1, username: 'Batman' } };

    const response = await controller.getProfile(req.user);

    expect(response).toEqual({
      id: expect.any(Number),
      username: expect.any(String),
      name: expect.any(String),
      surname: expect.any(String),
    });
  });

  it('/profile (GET): Should return user dto', async () => {
    return request(app.getHttpServer())
      .get('/user/profile')
      .expect(200)
      .then((response) => {
        expect(response.body).toEqual({
          id: expect.any(Number),
          username: expect.any(String),
          name: expect.any(String),
          surname: expect.any(String),
        });
      });
  });

  it('/register (POST): Should return APiResponse from request', async () => {
    return request(app.getHttpServer())
      .post('/user/register')
      .send({
        ...user,
        password: '123456',
      })
      .expect(201)
      .then((response) => {
        expect(response.body).toEqual({
          message: registerApiResponse.message,
          date: expect.any(String),
        });
      });
  });

  it('/register (POST): Should finish with status code 400', () => {
    return request(app.getHttpServer())
      .post('/user/register')
      .send({ username: 'Batman' })
      .expect(400);
  });

  afterAll(async () => {
    await app.close();
  });
});
