import { Injectable } from '@nestjs/common';
import type { HealthStatus } from './health.interface.js';

@Injectable()
export class HealthService {
  private readonly startedAt = Date.now();

  check(): HealthStatus {
    return {
      status: 'ok',
      uptimeSeconds: Math.floor((Date.now() - this.startedAt) / 1000),
      timestamp: new Date().toISOString(),
    };
  }
}
