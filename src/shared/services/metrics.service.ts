import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  Registry,
  Counter,
  Histogram,
  Gauge,
  collectDefaultMetrics,
} from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
  readonly registry = new Registry();

  readonly httpRequestsTotal: Counter;
  readonly httpRequestDuration: Histogram;
  readonly bullmqJobsCompleted: Counter;
  readonly bullmqJobsFailed: Counter;
  readonly bullmqQueueDepth: Gauge;
  readonly geminiApiCalls: Counter;
  readonly geminiTokensUsed: Counter;
  readonly activeAgentTasks: Gauge;

  constructor() {
    this.httpRequestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'path', 'status_code'],
      registers: [this.registry],
    });

    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'path', 'status_code'],
      buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.registry],
    });

    this.bullmqJobsCompleted = new Counter({
      name: 'bullmq_jobs_completed_total',
      help: 'Total number of completed BullMQ jobs',
      labelNames: ['queue'],
      registers: [this.registry],
    });

    this.bullmqJobsFailed = new Counter({
      name: 'bullmq_jobs_failed_total',
      help: 'Total number of failed BullMQ jobs',
      labelNames: ['queue'],
      registers: [this.registry],
    });

    this.bullmqQueueDepth = new Gauge({
      name: 'bullmq_queue_depth',
      help: 'Current queue depth',
      labelNames: ['queue'],
      registers: [this.registry],
    });

    this.geminiApiCalls = new Counter({
      name: 'gemini_api_calls_total',
      help: 'Total Gemini API calls',
      labelNames: ['model', 'status'],
      registers: [this.registry],
    });

    this.geminiTokensUsed = new Counter({
      name: 'gemini_tokens_used_total',
      help: 'Total tokens consumed by Gemini',
      labelNames: ['model'],
      registers: [this.registry],
    });

    this.activeAgentTasks = new Gauge({
      name: 'active_agent_tasks',
      help: 'Number of currently running agent tasks',
      registers: [this.registry],
    });
  }

  onModuleInit() {
    collectDefaultMetrics({ register: this.registry });
  }

  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  getContentType(): string {
    return this.registry.contentType;
  }
}
