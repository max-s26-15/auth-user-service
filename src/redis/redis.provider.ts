import { Provider } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

export type RedisClient = Redis;

export const RedisProvider: Provider = {
  inject: [ConfigService],
  useFactory: (configService: ConfigService): RedisClient =>
    new Redis({
      host: configService.get<string>('REDIS_HOST'),
      port: configService.get<number>('REDIS_PORT'),
    }),
  provide: 'REDIS_CLIENT',
};
