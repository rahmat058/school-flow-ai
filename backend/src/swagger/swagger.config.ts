import { DocumentBuilder, type OpenAPIObject } from '@nestjs/swagger';

/** Where the Swagger UI is mounted — outside the `/api/v1` global prefix. */
export const SWAGGER_PATH = 'docs';

/** The raw OpenAPI document, served beside the UI for tooling and codegen. */
export const SWAGGER_JSON_PATH = `${SWAGGER_PATH}/json`;

/**
 * Root tags label and order the UI's groups. Nest tags every operation from its
 * controller name (`AuthController` → `Auth`), so a tag listed here must match
 * that derived name to take effect.
 */
const SWAGGER_TAGS: { name: string; description: string }[] = [
  { name: 'Auth', description: 'Login, refresh, logout and the caller’s profile' },
  { name: 'Registration', description: 'School registration and email verification' },
  { name: 'Health', description: 'Liveness / readiness probe' },
];

/** Builds the base OpenAPI document (title, servers, tags, bearer security). */
export function buildSwaggerConfig(): Omit<OpenAPIObject, 'paths'> {
  const builder = new DocumentBuilder()
    .setTitle('School Flow AI API')
    .setDescription(
      [
        'Multi-role school management API — admin, teacher, student and parent.',
        '',
        'Every route sits under `/api/v1` and answers with the success envelope',
        '`{ success, message, data }`; failures use `{ success: false, message, error }`.',
        'Protected routes need a bearer access token from `POST /api/v1/auth/login` —',
        'click **Authorize** and paste it.',
      ].join('\n'),
    )
    .setVersion('1.0')
    .setLicense('MIT', 'https://opensource.org/license/mit')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Access token returned by POST /api/v1/auth/login',
      },
      'bearer',
    )
    .addSecurityRequirements('bearer');

  for (const tag of SWAGGER_TAGS) {
    builder.addTag(tag.name, tag.description);
  }

  return builder.build();
}
