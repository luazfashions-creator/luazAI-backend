import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { KeywordResearchService } from './keyword-research.service';
import { QueueName } from '../shared/constants/queues.constant';

@Processor(QueueName.SEO_PIPELINE)
export class KeywordResearchProcessor extends WorkerHost {
  private readonly logger = new Logger(KeywordResearchProcessor.name);

  constructor(
    private readonly keywordResearchService: KeywordResearchService,
  ) {
    super();
  }

  async process(job: Job): Promise<any> {
    this.logger.log(`Processing job ${job.id}: ${job.name}`);

    switch (job.name) {
      case 'keyword-research':
        return this.handleKeywordResearch(job);
      default:
        this.logger.warn(`Unknown job type: ${job.name}`);
    }
  }

  private async handleKeywordResearch(job: Job): Promise<any> {
    const { brandId, seedKeywords, country, language, limit } = job.data;

    const results = await this.keywordResearchService.research(
      brandId,
      seedKeywords,
      country || 'us',
      language || 'en',
      limit || 20,
    );

    return {
      keywords: results.length,
      brandId,
    };
  }
}
