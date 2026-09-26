import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator.js';
import type { Role } from '../common/enums/role.enum.js';
import { DatabaseService } from '../database/database.service.js';
import type { LoginDto } from './dto/login.dto.js';
import type { RefreshTokenDto } from './dto/refresh-token.dto.js';
import type { AccessTokenPayload } from './strategies/jwt.strategy.js';

export const ACCESS_TTL_SECONDS = 15 * 60;
export const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60;

interface UserRow {
  id: string;
  school_id: string;
  email: string;
  password_hash: string;
  role: Role;
  is_verified: boolean;
  first_name: string;
  last_name: string;
  profile_id: string | null;
  class_id: string | null;
}

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  schoolId: string;
  isVerified: boolean;
  profileId: string | null;
  firstName: string;
  lastName: string;
  classId: string | null;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly database: DatabaseService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: LoginDto): Promise<AuthSession> {
    const user = await this.findByEmail(dto.email);
    if (!user || !(await bcrypt.compare(dto.password, user.password_hash))) {
      throw new UnauthorizedException({
        code: 'AUTH_INVALID_CREDENTIALS',
        message: 'Email or password is incorrect',
      });
    }
    if (!user.is_verified) {
      throw new ForbiddenException({
        code: 'AUTH_NOT_VERIFIED',
        message:
          'Confirm the link in your verification email before signing in',
      });
    }

    await this.database.client
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id);

    return this.issueSession(user);
  }

  async refresh(dto: RefreshTokenDto): Promise<AuthSession> {
    let payload: { sub?: string } | null = null;
    try {
      payload = await this.jwt.verifyAsync<{ sub?: string }>(dto.refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      payload = null;
    }

    const user = payload?.sub ? await this.findById(payload.sub) : null;
    if (!user) {
      throw new UnauthorizedException({
        code: 'AUTH_SESSION_EXPIRED',
        message: 'Your session has expired',
      });
    }
    return this.issueSession(user);
  }

  logout(): { loggedOut: true } {
    return { loggedOut: true };
  }

  async me(current: AuthenticatedUser) {
    const user = await this.findById(current.id);
    if (!user) {
      throw new UnauthorizedException({
        code: 'AUTH_UNAUTHENTICATED',
        message: 'Not signed in',
      });
    }

    const { data: school } = await this.database.client
      .from('schools')
      .select('id, name, slug')
      .eq('id', user.school_id)
      .maybeSingle();

    return { ...this.toAuthUser(user), school: school ?? null };
  }

  private issueSession(user: UserRow): AuthSession {
    const payload: AccessTokenPayload = {
      sub: user.id,
      sid: user.school_id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwt.sign(payload, {
      expiresIn: ACCESS_TTL_SECONDS,
    });
    const refreshToken = this.jwt.sign(payload, {
      secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: REFRESH_TTL_SECONDS,
    });

    return {
      user: this.toAuthUser(user),
      accessToken,
      refreshToken,
      expiresAt: new Date(Date.now() + ACCESS_TTL_SECONDS * 1000).toISOString(),
    };
  }

  private toAuthUser(user: UserRow): AuthUser {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      schoolId: user.school_id,
      isVerified: user.is_verified,
      profileId: user.profile_id,
      firstName: user.first_name,
      lastName: user.last_name,
      classId: user.class_id,
    };
  }

  private async findByEmail(email: string): Promise<UserRow | null> {
    const { data } = await this.database.client
      .from('users')
      .select('*')
      .eq('email', email)
      .is('deleted_at', null)
      .maybeSingle();
    return (data as UserRow | null) ?? null;
  }

  private async findById(id: string): Promise<UserRow | null> {
    const { data } = await this.database.client
      .from('users')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();
    return (data as UserRow | null) ?? null;
  }
}
