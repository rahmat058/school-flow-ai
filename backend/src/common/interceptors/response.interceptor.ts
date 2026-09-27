import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { map, type Observable } from 'rxjs';
import { RESPONSE_MESSAGE_KEY } from '../decorators/response-message.decorator.js';

export interface SuccessEnvelope<T> {
  success: true;
  message: string;
  data: T;
}

const METHOD_MESSAGES: Record<string, string> = {
  GET: 'Data retrieved',
  POST: 'Request processed',
  PATCH: 'Resource updated',
  PUT: 'Resource updated',
  DELETE: 'Resource deleted',
};

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<SuccessEnvelope<unknown>> {
    const message =
      this.reflector.getAllAndOverride<string>(RESPONSE_MESSAGE_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? defaultMessage(context);

    return next
      .handle()
      .pipe(map((data: unknown) => ({ success: true as const, message, data })));
  }
}

function defaultMessage(context: ExecutionContext): string {
  const request = context.switchToHttp().getRequest<Request>();
  return METHOD_MESSAGES[request.method] ?? 'Request successful';
}
