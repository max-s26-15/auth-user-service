import { UserService } from '../user.service';
import { Test, TestingModule } from '@nestjs/testing';
import { ProxyUserService } from '../proxy-service/proxy-user.service';
import { mock } from 'jest-mock-extended';
import { RedisService } from '../../redis/redis.service';
import { faker } from '@faker-js/faker';
import { User } from '../../database/entities';
import { RegisterDto } from '../../common/dto';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('ProxyUserService', () => {
  let proxyUserService: ProxyUserService;

  const userService = mock<UserService>();

  const redisService = mock<RedisService>();

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProxyUserService,
        { provide: UserService, useValue: userService },
        { provide: RedisService, useValue: redisService },
      ],
    }).compile();

    proxyUserService = module.get<ProxyUserService>(ProxyUserService);
  });

  it('Should be defined', () => {
    expect(proxyUserService).toBeDefined();
  });
});

describe('ProxyUserService.getProfile()', () => {
  let proxyUserService: ProxyUserService;

  let userObject: Partial<User>;

  const userService = mock<UserService>();

  const redisService = mock<RedisService>({
    get: jest.fn().mockReturnValue(userObject),
    set: jest.fn(),
  });

  beforeEach(() => {
    userObject = {
      id: faker.number.int({ min: 1, max: 100 }),
      username: faker.internet.userName(),
      name: faker.person.firstName('male'),
      surname: faker.person.lastName('male'),
      createdAt: faker.date.past(),
      updatedAt: faker.date.past(),
    };
  });

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProxyUserService,
        { provide: UserService, useValue: userService },
        { provide: RedisService, useValue: redisService },
      ],
    }).compile();

    proxyUserService = module.get<ProxyUserService>(ProxyUserService);
  });

  it('Should return a user from cache', async () => {
    jest.spyOn(redisService, 'get').mockResolvedValue(userObject);

    jest.spyOn(redisService, 'set');
    jest.spyOn(userService, 'getProfile');

    const user = await proxyUserService.getProfile({
      id: userObject.id,
      username: userObject.username,
    });

    expect(user).toEqual(userObject);

    expect(redisService.set).not.toHaveBeenCalled();
    expect(userService.getProfile).not.toHaveBeenCalled();
  });

  it('Should return a user from the database', async () => {
    jest.spyOn(redisService, 'get').mockResolvedValue(null);

    jest.spyOn(redisService, 'set');
    jest.spyOn(userService, 'getProfile').mockResolvedValue(userObject as User);

    const user = await proxyUserService.getProfile({
      id: userObject.id,
      username: userObject.username,
    });

    expect(user).toEqual(userObject);

    expect(redisService.set).toBeCalledTimes(1);
    expect(userService.getProfile).toHaveBeenCalledTimes(1);
  });

  it('Should throw NotFoundException', async () => {
    jest.spyOn(redisService, 'get').mockResolvedValue(null);

    jest.spyOn(redisService, 'set');
    jest.spyOn(userService, 'getProfile').mockResolvedValue(null);

    await expect(
      proxyUserService.getProfile({
        id: userObject.id,
        username: userObject.username,
      }),
    ).rejects.toThrowError(new NotFoundException('USER_NOT_FOUND'));
  });
});

describe('ProxyUserService.registerUser()', () => {
  let proxyUserService: ProxyUserService;

  let registerDto: RegisterDto;

  const userService = mock<UserService>();

  const redisService = mock<RedisService>();

  beforeEach(() => {
    registerDto = {
      username: faker.internet.userName(),
      password: faker.internet.password(),
      name: faker.person.firstName(),
      surname: faker.person.lastName(),
    };
  });

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProxyUserService,
        { provide: UserService, useValue: userService },
        { provide: RedisService, useValue: redisService },
      ],
    }).compile();

    proxyUserService = module.get<ProxyUserService>(ProxyUserService);
  });

  it('Should call userService.registerUser and return ApiResponse', async () => {
    const apiResponseMessage = 'USER_SUCCESSFULLY_REGISTERED';

    jest.spyOn(userService, 'registerUser').mockResolvedValue({
      message: apiResponseMessage,
      date: faker.date.recent(),
    });

    const response = await proxyUserService.registerUser(registerDto);

    expect(userService.registerUser).toHaveBeenCalledTimes(1);
    expect(userService.registerUser).toHaveBeenCalledWith(registerDto);
    expect(response).toEqual({
      message: apiResponseMessage,
      date: expect.any(Date),
    });
  });

  it('Should throw an exception with the same message', () => {
    const errorMessage = faker.lorem.sentence();

    jest
      .spyOn(userService, 'registerUser')
      .mockRejectedValue(new ConflictException(errorMessage));

    expect(proxyUserService.registerUser(registerDto)).rejects.toThrowError(
      errorMessage,
    );
  });
});
