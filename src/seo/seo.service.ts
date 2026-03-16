import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectQueue } from '@nestjs/bullmq';
import { Model, Types } from 'mongoose';
import { Queue } from 'bullmq';
import { SeoKeyword, SeoKeywordDocument } from './schemas/seo-keyword.schema';
import { KeywordResearchService } from './keyword-research.service';
import { CompetitorAnalysisService } from './competitor-analysis.service';
import { SeoScoringService } from './seo-scoring.service';
import { PaginationDto } from '../shared/dto/pagination.dto';
import { PaginatedResponse } from '../shared/interfaces/paginated-response.interface';
import { QueueName } from '../shared/constants/queues.constant';

@Injectable()
export class SeoService {
  private readonly logger = new Logger(SeoService.name);

  constructor(
    @InjectModel(SeoKeyword.name)
    private readonly keywordModel: Model<SeoKeywordDocument>,
    private readonly keywordResearchService: KeywordResearchService,
    private readonly competitorAnalysisService: CompetitorAnalysisService,
    private readonly seoScoringService: SeoScoringService,
    @InjectQueue(QueueName.SEO_PIPELINE)
    private readonly seoPipelineQueue: Queue,
  ) {}

  async getKeywords(
    brandId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResponse<SeoKeywordDocument>> {
    const { page, limit, sort, order } = pagination;
    const filter = { brandId: new Types.ObjectId(brandId) };
    const sortObj: Record<string, 1 | -1> = {
      [sort || 'opportunityScore']: order === 'asc' ? 1 : -1,
    };

    const [data, total] = await Promise.all([
      this.keywordModel
        .find(filter)
        .sort(sortObj)
        .skip((page - 1) * limit)
        .limit(limit),
      this.keywordModel.countDocuments(filter),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getKeywordById(id: string): Promise<SeoKeywordDocument | null> {
    return this.keywordModel.findById(id);
  }

  async triggerKeywordResearch(
    brandId: string,
    seedKeywords: string[],
    country: string,
    language: string,
    limit: number,
  ): Promise<{ jobId: string; status: string }> {
    const job = await this.seoPipelineQueue.add('keyword-research', {
      brandId,
      seedKeywords,
      country,
      language,
      limit,
    });

    return { jobId: job.id!, status: 'queued' };
  }

  async triggerCompetitorAnalysis(
    brandId: string,
    userId: string,
  ): Promise<{ jobIds: string[] }> {
    return this.competitorAnalysisService.analyze(brandId, userId);
  }

  async getCompetitorResults(brandId: string) {
    return this.competitorAnalysisService.getResults(brandId);
  }

  async getSeoScore(brandId: string) {
    // Aggregate data for scoring
    const keywords = await this.keywordModel.find({
      brandId: new Types.ObjectId(brandId),
    });

    const avgDifficulty =
      keywords.length > 0
        ? keywords.reduce((sum, k) => sum + k.difficulty, 0) / keywords.length
        : 0;

    const avgOpportunity =
      keywords.length > 0
        ? keywords.reduce((sum, k) => sum + k.opportunityScore, 0) /
          keywords.length
        : 0;

    const score = this.seoScoringService.score({
      targetKeywords: keywords.map((k) => k.keyword),
    });

    return {
      score: score.overall,
      breakdown: score.breakdown,
      recommendations: score.recommendations,
      keywordStats: {
        total: keywords.length,
        avgDifficulty: Math.round(avgDifficulty),
        avgOpportunityScore: Math.round(avgOpportunity),
      },
    };
  }

  async getContentGaps(brandId: string) {
    // Find keywords competitors rank for but brand has no content
    const keywords = await this.keywordModel
      .find({
        brandId: new Types.ObjectId(brandId),
        currentRank: { $exists: false },
        opportunityScore: { $gte: 50 },
      })
      .sort({ opportunityScore: -1 })
      .limit(20);

    return keywords.map((kw) => ({
      keyword: kw.keyword,
      searchVolume: kw.searchVolume,
      difficulty: kw.difficulty,
      opportunityScore: kw.opportunityScore,
      intent: kw.intent,
    }));
  }

  async triggerFullAudit(brandId: string): Promise<{ jobId: string }> {
    const job = await this.seoPipelineQueue.add('full-audit', {
      brandId,
    });

    return { jobId: job.id! };
  }
}
