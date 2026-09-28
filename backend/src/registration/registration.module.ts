import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { School } from '../database/entities/school.entity.js';
import { User } from '../database/entities/user.entity.js';
import { MailModule } from '../mail/mail.module.js';
import { RegistrationService } from './registration.service.js';
import { RegistrationController } from './registration.controller.js';
import { RegistrationVerificationController } from './registration-verification.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([School, User]), MailModule],
  controllers: [RegistrationController, RegistrationVerificationController],
  providers: [RegistrationService],
  exports: [RegistrationService],
})
export class RegistrationModule {}
