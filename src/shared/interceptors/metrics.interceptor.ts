import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request, Response } from 'express';
import { MetricsService } from '../services/metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metrics: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          this.recordMetrics(request, response, startTime);
        },
        error: () => {
          this.recordMetrics(request, response, startTime);
        },
      }),
    );
  }

  private recordMetrics(request: Request, response: Response, startTime: number) {
    const duration = (Date.now() - startTime) / 1000;
    const labels = {
      method: request.method,
      path: this.normalizePath(request.route?.path || request.url),
      status_code: String(response.statusCode),
    };

    this.metrics.httpRequestsTotal.inc(labels);
    this.metrics.httpRequestDuration.observe(labels, duration);
  }

  private normalizePath(path: string): string {
    // Replace dynamic path params with placeholders
    return path.replace(
      /[0-9a-fA-F]{24}/g,
      ':id',
    );
  }
}
