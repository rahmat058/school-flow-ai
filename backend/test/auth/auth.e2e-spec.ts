import bcrypt from 'bcrypt';
import request from 'supertest';
import { createHash } from 'node:crypto';
import { AppModule } from '../../src/app.module.js';
import { MailService } from '../../src/mail/mail.service.js';
import { DataSource } from 'typeorm';
import { School } from '../../src/database/entities/school.entity.js';
import { User } from '../../src/database/entities/user.entity.js';
import { JwtService } from '@nestjs/jwt';
import { Test, type TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';

const HEX64 = /^[0-9a-f]{64}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface SentMail {
  to: string;
  name: string;
  link: string;
}

const tokenFrom = (link: string): string => {
  const token = new URL(link).searchParams.get('token');
  if (!token) throw new Error(`No token in verification link: ${link}`);
  return token;
};

const sha256 = (value: string): string =>
  createHash('sha256').update(value).digest('hex');

/**
 * End-to-end auth lifecycle against the real Supabase project: register a
 * school, verify the emailed link, sign in, read the session, refresh and log
 * out — asserting the rows the API writes and the values it refuses to expose.
 * The verification mail is captured in-memory so the flow does not need an inbox.
 */
describe('Auth flow (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminSchoolId: string;
  let rotateSchoolId: string;
  let accessToken: string;
  let refreshToken: string;
  let adminUserId: string;
  let jwt: JwtService;

  const sent: SentMail[] = [];
  const password = 'FlowTest123!';
  const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

  const admin = {
    schoolName: `Flow Test School ${suffix}`,
    address: '12 Test Lane',
    contactEmail: `contact.${suffix}@schoolflow.test`,
    contactPhone: '+8801700000000',
    adminFirstName: 'Flow',
    adminLastName: 'Admin',
    email: `flow.admin.${suffix}@schoolflow.test`,
  };

  const rotator = {
    schoolName: `Rotate School ${suffix}`,
    contactEmail: `rotate.${suffix}@schoolflow.test`,
    adminFirstName: 'Rotate',
    adminLastName: 'Admin',
    email: `flow.rotate.${suffix}@schoolflow.test`,
  };

  const api = () => request(app.getHttpServer());

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

    const mail = moduleFixture.get(MailService);
    vi.spyOn(mail, 'sendVerificationEmail').mockImplementation(
      async (to: string, name: string, link: string) => {
        sent.push({ to, name, link });
      },
    );

    dataSource = moduleFixture.get(DataSource);
    jwt = moduleFixture.get(JwtService);
    await app.init();
  });

  afterAll(async () => {
    for (const schoolId of [adminSchoolId, rotateSchoolId]) {
      if (!schoolId) continue;
      await dataSource.getRepository(User).delete({ schoolId });
      await dataSource.getRepository(School).delete({ id: schoolId });
    }
    await app?.close();
  });

  const register = (payload: Record<string, unknown>) =>
    api().post('/api/v1/schools/register').send(payload);

  const login = (email: string, pass: string) =>
    api().post('/api/v1/auth/login').send({ email, password: pass });

  describe('registration', () => {
    it('creates the school and emails a verification link', async () => {
      const res = await register({ ...admin, password });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.schoolId).toMatch(UUID);
      expect(res.body.data.email).toBe(admin.email);
      expect(res.body.data.verification.email).toBe(admin.email);
      expect(JSON.stringify(res.body)).not.toContain(password);

      adminSchoolId = res.body.data.schoolId;

      expect(sent).toHaveLength(1);
      expect(sent[0].to).toBe(admin.email);
      expect(sent[0].name).toBe('Flow Admin');
      expect(sent[0].link).toContain('/verify-email?token=');
      expect(tokenFrom(sent[0].link)).toMatch(HEX64);
    });

    it('persists the school exactly as submitted', async () => {
      const school = await dataSource
        .getRepository(School)
        .findOne({ where: { id: adminSchoolId } });

      expect(school).toMatchObject({
        name: admin.schoolName,
        address: admin.address,
        contactEmail: admin.contactEmail,
        contactPhone: admin.contactPhone,
        subscriptionStatus: 'TRIAL',
        settings: {},
        deletedAt: null,
      });
      expect(school?.slug).toMatch(/^flow-test-school-/);
    });

    it('stores the admin login unverified, with a bcrypt hash and a hashed token', async () => {
      const user = await dataSource
        .getRepository(User)
        .findOne({ where: { email: admin.email } });

      expect(user).toMatchObject({
        schoolId: adminSchoolId,
        role: 'ADMIN',
        isVerified: false,
        emailVerifiedAt: null,
        profileId: null,
        classId: null,
        deletedAt: null,
        firstName: 'Flow',
        lastName: 'Admin',
      });

      const passwordHash = user?.passwordHash ?? '';
      expect(passwordHash).not.toBe(password);
      expect(await bcrypt.compare(password, passwordHash)).toBe(true);

      const token = tokenFrom(sent[0].link);
      expect(user?.verificationTokenHash).toBe(sha256(token));
      const ttl =
        (user?.verificationTokenExpiresAt?.getTime() ?? 0) - Date.now();
      expect(ttl).toBeGreaterThan(23 * 60 * 60 * 1000);
      expect(ttl).toBeLessThan(25 * 60 * 60 * 1000);
    });

    it('refuses a second school on an already-registered email', async () => {
      const res = await register({
        ...admin,
        schoolName: `Dupe School ${suffix}`,
        password,
      });

      expect(res.status, JSON.stringify(res.body)).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('SCHOOL_EMAIL_TAKEN');
    });

    it('rejects a malformed body', async () => {
      const res = await register({ email: 'not-an-email', password: 'short' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(Array.isArray(res.body.error.details)).toBe(true);
    });
  });

  describe('login before verification', () => {
    it('rejects a malformed body', async () => {
      const res = await api()
        .post('/api/v1/auth/login')
        .send({ email: 'not-an-email', password: 'short' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(Array.isArray(res.body.error.details)).toBe(true);
    });

    it('refuses an unverified account with AUTH_NOT_VERIFIED', async () => {
      const res = await login(admin.email, password);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('AUTH_NOT_VERIFIED');
    });

    it('checks the password before the verification flag', async () => {
      const res = await login(admin.email, 'wrong-password');

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('AUTH_INVALID_CREDENTIALS');
    });

    it('refuses an unknown email', async () => {
      const res = await login(`nobody.${suffix}@schoolflow.test`, password);

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('AUTH_INVALID_CREDENTIALS');
    });
  });

  describe('email verification', () => {
    it('flips the account to verified and clears the token columns', async () => {
      const token = tokenFrom(sent[0].link);
      const res = await api()
        .post('/api/v1/registration/verify-email')
        .send({ token });

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({ email: admin.email, verified: true });

      const user = await dataSource
        .getRepository(User)
        .findOne({ where: { email: admin.email } });

      expect(user?.isVerified).toBe(true);
      expect(user?.emailVerifiedAt).toBeTruthy();
      expect(user?.verificationTokenHash).toBeNull();
      expect(user?.verificationTokenExpiresAt).toBeNull();
    });

    it('rejects a reused or unknown token', async () => {
      const res = await api()
        .post('/api/v1/registration/verify-email')
        .send({ token: tokenFrom(sent[0].link) });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('AUTH_VERIFY_TOKEN_INVALID');
    });
  });

  describe('session', () => {
    it('signs a verified account in and stamps last_login_at', async () => {
      const before = Date.now();
      const res = await login(admin.email, password);

      expect(res.status).toBe(200);
      const data = res.body.data;
      expect(data.user).toMatchObject({
        email: admin.email,
        role: 'ADMIN',
        schoolId: adminSchoolId,
        isVerified: true,
      });
      expect(JSON.stringify(res.body)).not.toContain('password_hash');
      expect(data.accessToken).toBeTruthy();
      expect(data.refreshToken).toBeTruthy();
      expect(new Date(data.expiresAt).getTime()).toBeGreaterThan(before);

      accessToken = data.accessToken;
      refreshToken = data.refreshToken;
      adminUserId = data.user.id;

      const user = await dataSource.getRepository(User).findOne({
        where: { email: admin.email },
        select: { lastLoginAt: true },
      });

      expect(user?.lastLoginAt).toBeTruthy();
      expect(user?.lastLoginAt?.getTime() ?? 0).toBeGreaterThanOrEqual(
        before - 1000,
      );
    });

    it('returns the caller and their school for a valid token', async () => {
      const res = await api()
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe(admin.email);
      expect(res.body.data.isVerified).toBe(true);
      expect(res.body.data.school.id).toBe(adminSchoolId);
      expect(res.body.data.school.name).toBe(admin.schoolName);
      expect(JSON.stringify(res.body)).not.toContain('password_hash');
    });

    it('refuses /auth/me without a token', async () => {
      const res = await api().get('/api/v1/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('AUTH_UNAUTHENTICATED');
    });

    it('names a tampered token as invalid', async () => {
      const res = await api()
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}x`);

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('AUTH_TOKEN_INVALID');
    });

    it('names an expired token as expired', async () => {
      const expired = jwt.sign(
        {
          sub: adminUserId,
          sid: adminSchoolId,
          email: admin.email,
          role: 'ADMIN',
        },
        { expiresIn: -1 },
      );

      const res = await api()
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${expired}`);

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('AUTH_TOKEN_EXPIRED');
      expect(res.body.error.message).toMatch(/expired/i);
    });

    it('mints a fresh session from a refresh token', async () => {
      const res = await api()
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeTruthy();
      expect(res.body.data.user.email).toBe(admin.email);
    });

    it('rejects a garbage refresh token', async () => {
      const res = await api()
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'not-a-real-refresh-token-value' });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('AUTH_SESSION_EXPIRED');
    });

    it('acknowledges logout', async () => {
      const res = await api().post('/api/v1/auth/logout');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({ loggedOut: true });
    });
  });

  describe('resend verification', () => {
    let firstLink: string;

    it('registers a second admin', async () => {
      const res = await register({ ...rotator, password });

      expect(res.status).toBe(201);
      rotateSchoolId = res.body.data.schoolId;
      expect(sent).toHaveLength(2);
      firstLink = sent[1].link;
    });

    it('issues a new token and invalidates the previous link', async () => {
      const res = await api()
        .post('/api/v1/registration/resend-verification')
        .send({ email: rotator.email });

      expect(res.status).toBe(200);
      expect(res.body.data.sent).toBe(true);
      expect(sent).toHaveLength(3);
      expect(sent[2].to).toBe(rotator.email);

      const oldToken = tokenFrom(firstLink);
      const newToken = tokenFrom(sent[2].link);
      expect(newToken).not.toBe(oldToken);

      const stale = await api()
        .post('/api/v1/registration/verify-email')
        .send({ token: oldToken });
      expect(stale.status).toBe(400);
      expect(stale.body.error.code).toBe('AUTH_VERIFY_TOKEN_INVALID');

      const fresh = await api()
        .post('/api/v1/registration/verify-email')
        .send({ token: newToken });
      expect(fresh.status).toBe(200);
      expect(fresh.body.data).toEqual({ email: rotator.email, verified: true });
    });

    it('does not reveal whether an unknown address has an account', async () => {
      const res = await api()
        .post('/api/v1/registration/resend-verification')
        .send({ email: `nobody.${suffix}@schoolflow.test` });

      expect(res.status).toBe(200);
      expect(res.body.data.sent).toBe(true);
      expect(sent).toHaveLength(3);
    });
  });
});
