import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../common/decorators/current-user.decorator.js';

import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { Public } from '../common/decorators/public.decorator.js';
import { VerifyEmailDto } from '../registration/dto/verify-email.dto.js';
import { RegistrationService } from '../registration/registration.service.js';
import { ResponseMessage } from '../common/decorators/response-message.decorator.js';
import { ResendVerificationDto } from '../registration/dto/resend-verification.dto.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly registrationService: RegistrationService,
  ) {}

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

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Signed in successfully')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Session refreshed')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto);
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Signed out')
  logout() {
    return this.authService.logout();
  }

  @Get('me')
  @ResponseMessage('User Profile loaded')
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.me(user);
  }
}
