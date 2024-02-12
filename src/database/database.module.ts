import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { NamingStrategy } from './naming-strategy';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        return {
          type: 'postgres',
          host: configService.get<string>('PGHOST'),
          port: configService.get<number>('PGPORT'),
          username: configService.get<string>('PGUSER'),
          password: configService.get<string>('PGPASSWORD'),
          database: configService.get<string>('PGDATABASE'),
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          logging: configService.get('NODE_ENV') === 'production',
          namingStrategy: new NamingStrategy(),
          synchronize: true,
        };
      },
      inject: [ConfigService],
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
