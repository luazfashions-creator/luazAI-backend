import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly redis: Redis;
  private readonly maxAttempts: number;
  private readonly windowSeconds: number;

  constructor(private readonly config: ConfigService) {
    this.redis = new Redis({
      host: this.config.get<string>('redis.host'),
      port: this.config.get<number>('redis.port'),
      password: this.config.get<string>('redis.password'),
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
    this.maxAttempts = this.config.get<number>(
      'auth.rateLimit.maxAttempts',
      10,
    );
    this.windowSeconds = this.config.get<number>(
      'auth.rateLimit.windowSeconds',
      60,
    );
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const ip = request.ip || request.socket?.remoteAddress || 'unknown';
    const key = `rate-limit:${ip}:${request.method}:${request.path}`;

    const current = await this.redis.incr(key);
    if (current === 1) {
      await this.redis.expire(key, this.windowSeconds);
    }

    if (current > this.maxAttempts) {
      const ttl = await this.redis.ttl(key);
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: `Too many requests. Try again in ${ttl} seconds.`,
          },
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
