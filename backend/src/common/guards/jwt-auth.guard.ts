import {
  type ExecutionContext,
  HttpException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';

interface ErrorBody {
  code: string;
  message: string;
}

const AUTHENTICATION_REQUIRED: ErrorBody = {
  code: 'AUTH_UNAUTHENTICATED',
  message: 'Authentication required — send a bearer access token',
};

/**
 * The failures `passport-jwt` hands back, keyed by the `name` of the error
 * `jsonwebtoken` produced — so a client can tell "expired, refresh it" apart
 * from "garbage, sign in again" instead of getting a blanket `Unauthorized`.
 */
const TOKEN_FAILURES: Record<string, ErrorBody> = {
  TokenExpiredError: {
    code: 'AUTH_TOKEN_EXPIRED',
    message: 'Your access token has expired — refresh it or sign in again',
  },
  JsonWebTokenError: {
    code: 'AUTH_TOKEN_INVALID',
    message: 'Your access token is invalid or malformed',
  },
  NotBeforeError: {
    code: 'AUTH_TOKEN_INVALID',
    message: 'Your access token is not valid yet',
  },
};

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private readonly reflector: Reflector) {
    super();
  }

  override canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }

  /**
   * The base guard collapses every failure into `401 Unauthorized`. Here the
   * reason is kept: `info` carries the `jsonwebtoken` error that
   * `passport-jwt` failed with, and `err` carries anything `validate()` threw.
   */
  override handleRequest<TUser = unknown>(
    err: unknown,
    user: TUser | null | false,
    info: unknown,
  ): TUser {
    if (user) return user;

    // `JwtStrategy.validate` already throws a shaped HttpException — keep it.
    if (err instanceof HttpException) throw err;

    const failure = (info ?? err) as { name?: string; message?: string } | undefined;
    const known = failure?.name ? TOKEN_FAILURES[failure.name] : undefined;
    if (known) {
      this.logger.debug(
        `Rejected request — ${failure?.name}: ${failure?.message ?? known.message}`,
      );
      throw new UnauthorizedException(known);
    }

    // Nothing we recognise: never swallow a real error as a 401.
    if (err) throw err;

    throw new UnauthorizedException(AUTHENTICATION_REQUIRED);
  }
}
