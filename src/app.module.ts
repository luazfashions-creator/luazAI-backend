import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SharedModule } from './shared/shared.module';
import { AuthModule } from './auth/auth.module';
import { BrandModule } from './brand/brand.module';
import { SeoModule } from './seo/seo.module';
import { ContentModule } from './content/content.module';
import { AgentOrchestratorModule } from './agent-orchestrator/agent-orchestrator.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { QueueName } from './shared/constants/queues.constant';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import redisConfig from './config/redis.config';
import queueConfig from './config/queue.config';
import authConfig from './config/auth.config';
import aiConfig from './config/ai.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        databaseConfig,
        redisConfig,
        queueConfig,
        authConfig,
        aiConfig,
      ],
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('database.uri'),
      }),
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('redis.host'),
          port: config.get<number>('redis.port'),
          password: config.get<string>('redis.password'),
        },
      }),
    }),
    BullModule.registerQueue(
      { name: QueueName.SEO_PIPELINE },
      { name: QueueName.SCRAPING },
      { name: QueueName.AI_TASKS },
      { name: QueueName.CONTENT_GENERATION },
      { name: QueueName.ANALYTICS_PIPELINE },
    ),
    SharedModule,
    AuthModule,
    BrandModule,
    SeoModule,
    ContentModule,
    AgentOrchestratorModule,
    AnalyticsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
