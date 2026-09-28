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
import { RESOURCE_KEY } from '../decorators/resource.decorator.js';
import {
  buildPaginationMeta,
  buildResourceLinks,
  isPaginated,
  relativePath,
  type PaginationMeta,
} from '../utils/pagination.util.js';

export interface SuccessEnvelope<T> {
  success: true;
  message: string;
  data: T;
  meta?: PaginationMeta;
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

    const resource = this.reflector.getAllAndOverride<string>(RESOURCE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest<Request>();

    return next
      .handle()
      .pipe(map((data: unknown) => toEnvelope(data, message, resource, request)));
  }
}

function toEnvelope(
  data: unknown,
  message: string,
  resource: string | undefined,
  request: Request,
): SuccessEnvelope<unknown> {
  if (isPaginated(data)) {
    return {
      success: true,
      message,
      data: data.items,
      meta: buildPaginationMeta({
        path: relativePath(request.path),
        query: request.query as Record<string, unknown>,
        page: data.page,
        limit: data.limit,
        total: data.total,
      }),
    };
  }

  if (resource && hasStringId(data)) {
    return {
      success: true,
      message,
      data: { ...data, links: buildResourceLinks(resource, data.id) },
    };
  }

  return { success: true, message, data };
}

function hasStringId(
  value: unknown,
): value is Record<string, unknown> & { id: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { id?: unknown }).id === 'string'
  );
}

function defaultMessage(context: ExecutionContext): string {
  const request = context.switchToHttp().getRequest<Request>();
  return METHOD_MESSAGES[request.method] ?? 'Request successful';
}
