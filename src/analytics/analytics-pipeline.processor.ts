import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ReportBuilderService } from './report-builder.service';
import { QueueName } from '../shared/constants/queues.constant';

@Processor(QueueName.ANALYTICS_PIPELINE)
export class AnalyticsPipelineProcessor extends WorkerHost {
  private readonly logger = new Logger(AnalyticsPipelineProcessor.name);

  constructor(private readonly reportBuilder: ReportBuilderService) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.log(`Processing analytics pipeline job ${job.id}`);

    const { brandId, period, reportType } = job.data as {
      brandId: string;
      period?: string;
      reportType?: string;
    };

    switch (reportType) {
      case 'overview':
        await this.reportBuilder.getOverview(brandId, period || '30d');
        break;
      case 'seo':
        await this.reportBuilder.getSeoReport(brandId, period || '30d');
        break;
      case 'content':
        await this.reportBuilder.getContentReport(brandId);
        break;
      default:
        await this.reportBuilder.getOverview(brandId, period || '30d');
    }

    this.logger.log(`Analytics pipeline job ${job.id} completed`);
  }
}
