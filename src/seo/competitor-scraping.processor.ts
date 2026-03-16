import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Job } from 'bullmq';
import * as cheerio from 'cheerio';
import { Competitor, CompetitorDocument } from './schemas/competitor.schema';
import { QueueName } from '../shared/constants/queues.constant';

@Processor(QueueName.SCRAPING)
export class CompetitorScrapingProcessor extends WorkerHost {
  private readonly logger = new Logger(CompetitorScrapingProcessor.name);

  constructor(
    @InjectModel(Competitor.name)
    private readonly competitorModel: Model<CompetitorDocument>,
  ) {
    super();
  }

  async process(job: Job): Promise<any> {
    this.logger.log(`Processing scraping job ${job.id}: ${job.name}`);

    switch (job.name) {
      case 'competitor-scrape':
        return this.handleScrape(job);
      default:
        this.logger.warn(`Unknown scraping job type: ${job.name}`);
    }
  }

  private async handleScrape(job: Job) {
    const { brandId, competitorName, competitorWebsite } = job.data as {
      brandId: string;
      competitorName: string;
      competitorWebsite: string;
    };

    try {
      const response = await fetch(competitorWebsite, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (compatible; LuazAI-Bot/1.0; +https://luazai.com/bot)',
        },
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        this.logger.warn(
          `Failed to fetch ${competitorWebsite}: ${response.status}`,
        );
        return { status: 'failed', website: competitorWebsite };
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      const pageTitles = [$('title').text()].filter(Boolean);
      const metaDescriptions = [
        $('meta[name="description"]').attr('content') || '',
      ].filter(Boolean);

      const headingStructure: Record<string, string[]> = {};
      for (const level of ['h1', 'h2', 'h3']) {
        headingStructure[level] = [];
        $(level).each((_, el) => {
          const text = $(el).text().trim();
          if (text) headingStructure[level].push(text);
        });
      }

      // Extract keywords from meta tags
      const metaKeywords =
        $('meta[name="keywords"]')
          .attr('content')
          ?.split(',')
          .map((k) => k.trim()) || [];

      await this.competitorModel.findOneAndUpdate(
        {
          brandId: new Types.ObjectId(brandId),
          website: competitorWebsite,
        },
        {
          brandId: new Types.ObjectId(brandId),
          name: competitorName,
          website: competitorWebsite,
          pageTitles,
          metaDescriptions,
          headingStructure,
          targetKeywords: metaKeywords,
          lastScrapedAt: new Date(),
        },
        { upsert: true, new: true },
      );

      return {
        status: 'completed',
        website: competitorWebsite,
        titlesFound: pageTitles.length,
        headingsFound: Object.values(headingStructure).flat().length,
      };
    } catch (error) {
      this.logger.error(
        `Scraping failed for ${competitorWebsite}: ${(error as Error).message}`,
      );
      throw error;
    }
  }
}
