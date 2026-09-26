import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator.js';
import type { Role } from '../../common/enums/role.enum.js';

export interface AccessTokenPayload {
  sub: string;
  sid: string;
  email: string;
  role: Role;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  validate(payload: AccessTokenPayload): AuthenticatedUser {
    if (!payload?.sub) {
      throw new UnauthorizedException({
        code: 'AUTH_UNAUTHENTICATED',
        message: 'Not signed in',
      });
    }
    return {
      id: payload.sub,
      schoolId: payload.sid,
      email: payload.email,
      role: payload.role,
    };
  }
}
