import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import bcrypt from 'bcrypt';
import { DatabaseService } from '../database/database.service.js';
import { MailService } from '../mail/mail.service.js';
import type { RegisterSchoolDto } from './dto/register-school.dto.js';
import type { ResendVerificationDto } from './dto/resend-verification.dto.js';
import type { VerifyEmailDto } from './dto/verify-email.dto.js';
import {
  createVerificationToken,
  hashToken,
  isExpired,
  verificationExpiry,
} from './verification-token.util.js';

interface VerificationUserRow {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  is_verified: boolean;
  verification_token_expires_at: string | null;
}

@Injectable()
export class RegistrationService {
  constructor(
    private readonly database: DatabaseService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterSchoolDto) {
    if (await this.emailTaken(dto.email)) {
      throw new ConflictException({
        code: 'SCHOOL_EMAIL_TAKEN',
        message: 'That email is already registered',
      });
    }

    const { data: school, error: schoolError } = await this.database.client
      .from('schools')
      .insert({
        name: dto.schoolName,
        slug: await this.uniqueSlug(dto.schoolName),
        address: dto.address ?? null,
        contact_email: dto.contactEmail,
        contact_phone: dto.contactPhone ?? null,
      })
      .select('id, name, slug')
      .single();

    if (schoolError || !school) {
      throw new InternalServerErrorException({
        code: 'INTERNAL_ERROR',
        message: 'Could not create the school',
      });
    }

    const token = createVerificationToken();
    const expiresAt = verificationExpiry();
    const passwordHash = await bcrypt.hash(dto.password, 12);

    const { error: userError } = await this.database.client
      .from('users')
      .insert({
        school_id: school.id,
        email: dto.email,
        password_hash: passwordHash,
        role: 'ADMIN',
        is_verified: false,
        first_name: dto.adminFirstName,
        last_name: dto.adminLastName,
        verification_token_hash: hashToken(token),
        verification_token_expires_at: expiresAt.toISOString(),
      });

    if (userError) {
      await this.database.client.from('schools').delete().eq('id', school.id);
      throw new InternalServerErrorException({
        code: 'INTERNAL_ERROR',
        message: 'Could not create the admin account',
      });
    }

    await this.sendVerificationLink(
      dto.email,
      `${dto.adminFirstName} ${dto.adminLastName}`.trim(),
      token,
    );

    return {
      schoolId: school.id,
      email: dto.email,
      verification: { email: dto.email, expiresAt: expiresAt.toISOString() },
    };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const { data } = await this.database.client
      .from('users')
      .select('id, email, is_verified, verification_token_expires_at')
      .eq('verification_token_hash', hashToken(dto.token))
      .is('deleted_at', null)
      .maybeSingle();

    const user = (data as VerificationUserRow | null) ?? null;
    if (!user || isExpired(user.verification_token_expires_at)) {
      throw new BadRequestException({
        code: 'AUTH_VERIFY_TOKEN_INVALID',
        message: 'This verification link is invalid or has expired',
      });
    }

    await this.database.client
      .from('users')
      .update({
        is_verified: true,
        email_verified_at: new Date().toISOString(),
        verification_token_hash: null,
        verification_token_expires_at: null,
      })
      .eq('id', user.id);

    return { email: user.email, verified: true };
  }

  async resendVerification(dto: ResendVerificationDto) {
    const { data } = await this.database.client
      .from('users')
      .select('id, email, first_name, last_name, is_verified')
      .eq('email', dto.email)
      .is('deleted_at', null)
      .maybeSingle();

    const user = (data as VerificationUserRow | null) ?? null;
    const expiresAt = verificationExpiry();

    if (user && !user.is_verified) {
      const token = createVerificationToken();
      await this.database.client
        .from('users')
        .update({
          verification_token_hash: hashToken(token),
          verification_token_expires_at: expiresAt.toISOString(),
        })
        .eq('id', user.id);
      await this.sendVerificationLink(
        user.email,
        `${user.first_name} ${user.last_name}`.trim(),
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
    const { data } = await this.database.client
      .from('users')
      .select('id')
      .eq('email', email)
      .is('deleted_at', null)
      .maybeSingle();
    return Boolean(data);
  }

  private async uniqueSlug(name: string): Promise<string> {
    const base = slugify(name);
    let candidate = base;

    for (let suffix = 2; suffix < 50; suffix += 1) {
      const { data } = await this.database.client
        .from('schools')
        .select('id')
        .eq('slug', candidate)
        .maybeSingle();
      if (!data) return candidate;
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
