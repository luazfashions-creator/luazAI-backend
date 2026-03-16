import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AgentTask, AgentTaskDocument } from './schemas/agent-task.schema';

const SHORT_TERM_PREFIX = 'agent:memory:';

@Injectable()
export class AgentMemoryService {
  private readonly logger = new Logger(AgentMemoryService.name);
  private readonly redis: Redis;

  constructor(
    @InjectModel(AgentTask.name)
    private readonly taskModel: Model<AgentTaskDocument>,
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

  async setShortTerm(taskId: string, data: Record<string, any>, ttlSeconds?: number): Promise<void> {
    const key = `${SHORT_TERM_PREFIX}${taskId}`;
    const value = JSON.stringify(data);
    if (ttlSeconds) {
      await this.redis.setex(key, ttlSeconds, value);
    } else {
      await this.redis.setex(key, 120, value); // default 2 min TTL
    }
  }

  async getShortTerm(taskId: string): Promise<Record<string, any> | null> {
    const key = `${SHORT_TERM_PREFIX}${taskId}`;
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async clearShortTerm(taskId: string): Promise<void> {
    await this.redis.del(`${SHORT_TERM_PREFIX}${taskId}`);
  }

  async saveLongTerm(taskId: string, result: Record<string, any>): Promise<void> {
    await this.taskModel.findByIdAndUpdate(taskId, {
      $set: { result },
    });
  }

  async getLongTerm(taskId: string): Promise<Record<string, any> | null> {
    const task = await this.taskModel.findById(taskId).select('result').exec();
    return task?.result ?? null;
  }

  async getPastResults(brandId: string, agentType: string, limit = 5): Promise<Record<string, any>[]> {
    const tasks = await this.taskModel
      .find({
        brandId: new Types.ObjectId(brandId),
        agentType,
        status: 'completed',
      })
      .sort({ completedAt: -1 })
      .limit(limit)
      .select('result completedAt')
      .exec();

    return tasks.map((t) => t.result ?? {});
  }
}
