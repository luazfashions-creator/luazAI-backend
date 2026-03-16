import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { SeoKeyword, SeoKeywordDocument } from './schemas/seo-keyword.schema';
import { BrandService } from '../brand/brand.service';

@Injectable()
export class KeywordResearchService {
  private readonly logger = new Logger(KeywordResearchService.name);
  private readonly model: ChatGoogleGenerativeAI;

  constructor(
    @InjectModel(SeoKeyword.name)
    private readonly keywordModel: Model<SeoKeywordDocument>,
    private readonly brandService: BrandService,
    private readonly config: ConfigService,
  ) {
    this.model = new ChatGoogleGenerativeAI({
      model: this.config.get<string>('ai.gemini.model', 'gemini-2.0-flash'),
      apiKey: this.config.get<string>('ai.gemini.apiKey'),
      maxOutputTokens: this.config.get<number>('ai.gemini.maxTokens', 8192),
      temperature: this.config.get<number>('ai.gemini.temperature', 0.7),
    });
  }

  async research(
    brandId: string,
    seedKeywords: string[],
    country: string,
    language: string,
    limit: number,
  ): Promise<SeoKeywordDocument[]> {
    this.logger.log(`Starting keyword research for brand ${brandId}`);

    const systemPrompt = `You are an SEO keyword research expert. Given seed keywords, generate expanded keyword suggestions.
For each keyword, provide:
- keyword: the search term
- searchVolume: estimated monthly search volume (number)
- difficulty: SEO difficulty score 0-100 (number)
- cpc: estimated cost per click in USD (number)
- intent: one of "informational", "navigational", "transactional", "commercial"
- trend: one of "rising", "stable", "declining"

Return ONLY a valid JSON array with no markdown formatting or code blocks. Each item should have the fields listed above.
Country: ${country}, Language: ${language}. Generate up to ${limit} keywords.`;

    const userPrompt = `Seed keywords: ${seedKeywords.join(', ')}
Generate ${limit} related SEO keyword suggestions with metrics.`;

    const response = await this.model.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(userPrompt),
    ]);

    const content =
      typeof response.content === 'string'
        ? response.content
        : JSON.stringify(response.content);

    let keywords: {
      keyword: string;
      searchVolume: number;
      difficulty: number;
      cpc: number;
      intent: string;
      trend: string;
    }[];
    try {
      // Strip any markdown code blocks if present
      const cleaned = content
        .replace(/```json?\n?/g, '')
        .replace(/```/g, '')
        .trim();
      keywords = JSON.parse(cleaned) as typeof keywords;
    } catch {
      this.logger.error('Failed to parse AI keyword response');
      keywords = [];
    }

    // Store keywords in DB
    const results: SeoKeywordDocument[] = [];
    for (const kw of keywords) {
      const opportunityScore = (kw.searchVolume * (100 - kw.difficulty)) / 100;

      const doc = await this.keywordModel.findOneAndUpdate(
        { brandId: new Types.ObjectId(brandId), keyword: kw.keyword },
        {
          brandId: new Types.ObjectId(brandId),
          keyword: kw.keyword,
          searchVolume: kw.searchVolume || 0,
          difficulty: kw.difficulty || 0,
          cpc: kw.cpc || 0,
          intent: kw.intent || 'informational',
          trend: kw.trend || 'stable',
          opportunityScore,
          source: 'ai',
          lastUpdated: new Date(),
        },
        { upsert: true, new: true },
      );
      results.push(doc);
    }

    this.logger.log(
      `Keyword research complete: ${results.length} keywords for brand ${brandId}`,
    );
    return results;
  }
}
