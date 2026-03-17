import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';
import { SeoController } from './seo.controller';
import { SeoService } from './seo.service';
import { KeywordResearchService } from './keyword-research.service';
import { CompetitorAnalysisService } from './competitor-analysis.service';
import { SeoScoringService } from './seo-scoring.service';
import { KeywordResearchProcessor } from './keyword-research.processor';
import { CompetitorScrapingProcessor } from './competitor-scraping.processor';
import { SeoKeyword, SeoKeywordSchema } from './schemas/seo-keyword.schema';
import { Competitor, CompetitorSchema } from './schemas/competitor.schema';
import { Campaign, CampaignSchema } from './schemas/campaign.schema';
import { BrandModule } from '../brand/brand.module';
import { QueueName } from '../shared/constants/queues.constant';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SeoKeyword.name, schema: SeoKeywordSchema },
      { name: Competitor.name, schema: CompetitorSchema },
      { name: Campaign.name, schema: CampaignSchema },
    ]),
    BullModule.registerQueue(
      { name: QueueName.SEO_PIPELINE },
      { name: QueueName.SCRAPING },
    ),
    forwardRef(() => BrandModule),
  ],
  controllers: [SeoController],
  providers: [
    SeoService,
    KeywordResearchService,
    CompetitorAnalysisService,
    SeoScoringService,
    KeywordResearchProcessor,
    CompetitorScrapingProcessor,
  ],
  exports: [SeoService, KeywordResearchService, SeoScoringService],
})
export class SeoModule {}
