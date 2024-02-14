import { Test, TestingModule } from '@nestjs/testing';
import * as redisMock from 'redis-mock';
import { RedisService } from '../redis.service';
import { RedisClient } from '../redis.provider';
import { faker } from '@faker-js/faker';

describe('RedisService', () => {
  let redisService: RedisService;
  let redisClientMock: redisMock.RedisClient;

  const key = 'testKey';
  let expirationSeconds: number;

  beforeEach(async () => {
    expirationSeconds = faker.number.int({ min: 15, max: 120 });

    jest.clearAllMocks();

    redisClientMock = {
      set: jest.fn(),
      get: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        {
          provide: 'REDIS_CLIENT',
          useValue: redisMock.createClient(),
        },
      ],
    }).compile();

    redisClientMock = module.get<RedisClient>('REDIS_CLIENT');
    redisService = module.get<RedisService>(RedisService);
  });

  it('Should be defined', () => {
    expect(redisService).toBeDefined();
  });

  it('Set: Should call a function with correct args', async () => {
    jest.spyOn(redisClientMock, 'set');

    const value = { a: 1, b: 2 };

    await redisService.set(key, value, expirationSeconds);

    expect(redisClientMock.set).toHaveBeenCalledWith(
      key,
      JSON.stringify(value),
      'EX',
      expirationSeconds,
    );
  });

  it('Set: Should call a function if value is false or empty string', async () => {
    jest.spyOn(redisClientMock, 'set');

    await redisService.set(key, true, expirationSeconds);
    await redisService.set(key, '', expirationSeconds);

    expect(redisClientMock.set).toHaveBeenCalledTimes(2);
  });

  it('Set: Should throw an error if value is null or undefined', async () => {
    const key = 'testKey';

    const expirationSeconds = faker.number.int({ min: 15, max: 120 });

    await expect(
      redisService.set(key, null, expirationSeconds),
    ).rejects.toThrow('Value is required');

    await expect(
      redisService.set(key, undefined, expirationSeconds),
    ).rejects.toThrow('Value is required');
  });

  it('Get: Should return object', async () => {
    const value = { a: 1, b: 2 };

    jest.spyOn(redisClientMock, 'get').mockResolvedValue(JSON.stringify(value));

    const response = await redisService.get(key);

    expect(response).toEqual(value);
  });

  it('Get: Should return null', async () => {
    jest.spyOn(redisClientMock, 'get').mockResolvedValue(null);

    const response = await redisService.get(key);

    expect(response).toBeNull();
  });

  it('Exists: Should return true if key exists', async () => {
    const key = 'existingKey';

    jest.spyOn(redisClientMock, 'exists').mockResolvedValue(1);

    const exists = await redisService.exists(key);

    expect(exists).toBe(true);
  });

  it('Exists: Should return false if key does not exist', async () => {
    const key = 'nonExistingKey';

    jest.spyOn(redisClientMock, 'exists').mockResolvedValue(0);

    const exists = await redisService.exists(key);

    expect(exists).toBe(false);
  });

  it('Del: Should call a function with correct args', async () => {
    jest.spyOn(redisClientMock, 'del');

    await redisService.del(key);

    expect(redisClientMock.del).toHaveBeenCalledWith(key);
  });

  it('FlushAll: Should call a function', async () => {
    jest.spyOn(redisClientMock, 'flushall');

    await redisService.flushAll();

    expect(redisClientMock.flushall).toHaveBeenCalled();
  });
});
