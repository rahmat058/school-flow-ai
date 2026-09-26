import { Body, Controller, Post } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator.js';
import { RegisterSchoolDto } from './dto/register-school.dto.js';
import { RegistrationService } from './registration.service.js';

@Controller('schools')
export class RegistrationController {
  constructor(private readonly registrationService: RegistrationService) {}

  @Public()
  @Post('register')
  register(@Body() dto: RegisterSchoolDto) {
    return this.registrationService.register(dto);
  }
}
