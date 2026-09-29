import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type {
  AccessTokenPayload,
  AuthProfile,
  AuthSession,
  AuthUser,
  InviteSent,
  InviteVerified,
  LogoutResult,
  PasswordReset,
  PasswordResetRequested,
} from './auth.interface.js';

import bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { IsNull, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import type { LoginDto } from './dto/login.dto.js';
import { User } from '../database/entities/user.entity.js';
import { School } from '../database/entities/school.entity.js';
import type { RefreshTokenDto } from './dto/refresh-token.dto.js';
import type { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import type { ResetPasswordDto } from './dto/reset-password.dto.js';
import type { VerifyInviteDto } from './dto/verify-invite.dto.js';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator.js';
import { MailService } from '../mail/mail.service.js';
import {
  createVerificationToken,
  hashToken,
  isExpired,
  verificationExpiry,
} from '../common/utils/verification-token.util.js';
import { passwordResetExpiry } from '../common/utils/password-reset-token.util.js';
import {
  createInviteCode,
  createTemporaryPassword,
} from '../common/utils/invite.util.js';

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
    private readonly mail: MailService,
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

  async forgotPassword(
    dto: ForgotPasswordDto,
  ): Promise<PasswordResetRequested> {
    const expiresAt = passwordResetExpiry();
    const user = await this.findByEmail(dto.email);

    if (user) {
      const token = createVerificationToken();
      await this.users.update(
        { id: user.id },
        {
          passwordResetTokenHash: hashToken(token),
          passwordResetTokenExpiresAt: expiresAt,
        },
      );
      await this.sendPasswordResetLink(user, token);
    }

    return { email: dto.email, expiresAt: expiresAt.toISOString() };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<PasswordReset> {
    const user = await this.users.findOne({
      where: {
        passwordResetTokenHash: hashToken(dto.token),
        deletedAt: IsNull(),
      },
    });

    if (
      !user ||
      isExpired(user.passwordResetTokenExpiresAt?.toISOString() ?? null)
    ) {
      throw new BadRequestException({
        code: 'AUTH_RESET_TOKEN_INVALID',
        message: 'This reset link has expired',
      });
    }

    await this.users.update(
      { id: user.id },
      {
        passwordHash: await bcrypt.hash(dto.password, 12),
        passwordResetTokenHash: null,
        passwordResetTokenExpiresAt: null,
      },
    );

    return { reset: true };
  }

  async verifyInvite(dto: VerifyInviteDto): Promise<InviteVerified> {
    const user = await this.findByEmail(dto.email);

    if (!user) {
      throw new NotFoundException({
        code: 'INVITE_NOT_FOUND',
        message: 'No invite for that address',
        details: ['email'],
      });
    }

    if (user.isVerified) {
      return { verified: true };
    }

    if (
      !user.verificationTokenHash ||
      user.verificationTokenHash !== hashToken(dto.code)
    ) {
      throw new BadRequestException({
        code: 'INVITE_INVALID',
        message: 'That invite code is not correct',
      });
    }

    await this.users.update(
      { id: user.id },
      {
        isVerified: true,
        emailVerifiedAt: new Date(),
        verificationTokenHash: null,
        verificationTokenExpiresAt: null,
      },
    );

    return { verified: true };
  }

  /**
   * Issues an invite to a freshly created login: generates a temporary
   * password and a 6-digit code, stores the password hash and only the code's
   * hash, then emails the login address, the password and the code. The
   * account-creation routes (teachers/students, Phase 2) call this;
   * {@link verifyInvite} is its other half.
   */
  async sendInvite(user: User): Promise<InviteSent> {
    const code = createInviteCode();
    const password = createTemporaryPassword();
    const expiresAt = verificationExpiry();

    await this.users.update(
      { id: user.id },
      {
        passwordHash: await bcrypt.hash(password, 12),
        verificationTokenHash: hashToken(code),
        verificationTokenExpiresAt: expiresAt,
      },
    );

    await this.mail.sendInviteEmail(user.email, {
      name: `${user.firstName} ${user.lastName}`.trim(),
      email: user.email,
      password,
      code,
    });

    return { email: user.email, expiresAt: expiresAt.toISOString() };
  }

  private async sendPasswordResetLink(
    user: User,
    token: string,
  ): Promise<void> {
    const clientUrl =
      this.config.get<string>('CLIENT_URL') ?? 'http://localhost:5173';
    const name = `${user.firstName} ${user.lastName}`.trim();
    await this.mail.sendPasswordResetEmail(
      user.email,
      name,
      `${clientUrl}/reset-password?token=${token}`,
    );
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
