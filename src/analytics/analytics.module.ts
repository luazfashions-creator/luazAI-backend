import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';
import { AnalyticsController } from './analytics.controller';
import { EventTrackerService } from './event-tracker.service';
import { ReportBuilderService } from './report-builder.service';
import { AnalyticsPipelineProcessor } from './analytics-pipeline.processor';
import {
  AnalyticsEvent,
  AnalyticsEventSchema,
} from './schemas/analytics-event.schema';
import { QueueName } from '../shared/constants/queues.constant';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AnalyticsEvent.name, schema: AnalyticsEventSchema },
    ]),
    BullModule.registerQueue({ name: QueueName.ANALYTICS_PIPELINE }),
  ],
  controllers: [AnalyticsController],
  providers: [
    EventTrackerService,
    ReportBuilderService,
    AnalyticsPipelineProcessor,
  ],
  exports: [EventTrackerService, ReportBuilderService],
})
export class AnalyticsModule {}
