import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { School } from '../database/entities/school.entity.js';
import { SchoolController } from './school.controller.js';
import { SchoolService } from './school.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([School])],
  controllers: [SchoolController],
  providers: [SchoolService],
})
export class SchoolModule {}
