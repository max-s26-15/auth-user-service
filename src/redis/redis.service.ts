import { Inject, Injectable } from '@nestjs/common';
import { RedisClient } from './redis.provider';

@Injectable()
export class RedisService {
  public constructor(
    @Inject('REDIS_CLIENT')
    private readonly redisClient: RedisClient,
  ) {}

  async set(key: string, value: unknown, expirationSeconds: number) {
    if (!value) throw new Error('Value is required');

    const data = JSON.stringify(value);

    await this.redisClient.set(key, data, 'EX', expirationSeconds);
  }

  async get<T>(key: string): Promise<T | null> {
    const data = await this.redisClient.get(key);

    if (!data) return null;

    return JSON.parse(data) as T;
  }

  async exists(key: string): Promise<boolean> {
    return !!(await this.redisClient.exists(key));
  }

  async del(key: string) {
    await this.redisClient.del(key);
  }

  async flushAll() {
    await this.redisClient.flushall();
  }
}
