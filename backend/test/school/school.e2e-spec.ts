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
 * The list envelope: `data` holds the page and `meta` the pagination plus its
 * `self`/`first`/`last`/`prev`/`next` links. Seed two schools, find them through
 * `?search=`, and assert both pages and the links between them.
 */
describe('Schools (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let token: string;
  let schoolIds: string[] = [];

  const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

  const api = () => request(app.getHttpServer());

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

    token = jwt.sign({
      sub: randomUUID(),
      sid: schoolIds[0],
      email: `list.${suffix}@schoolflow.test`,
      role: 'ADMIN',
    });

    await app.init();
  });

  afterAll(async () => {
    if (schoolIds.length) {
      await dataSource.getRepository(School).delete(schoolIds);
    }
    await app?.close();
  });

  it('refuses the list without a token', async () => {
    const res = await api().get('/api/v1/schools');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTH_UNAUTHENTICATED');
  });

  it('pages the list and carries self/first/last/prev/next links', async () => {
    const res = await api()
      .get(`/api/v1/schools?search=${suffix}&limit=1&page=1`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Schools retrieved');
    expect(res.body.data).toHaveLength(1);
    expect(schoolIds).toContain(res.body.data[0].id);

    const { meta } = res.body;
    expect(meta).toMatchObject({ page: 1, limit: 1, totalItems: 2, totalPage: 2 });

    // Links are API-relative (no `/api/v1`) and keep the filters that came in.
    expect(meta.links.self.startsWith('/schools?')).toBe(true);
    expect(paramsOf(meta.links.self).get('search')).toBe(suffix);
    expect(paramsOf(meta.links.self).get('page')).toBe('1');
    expect(paramsOf(meta.links.self).get('limit')).toBe('1');
    expect(paramsOf(meta.links.first).get('page')).toBe('1');
    expect(paramsOf(meta.links.last).get('page')).toBe('2');
    expect(meta.links.prev).toBeNull();
    expect(paramsOf(meta.links.next).get('page')).toBe('2');
  });

  it('walks to the last page and closes the next link', async () => {
    const res = await api()
      .get(`/api/v1/schools?search=${suffix}&limit=1&page=2`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.meta.page).toBe(2);
    expect(paramsOf(res.body.meta.links.prev).get('page')).toBe('1');
    expect(res.body.meta.links.next).toBeNull();
  });

  it('attaches resource links to a single school', async () => {
    const id = schoolIds[0];
    const res = await api()
      .get(`/api/v1/schools/${id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(id);
    expect(res.body.data.links).toEqual({
      self: '/schools',
      get: `/schools/${id}`,
      update: `/schools/${id}`,
      delete: `/schools/${id}`,
    });
  });

  it('answers a missing school with 404 and a statusCode', async () => {
    const res = await api()
      .get(`/api/v1/schools/${randomUUID()}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ success: false, statusCode: 404 });
    expect(res.body.error.code).toBe('SCHOOL_NOT_FOUND');
    expect(res.body.message).toBe('School not found');
  });

  it('rejects a malformed id before it reaches the database', async () => {
    const res = await api()
      .get('/api/v1/schools/not-a-uuid')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.statusCode).toBe(400);
  });
});
