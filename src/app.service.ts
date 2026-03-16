import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  private readonly redis: Redis;

  constructor(
    @InjectConnection() private readonly mongoConnection: Connection,
    private readonly config: ConfigService,
  ) {
    this.redis = new Redis({
      host: this.config.get<string>('redis.host'),
      port: this.config.get<number>('redis.port'),
      password: this.config.get<string>('redis.password'),
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
  }

  getHealth(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  async getReadiness(): Promise<{
    status: string;
    services: Record<string, string>;
  }> {
    const services: Record<string, string> = {};

    // Check MongoDB
    try {
      const mongoState = this.mongoConnection.readyState;
      services.mongodb =
        mongoState === (1 as typeof mongoState) ? 'connected' : 'disconnected';
    } catch {
      services.mongodb = 'error';
    }

    // Check Redis
    try {
      await this.redis.ping();
      services.redis = 'connected';
    } catch {
      services.redis = 'error';
    }

    const allHealthy = Object.values(services).every((s) => s === 'connected');

    return {
      status: allHealthy ? 'ready' : 'degraded',
      services,
    };
  }
}
