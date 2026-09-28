import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, IsNull, type Repository } from 'typeorm';
import { School } from '../database/entities/school.entity.js';
import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  type Paginated,
} from '../common/utils/pagination.util.js';
import type { ListSchoolsDto } from './dto/list-schools.dto.js';
import type { SchoolRow } from './school.interface.js';

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

  async findOne(id: string): Promise<SchoolRow> {
    const school = await this.schools.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!school) {
      throw new NotFoundException({
        code: 'SCHOOL_NOT_FOUND',
        message: 'School not found',
      });
    }

    return toRow(school);
  }
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
