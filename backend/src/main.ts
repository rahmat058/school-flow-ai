import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule, ObserveInstrument } from './app.module.js';
import { setupSwagger } from './swagger/swagger.setup.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });
  const config = app.get(ConfigService);

  app.setGlobalPrefix('api/v1');
  app.use(helmet());
  app.enableCors({
    origin: config.get<string>('CLIENT_URL') ?? true,
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));

  setupSwagger(app, config);

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
