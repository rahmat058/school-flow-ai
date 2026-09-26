import type { DataSourceOptions } from 'typeorm';
import { School } from './entities/school.entity.js';
import { User } from './entities/user.entity.js';

export type EnvReader = (key: string) => string | undefined;

/**
 * The one place the Postgres connection is declared — read by the global
 * `DatabaseModule` through `ConfigService`.
 *
 * `synchronize` is deliberately off: TypeORM only maps these entities onto the
 * tables that already exist. The schema itself is applied by hand, so the ORM
 * can never reshape a shared database.
 */
export function buildDataSourceOptions(read: EnvReader): DataSourceOptions {
  const url = read('DATABASE_URL');
  if (!url) {
    throw new Error('DATABASE_URL is not set — see backend/.env.example');
  }

  return {
    type: 'postgres',
    url,
    // Supabase's pooler presents a certificate chain Node's default CA store
    // does not trust, so verification is relaxed for the managed endpoint.
    ssl: { rejectUnauthorized: false },
    entities: [School, User],
    synchronize: false,
  };
}
