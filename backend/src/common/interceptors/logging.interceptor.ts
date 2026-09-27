import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  Logger,
  type NestInterceptor,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import { STATUS_CODES } from 'node:http';
import type { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const { method, originalUrl } = request;
    const action = `${context.getClass().name}.${context.getHandler().name}`;
    const startedAt = Date.now();

    // `finish` fires once the response is flushed, so the status is final —
    // unlike reading it in `tap`, which runs before Nest applies `@HttpCode`.
    response.once('finish', () => {
      const { statusCode } = response;
      // 4xx/5xx carry the thrown code and message and are logged by the global
      // exception filter; logging them here too would double-report every error.
      if (statusCode >= 400) return;
      const text = STATUS_CODES[statusCode] ?? 'Unknown Status';
      this.logger.log(
        `${method} ${originalUrl} ${statusCode} ${text} — ${action} — ${Date.now() - startedAt}ms`,
      );
    });

    return next.handle();
  }
}
