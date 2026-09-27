import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { STATUS_CODES } from 'node:http';
import type { Request, Response } from 'express';

const DEFAULT_CODES: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'VALIDATION_ERROR',
  [HttpStatus.UNAUTHORIZED]: 'AUTH_UNAUTHENTICATED',
  [HttpStatus.FORBIDDEN]: 'AUTH_FORBIDDEN',
  [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
  [HttpStatus.CONFLICT]: 'CONFLICT',
};

interface ErrorBody {
  code: string;
  message: string;
  details?: string[];
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const request = host.switchToHttp().getRequest<Request>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const body = this.toErrorBody(exception, status);

    const text = STATUS_CODES[status] ?? 'Unknown Status';
    const line = `${request.method} ${request.originalUrl} ${status} ${text} — ${this.exceptionName(exception)}: ${body.code}: ${body.message}`;

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        line,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(line);
    }

    response
      .status(status)
      .json({ success: false, message: body.message, error: body });
  }

  private exceptionName(exception: unknown): string {
    return exception instanceof Error
      ? exception.constructor.name
      : 'UnknownException';
  }

  private toErrorBody(exception: unknown, status: number): ErrorBody {
    const fallbackCode = DEFAULT_CODES[status] ?? 'INTERNAL_ERROR';
    const payload =
      exception instanceof HttpException ? exception.getResponse() : null;

    if (typeof payload === 'string') {
      return { code: fallbackCode, message: payload };
    }

    if (payload && typeof payload === 'object') {
      const record = payload as Record<string, unknown>;
      const rawMessage = record.message;
      const message = Array.isArray(rawMessage)
        ? rawMessage.join(', ')
        : typeof rawMessage === 'string'
          ? rawMessage
          : 'Request failed';
      const details = Array.isArray(record.details)
        ? (record.details as string[])
        : Array.isArray(rawMessage)
          ? (rawMessage as string[])
          : undefined;
      const code = typeof record.code === 'string' ? record.code : fallbackCode;
      return details ? { code, message, details } : { code, message };
    }

    return { code: 'INTERNAL_ERROR', message: 'Internal server error' };
  }
}
