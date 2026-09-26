import { Resend } from 'resend';
import { render } from 'react-email';
import { ConfigService } from '@nestjs/config';
import { Injectable, Logger } from '@nestjs/common';
import { VerifyEmail } from './templates/verify-email.js';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend: Resend | null;
  private readonly from: string;

  constructor(config: ConfigService) {
    const apiKey = config.get<string>('RESEND_API_KEY');
    this.resend = apiKey ? new Resend(apiKey) : null;
    this.from = config.get<string>('RESEND_FROM') ?? 'no-reply@school-flow.ai';
  }

  async sendVerificationEmail(
    to: string,
    name: string,
    link: string,
  ): Promise<void> {
    if (!this.resend) {
      this.logger.warn(
        `RESEND_API_KEY is not set — verification link for ${to}: ${link}`,
      );
      return;
    }

    const html = await render(VerifyEmail({ name, link }));
    await this.resend.emails.send({
      from: this.from,
      to,
      subject: 'Verify your School Flow AI email',
      html,
    });
  }
}
