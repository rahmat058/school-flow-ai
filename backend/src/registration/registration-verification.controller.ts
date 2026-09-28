import { ApiTags } from '@nestjs/swagger';
import { VerifyEmailDto } from './dto/verify-email.dto.js';
import { RegistrationService } from './registration.service.js';
import { Public } from '../common/decorators/public.decorator.js';
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ResponseMessage } from '../common/decorators/response-message.decorator.js';
import { ResendVerificationDto } from './dto/resend-verification.dto.js';

@ApiTags('Registration')
@Controller('registration')
export class RegistrationVerificationController {
  constructor(private readonly registrationService: RegistrationService) {}

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Email verified — you can sign in now')
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.registrationService.verifyEmail(dto);
  }

  @Public()
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Verification email sent')
  resendVerification(@Body() dto: ResendVerificationDto) {
    return this.registrationService.resendVerification(dto);
  }
}
