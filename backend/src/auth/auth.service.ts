import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { IsNull, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import type { LoginDto } from './dto/login.dto.js';
import { School } from '../database/entities/school.entity.js';
import { User } from '../database/entities/user.entity.js';
import type { RefreshTokenDto } from './dto/refresh-token.dto.js';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator.js';
import type {
  AccessTokenPayload,
  AuthProfile,
  AuthSession,
  AuthUser,
  LogoutResult,
} from './auth.interface.js';

export const ACCESS_TTL_SECONDS = 7 * 24 * 60 * 60;       // eg: 7d
export const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60;     // eg: 7d

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(School)
    private readonly schools: Repository<School>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: LoginDto): Promise<AuthSession> {
    const user = await this.findByEmail(dto.email);
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException({
        code: 'AUTH_INVALID_CREDENTIALS',
        message: 'Email or password is incorrect',
      });
    }
    if (!user.isVerified) {
      throw new ForbiddenException({
        code: 'AUTH_NOT_VERIFIED',
        message:
          'Confirm the link in your verification email before signing in',
      });
    }

    await this.users.update({ id: user.id }, { lastLoginAt: new Date() });

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

  logout(): LogoutResult {
    return { loggedOut: true };
  }

  async me(current: AuthenticatedUser): Promise<AuthProfile> {
    const user = await this.findById(current.id);
    if (!user) {
      throw new UnauthorizedException({
        code: 'AUTH_UNAUTHENTICATED',
        message: 'Not signed in',
      });
    }

    const school = await this.schools.findOne({
      where: { id: user.schoolId },
      select: { id: true, name: true, slug: true },
    });

    return { ...this.toAuthUser(user), school };
  }

  private issueSession(user: User): AuthSession {
    const payload: AccessTokenPayload = {
      sub: user.id,
      sid: user.schoolId,
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

  private toAuthUser(user: User): AuthUser {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId,
      isVerified: user.isVerified,
      profileId: user.profileId,
      firstName: user.firstName,
      lastName: user.lastName,
      classId: user.classId,
    };
  }

  private findByEmail(email: string): Promise<User | null> {
    return this.users.findOne({
      where: { email, deletedAt: IsNull() },
    });
  }

  private findById(id: string): Promise<User | null> {
    return this.users.findOne({
      where: { id, deletedAt: IsNull() },
    });
  }
}
