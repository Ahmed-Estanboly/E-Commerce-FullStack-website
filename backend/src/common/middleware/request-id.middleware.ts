import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(request: Request, response: Response, next: NextFunction) {
    const requestId =
      (request.headers['x-request-id'] as string | undefined) ?? randomUUID();
    (request as Request & { requestId: string }).requestId = requestId;
    response.setHeader('x-request-id', requestId);
    next();
  }
}
