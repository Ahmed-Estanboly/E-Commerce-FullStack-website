import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';

interface BranchRequest extends Request {
  params: { branchId?: string };
  user?: { role?: string; branchId?: string };
}

@Injectable()
export class BranchAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<BranchRequest>();
    const user = request.user;
    if (user?.role === 'master admin') return true;
    if (user?.branchId && user.branchId === request.params.branchId) return true;
    throw new ForbiddenException('You can only access your own branch');
  }
}
