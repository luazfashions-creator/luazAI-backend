import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectQueue } from '@nestjs/bullmq';
import { Model, Types } from 'mongoose';
import { Queue } from 'bullmq';
import { Competitor, CompetitorDocument } from './schemas/competitor.schema';
import { BrandService } from '../brand/brand.service';
import { QueueName } from '../shared/constants/queues.constant';

@Injectable()
export class CompetitorAnalysisService {
  private readonly logger = new Logger(CompetitorAnalysisService.name);

  constructor(
    @InjectModel(Competitor.name)
    private readonly competitorModel: Model<CompetitorDocument>,
    private readonly brandService: BrandService,
    @InjectQueue(QueueName.SCRAPING) private readonly scrapingQueue: Queue,
  ) {}

  async analyze(
    brandId: string,
    userId: string,
  ): Promise<{ jobIds: string[] }> {
    const brand = await this.brandService.findOne(brandId, userId);
    const jobIds: string[] = [];

    for (const competitor of brand.competitors) {
      const job = await this.scrapingQueue.add('competitor-scrape', {
        brandId,
        competitorName: competitor.name,
        competitorWebsite: competitor.website,
      });
      jobIds.push(job.id!);
    }

    this.logger.log(
      `Enqueued ${jobIds.length} competitor scraping jobs for brand ${brandId}`,
    );
    return { jobIds };
  }

  async getResults(brandId: string): Promise<CompetitorDocument[]> {
    return this.competitorModel.find({
      brandId: new Types.ObjectId(brandId),
    });
  }
}
