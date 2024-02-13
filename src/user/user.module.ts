import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../database/entities';
import { RedisModule } from '../redis/redis.module';
import { ProxyUserService } from './proxy-service/proxy-user.service';
import { USER_SERVICE } from './user-service.interface';

@Module({
  imports: [TypeOrmModule.forFeature([User]), RedisModule],
  controllers: [UserController],
  providers: [
    UserService,
    {
      provide: USER_SERVICE,
      useClass: ProxyUserService,
    },
  ],
  exports: [UserService],
})
export class UserModule {}
