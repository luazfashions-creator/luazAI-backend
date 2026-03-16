import { registerAs } from '@nestjs/config';

export default registerAs('queue', () => ({
  defaultAttempts: parseInt(process.env.QUEUE_DEFAULT_ATTEMPTS || '3', 10),
  defaultBackoff: parseInt(process.env.QUEUE_DEFAULT_BACKOFF || '5000', 10),
  queues: {
    seoPipeline: {
      name: 'seo-pipeline',
      concurrency: 3,
      retries: 3,
      backoff: { type: 'exponential' as const, delay: 5000 },
      rateLimit: { max: 20, duration: 60000 },
    },
    scraping: {
      name: 'scraping',
      concurrency: 5,
      retries: 5,
      backoff: { type: 'exponential' as const, delay: 10000 },
      rateLimit: { max: 30, duration: 60000 },
    },
    aiTasks: {
      name: 'ai-tasks',
      concurrency: 3,
      retries: 3,
      backoff: { type: 'exponential' as const, delay: 5000 },
      rateLimit: { max: 60, duration: 60000 },
    },
    contentGeneration: {
      name: 'content-generation',
      concurrency: 3,
      retries: 2,
      backoff: { type: 'exponential' as const, delay: 10000 },
      rateLimit: { max: 30, duration: 60000 },
    },
    analyticsPipeline: {
      name: 'analytics-pipeline',
      concurrency: 2,
      retries: 3,
      backoff: { type: 'fixed' as const, delay: 30000 },
    },
  },
}));
