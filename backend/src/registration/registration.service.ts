import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import bcrypt from 'bcrypt';
import { DataSource, IsNull, Repository } from 'typeorm';
import { Role } from '../common/enums/role.enum.js';
import { School } from '../database/entities/school.entity.js';
import { User } from '../database/entities/user.entity.js';
import { MailService } from '../mail/mail.service.js';
import type { RegisterSchoolDto } from './dto/register-school.dto.js';
import type { ResendVerificationDto } from './dto/resend-verification.dto.js';
import type { VerifyEmailDto } from './dto/verify-email.dto.js';
import type {
  RegisteredSchool,
  VerificationSent,
  VerifiedEmail,
} from './registration.interface.js';
import {
  createVerificationToken,
  hashToken,
  isExpired,
  verificationExpiry,
} from '../common/utils/verification-token.util.js';

@Injectable()
export class RegistrationService {
  constructor(
    @InjectRepository(School)
    private readonly schools: Repository<School>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterSchoolDto): Promise<RegisteredSchool> {
    if (await this.emailTaken(dto.email)) {
      throw new ConflictException({
        code: 'SCHOOL_EMAIL_TAKEN',
        message: 'That email is already registered',
      });
    }

    const slug = await this.uniqueSlug(dto.schoolName);
    const token = createVerificationToken();
    const expiresAt = verificationExpiry();
    const passwordHash = await bcrypt.hash(dto.password, 12);

    // School + admin login are one unit of work: a failure in either rolls the
    // whole registration back.
    const schoolId = await this.dataSource.transaction(async (manager) => {
      const school = await manager.getRepository(School).save(
        manager.getRepository(School).create({
          name: dto.schoolName,
          slug,
          address: dto.address ?? null,
          contactEmail: dto.contactEmail,
          contactPhone: dto.contactPhone ?? null,
        }),
      );

      await manager.getRepository(User).save(
        manager.getRepository(User).create({
          schoolId: school.id,
          email: dto.email,
          passwordHash,
          role: Role.ADMIN,
          isVerified: false,
          firstName: dto.adminFirstName,
          lastName: dto.adminLastName,
          verificationTokenHash: hashToken(token),
          verificationTokenExpiresAt: expiresAt,
        }),
      );

      return school.id;
    });

    await this.sendVerificationLink(
      dto.email,
      `${dto.adminFirstName} ${dto.adminLastName}`.trim(),
      token,
    );

    return {
      schoolId,
      email: dto.email,
      verification: { email: dto.email, expiresAt: expiresAt.toISOString() },
    };
  }

  async verifyEmail(dto: VerifyEmailDto): Promise<VerifiedEmail> {
    const user = await this.users.findOne({
      where: {
        verificationTokenHash: hashToken(dto.token),
        deletedAt: IsNull(),
      },
    });

    if (
      !user ||
      isExpired(user.verificationTokenExpiresAt?.toISOString() ?? null)
    ) {
      throw new BadRequestException({
        code: 'AUTH_VERIFY_TOKEN_INVALID',
        message: 'This verification link is invalid or has expired',
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

    return { email: user.email, verified: true };
  }

  async resendVerification(
    dto: ResendVerificationDto,
  ): Promise<VerificationSent> {
    const user = await this.users.findOne({
      where: { email: dto.email, deletedAt: IsNull() },
    });

    const expiresAt = verificationExpiry();

    if (user && !user.isVerified) {
      const token = createVerificationToken();
      await this.users.update(
        { id: user.id },
        {
          verificationTokenHash: hashToken(token),
          verificationTokenExpiresAt: expiresAt,
        },
      );
      await this.sendVerificationLink(
        user.email,
        `${user.firstName} ${user.lastName}`.trim(),
        token,
      );
    }

    return { sent: true, expiresAt: expiresAt.toISOString() };
  }

  private async sendVerificationLink(
    email: string,
    name: string,
    token: string,
  ): Promise<void> {
    const clientUrl =
      this.config.get<string>('CLIENT_URL') ?? 'http://localhost:5173';
    await this.mail.sendVerificationEmail(
      email,
      name,
      `${clientUrl}/verify-email?token=${token}`,
    );
  }

  private async emailTaken(email: string): Promise<boolean> {
    const found = await this.users.findOne({
      where: { email, deletedAt: IsNull() },
      select: { id: true },
    });
    return Boolean(found);
  }

  private async uniqueSlug(name: string): Promise<string> {
    const base = slugify(name);
    let candidate = base;

    for (let suffix = 2; suffix < 50; suffix += 1) {
      const taken = await this.schools.findOne({
        where: { slug: candidate },
        select: { id: true },
      });
      if (!taken) return candidate;
      candidate = `${base}-${suffix}`;
    }

    return `${base}-${Date.now()}`;
  }
}

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return slug.length > 0 ? slug : 'school';
}
