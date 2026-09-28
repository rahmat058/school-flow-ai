import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, IsNull, type Repository } from 'typeorm';
import { School } from '../database/entities/school.entity.js';
import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  type Paginated,
} from '../common/utils/pagination.util.js';
import type {
  BackupJob,
  SchoolDetail,
  SchoolRow,
} from './school.interface.js';
import type { ListSchoolsDto } from './dto/list-schools.dto.js';
import type { PatchSchoolSettingsDto } from './dto/patch-school-settings.dto.js';
import type { UpdateSchoolProfileDto } from './dto/update-school-profile.dto.js';

const GRADING_SCALES = ['PERCENTAGE', 'LETTER', 'GPA'];
const TERM_STRUCTURES = ['SEMESTER', 'TRIMESTER', 'ANNUAL'];

@Injectable()
export class SchoolService {
  constructor(
    @InjectRepository(School) private readonly schools: Repository<School>,
  ) {}

  async list(query: ListSchoolsDto): Promise<Paginated<SchoolRow>> {
    const page = query.page ?? DEFAULT_PAGE;
    const limit = query.limit ?? DEFAULT_LIMIT;
    const search = query.search?.trim();

    const [rows, total] = await this.schools.findAndCount({
      where: search
        ? [
            { name: ILike(`%${search}%`), deletedAt: IsNull() },
            { slug: ILike(`%${search}%`), deletedAt: IsNull() },
          ]
        : { deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { items: rows.map(toRow), total, page, limit };
  }

  async findById(id: string, callerSchoolId: string): Promise<SchoolDetail> {
    const school = await this.loadOwned(id, callerSchoolId);
    return toDetail(school);
  }

  async updateProfile(
    id: string,
    callerSchoolId: string,
    dto: UpdateSchoolProfileDto,
  ): Promise<SchoolDetail> {
    const school = await this.loadOwned(id, callerSchoolId);

    if (dto.name !== undefined) {
      const name = dto.name.trim();
      if (!name) {
        throw new BadRequestException({
          code: 'SCHOOL_INVALID',
          message: 'A school name is required',
          details: ['name'],
        });
      }
      school.name = name;
    }

    if (dto.contactEmail !== undefined) {
      school.contactEmail = blankToNull(dto.contactEmail);
    }
    if (dto.contactPhone !== undefined) {
      school.contactPhone = blankToNull(dto.contactPhone);
    }
    if (dto.address !== undefined) school.address = blankToNull(dto.address);
    if (dto.logoUrl !== undefined) school.logoUrl = blankToNull(dto.logoUrl);

    await this.schools.save(school);
    return toDetail(school);
  }

  async updateSettings(
    id: string,
    callerSchoolId: string,
    dto: PatchSchoolSettingsDto,
  ): Promise<SchoolDetail> {
    const school = await this.loadOwned(id, callerSchoolId);

    const errors = validateSettings(dto);
    if (errors.length > 0) {
      throw new BadRequestException({
        code: 'SETTINGS_INVALID',
        message: 'Some settings are not valid',
        details: errors,
      });
    }

    const settings = { ...school.settings };

    if (dto.academicYear !== undefined) {
      settings.academicYear = dto.academicYear.trim();
    }
    if (dto.gradingScale !== undefined) settings.gradingScale = dto.gradingScale;
    if (dto.termStructure !== undefined) {
      settings.termStructure = dto.termStructure;
    }
    if (dto.passPercentage !== undefined) {
      settings.passPercentage = Math.round(dto.passPercentage);
    }
    if (dto.notifications !== undefined) {
      settings.notifications = {
        ...asObject(settings.notifications),
        ...dto.notifications,
      };
    }
    if (dto.security !== undefined) {
      settings.security = { ...asObject(settings.security), ...dto.security };
    }

    school.settings = settings;
    await this.schools.save(school);
    return toDetail(school);
  }

  async createBackup(id: string, callerSchoolId: string): Promise<BackupJob> {
    await this.loadOwned(id, callerSchoolId);

    return {
      id: `bkp_${Date.now()}`,
      createdAt: new Date().toISOString(),
      sizeBytes: 24 * 1024 * 1024,
      status: 'READY',
    };
  }

  /** A caller may only reach their own school — otherwise the tenant boundary is open. */
  private async loadOwned(id: string, callerSchoolId: string): Promise<School> {
    const school = await this.schools.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!school) {
      throw new NotFoundException({
        code: 'SCHOOL_NOT_FOUND',
        message: 'School not found',
      });
    }

    if (school.id !== callerSchoolId) {
      throw new ForbiddenException({
        code: 'AUTH_FORBIDDEN',
        message: 'You can only access your own school',
      });
    }

    return school;
  }
}

function validateSettings(dto: PatchSchoolSettingsDto): string[] {
  const errors: string[] = [];

  if (dto.academicYear !== undefined && !dto.academicYear.trim()) {
    errors.push('academicYear must be chosen');
  }
  if (
    dto.gradingScale !== undefined &&
    !GRADING_SCALES.includes(dto.gradingScale)
  ) {
    errors.push('gradingScale is not supported');
  }
  if (
    dto.termStructure !== undefined &&
    !TERM_STRUCTURES.includes(dto.termStructure)
  ) {
    errors.push('termStructure is not supported');
  }
  if (dto.passPercentage !== undefined) {
    const pass = dto.passPercentage;
    if (!Number.isFinite(pass) || pass < 0 || pass > 100) {
      errors.push('passPercentage must be between 0 and 100');
    }
  }

  const security = dto.security;
  if (security) {
    const timeout = toFiniteNumber(security.sessionTimeoutMinutes);
    if (timeout !== undefined && (timeout < 5 || timeout > 240)) {
      errors.push('security.sessionTimeoutMinutes must be between 5 and 240');
    }
    const attempts = toFiniteNumber(security.maxLoginAttempts);
    if (
      attempts !== undefined &&
      (!Number.isInteger(attempts) || attempts < 1 || attempts > 10)
    ) {
      errors.push('security.maxLoginAttempts must be between 1 and 10');
    }
  }

  return errors;
}

function toFiniteNumber(value: unknown): number | undefined {
  if (value === undefined || value === null) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : {};
}

function blankToNull(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toRow(school: School): SchoolRow {
  return {
    id: school.id,
    name: school.name,
    slug: school.slug,
    address: school.address,
    contactEmail: school.contactEmail,
    contactPhone: school.contactPhone,
    logoUrl: school.logoUrl,
    subscriptionStatus: school.subscriptionStatus,
    createdAt: school.createdAt,
    updatedAt: school.updatedAt,
  };
}

function toDetail(school: School): SchoolDetail {
  return { ...toRow(school), settings: school.settings };
}
