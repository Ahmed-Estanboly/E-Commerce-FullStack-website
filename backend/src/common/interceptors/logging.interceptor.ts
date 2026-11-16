import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request & { requestId?: string }>();
    const response = http.getResponse<Response>();
    const { method, originalUrl } = request;
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        this.logger.log(
          `${method} ${originalUrl} ${response.statusCode} ${Date.now() - start}ms ${request.requestId ?? ''}`,
        );
      }),
      catchError((error) => {
        this.logger.error(
          `${method} ${originalUrl} ${Date.now() - start}ms ${request.requestId ?? ''}`,
          error instanceof Error ? error.stack : String(error),
        );
        return throwError(() => error);
      }),
    );
  }
}
