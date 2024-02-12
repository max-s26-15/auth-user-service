import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const configService = app.get(ConfigService);
  const logger = new Logger();

  app.enableCors({
    origin: true,
    credentials: true,
  });

  const port = configService.get<string>('PORT');
  const host = configService.get<string>('HOST');

  await app.listen(port, host, async () => {
    const url = await app.getUrl();

    logger.log(`URL: ${url}`);
  });
}
bootstrap();
