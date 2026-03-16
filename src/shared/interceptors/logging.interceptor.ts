import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { randomUUID } from 'crypto';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const traceId = (request.headers['x-trace-id'] as string) || randomUUID();
    const startTime = Date.now();

    request['traceId'] = traceId;
    response.setHeader('x-trace-id', traceId);

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          this.logger.log(
            JSON.stringify({
              traceId,
              method: request.method,
              path: request.url,
              statusCode: response.statusCode,
              duration: `${duration}ms`,
              userId: request['user']?.id,
            }),
          );
        },
        error: (error: { status?: number; message?: string }) => {
          const duration = Date.now() - startTime;
          this.logger.error(
            JSON.stringify({
              traceId,
              method: request.method,
              path: request.url,
              statusCode: error.status || 500,
              duration: `${duration}ms`,
              error: error.message,
              userId: request['user']?.id,
            }),
          );
        },
      }),
    );
  }
}
