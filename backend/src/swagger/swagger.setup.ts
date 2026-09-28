import { Logger, type INestApplication } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { SwaggerModule } from '@nestjs/swagger';
import {
  buildSwaggerConfig,
  SWAGGER_JSON_PATH,
  SWAGGER_PATH,
} from './swagger.config.js';

/**
 * Mounts the OpenAPI document and Swagger UI, unless `SWAGGER_ENABLED=false`.
 *
 * Call this from `main.ts` *after* `setGlobalPrefix` and the global pipes, so the
 * generated paths carry the `/api/v1` prefix and request bodies show their DTOs.
 */
export function setupSwagger(
  app: INestApplication,
  config: ConfigService,
): void {
  if (config.get<string>('SWAGGER_ENABLED') === 'false') {
    Logger.log('Swagger UI disabled (SWAGGER_ENABLED=false)', 'Swagger');
    return;
  }

  const document = SwaggerModule.createDocument(app, buildSwaggerConfig());
  SwaggerModule.setup(SWAGGER_PATH, app, document, {
    jsonDocumentUrl: SWAGGER_JSON_PATH,
    swaggerOptions: { persistAuthorization: true },
  });

  Logger.log(
    `Swagger UI at /${SWAGGER_PATH} — OpenAPI JSON at /${SWAGGER_JSON_PATH}`,
    'Swagger',
  );
}
