import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

interface RequestUser {
  id: string;
  type: 'subscriber' | 'admin';
}

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      user?: RequestUser;
    }>();
    const user = request.user;

    if (!user || user.type !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }

    return true;
  }
}
