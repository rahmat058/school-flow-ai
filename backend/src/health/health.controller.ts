import { Controller, Get } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator.js';
import { ResponseMessage } from '../common/decorators/response-message.decorator.js';
import { HealthService } from './health.service.js';
import type { HealthStatus } from './health.interface.js';

@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Public()
  @Get()
  @ResponseMessage('Service is healthy')
  check(): HealthStatus {
    return this.health.check();
  }
}
