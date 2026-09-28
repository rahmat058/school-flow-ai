import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { Test, type TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module.js';
import { School } from '../../src/database/entities/school.entity.js';

/** The query params of a response link, so ordering in the string does not matter. */
const paramsOf = (link: string): URLSearchParams =>
  new URLSearchParams(link.split('?')[1] ?? '');

/**
 * The school routes: the paginated list and the `:id`-addressed profile/settings/backup family,
 * guarded by `RolesGuard` (ADMIN only) and an ownership check (a caller may only reach their own
 * school). Two schools are seeded so both the pagination and the cross-tenant refusal are real.
 */
describe('Schools (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminToken: string;
  let schoolIds: string[] = [];

  const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

  const api = () => request(app.getHttpServer());

  const signToken = (jwt: JwtService, role: string, schoolId: string) =>
    jwt.sign({
      sub: randomUUID(),
      sid: schoolId,
      email: `${role.toLowerCase()}.${suffix}@schoolflow.test`,
      role,
    });

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

    dataSource = moduleFixture.get(DataSource);
    const jwt = moduleFixture.get(JwtService);

    const schools = dataSource.getRepository(School);
    const created = await schools.save(
      [`Alpha ${suffix}`, `Beta ${suffix}`].map((name, index) =>
        schools.create({
          name,
          slug: `list-school-${suffix}-${index}`,
          contactEmail: `list.${suffix}.${index}@schoolflow.test`,
        }),
      ),
    );
    schoolIds = created.map((school) => school.id);

    adminToken = signToken(jwt, 'ADMIN', schoolIds[0]);

    await app.init();
  });

  afterAll(async () => {
    if (schoolIds.length) {
      await dataSource.getRepository(School).delete(schoolIds);
    }
    await app?.close();
  });

  describe('GET /schools', () => {
    it('refuses without a token', async () => {
      const res = await api().get('/api/v1/schools');

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('AUTH_UNAUTHENTICATED');
    });

    it('pages the list and carries self/first/last/prev/next links', async () => {
      const res = await api()
        .get(`/api/v1/schools?search=${suffix}&limit=1&page=1`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status, JSON.stringify(res.body)).toBe(200);
      expect(res.body.message).toBe('Schools retrieved');
      expect(res.body.data).toHaveLength(1);
      expect(schoolIds).toContain(res.body.data[0].id);

      const { meta } = res.body;
      expect(meta).toMatchObject({ page: 1, limit: 1, totalItems: 2, totalPage: 2 });
      expect(meta.links.self.startsWith('/schools?')).toBe(true);
      expect(paramsOf(meta.links.self).get('search')).toBe(suffix);
      expect(paramsOf(meta.links.self).get('page')).toBe('1');
      expect(meta.links.prev).toBeNull();
      expect(paramsOf(meta.links.next).get('page')).toBe('2');
    });

    it('closes the next link on the last page', async () => {
      const res = await api()
        .get(`/api/v1/schools?search=${suffix}&limit=1&page=2`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(paramsOf(res.body.meta.links.prev).get('page')).toBe('1');
      expect(res.body.meta.links.next).toBeNull();
    });

    it('refuses a non-admin role', async () => {
      const jwt = app.get(JwtService);
      const teacher = signToken(jwt, 'TEACHER', schoolIds[0]);

      const res = await api()
        .get('/api/v1/schools')
        .set('Authorization', `Bearer ${teacher}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('AUTH_FORBIDDEN');
    });
  });

  describe('GET /schools/:id', () => {
    it('returns the caller’s own school with settings and links', async () => {
      const id = schoolIds[0];
      const res = await api()
        .get(`/api/v1/schools/${id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(id);
      expect(res.body.data).toHaveProperty('settings');
      expect(res.body.data.links).toEqual({
        self: '/schools',
        get: `/schools/${id}`,
        update: `/schools/${id}`,
        delete: `/schools/${id}`,
      });
    });

    it('refuses another school (ownership)', async () => {
      const res = await api()
        .get(`/api/v1/schools/${schoolIds[1]}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('AUTH_FORBIDDEN');
    });

    it('answers a missing school with 404 and a statusCode', async () => {
      const res = await api()
        .get(`/api/v1/schools/${randomUUID()}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({ success: false, statusCode: 404 });
      expect(res.body.error.code).toBe('SCHOOL_NOT_FOUND');
    });

    it('rejects a malformed id before it reaches the database', async () => {
      const res = await api()
        .get('/api/v1/schools/not-a-uuid')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.statusCode).toBe(400);
    });
  });

  describe('PATCH /schools/:id', () => {
    it('updates the profile columns and clears a blank contact field', async () => {
      const id = schoolIds[0];
      const res = await api()
        .patch(`/api/v1/schools/${id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: `Renamed ${suffix}`, address: '   ', contactPhone: '+8801700000000' });

      expect(res.status, JSON.stringify(res.body)).toBe(200);
      expect(res.body.data.name).toBe(`Renamed ${suffix}`);
      expect(res.body.data.address).toBeNull();
      expect(res.body.data.contactPhone).toBe('+8801700000000');
    });

    it('refuses a blank name with SCHOOL_INVALID', async () => {
      const res = await api()
        .patch(`/api/v1/schools/${schoolIds[0]}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: '   ' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('SCHOOL_INVALID');
      expect(res.body.error.details).toContain('name');
    });
  });

  describe('PATCH /schools/:id/settings', () => {
    it('merges only the keys sent', async () => {
      const id = schoolIds[0];
      const res = await api()
        .patch(`/api/v1/schools/${id}/settings`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ gradingScale: 'GPA', security: { sessionTimeoutMinutes: 45 } });

      expect(res.status, JSON.stringify(res.body)).toBe(200);
      expect(res.body.data.settings).toMatchObject({
        gradingScale: 'GPA',
      });
      expect((res.body.data.settings as Record<string, unknown>).security).toMatchObject({
        sessionTimeoutMinutes: 45,
      });
    });

    it('refuses an unsupported value with SETTINGS_INVALID and details', async () => {
      const res = await api()
        .patch(`/api/v1/schools/${schoolIds[0]}/settings`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ gradingScale: 'NOPE' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('SETTINGS_INVALID');
      expect(res.body.error.details).toContain('gradingScale is not supported');
    });
  });

  describe('POST /schools/:id/backup', () => {
    it('answers 201 with a job record', async () => {
      const res = await api()
        .post(`/api/v1/schools/${schoolIds[0]}/backup`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(201);
      expect(res.body.data).toMatchObject({ status: 'READY' });
      expect(typeof res.body.data.id).toBe('string');
    });
  });
});
