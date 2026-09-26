import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Role } from '../enums/role.enum.js';

export interface AuthenticatedUser {
  id: string;
  schoolId: string;
  email: string;
  role: Role;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser =>
    context.switchToHttp().getRequest<{ user: AuthenticatedUser }>().user,
);
