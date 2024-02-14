import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { activateAppSettings } from './common/utils/activate-app-settings';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  activateAppSettings(app);

  const configService = app.get(ConfigService);
  const logger = new Logger();

  const port = configService.get<string>('PORT');
  const host = configService.get<string>('HOST');

  await app.listen(port, host, async () => {
    const url = await app.getUrl();

    logger.log(`URL: ${url}`);
  });
}
bootstrap();
