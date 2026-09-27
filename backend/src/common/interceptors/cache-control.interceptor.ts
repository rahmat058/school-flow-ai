import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Response } from 'express';
import type { Observable } from 'rxjs';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';

const PUBLIC_CACHE_CONTROL = 'public, max-age=60';
const PRIVATE_CACHE_CONTROL = 'private, max-age=5';

@Injectable()
export class CacheControlInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const response = context.switchToHttp().getResponse<Response>();

    response.setHeader(
      'Cache-Control',
      isPublic ? PUBLIC_CACHE_CONTROL : PRIVATE_CACHE_CONTROL,
    );

    return next.handle();
  }
}
