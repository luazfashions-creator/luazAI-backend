import { Injectable, Logger } from '@nestjs/common';

export interface SeoScoreResult {
  overall: number;
  breakdown: {
    keywordPresence: number;
    contentDepth: number;
    internalLinking: number;
    metaDescription: number;
    schemaMarkup: number;
    pageSpeed: number;
    mobileFriendliness: number;
  };
  recommendations: string[];
}

interface ScoreInput {
  title?: string;
  metaDescription?: string;
  headings?: Record<string, string[]>;
  bodyText?: string;
  targetKeywords?: string[];
  internalLinks?: number;
  hasSchemaMarkup?: boolean;
  pageSpeedScore?: number;
  mobileScore?: number;
}

@Injectable()
export class SeoScoringService {
  private readonly logger = new Logger(SeoScoringService.name);

  private readonly weights = {
    keywordPresence: 0.25,
    contentDepth: 0.2,
    internalLinking: 0.15,
    metaDescription: 0.1,
    schemaMarkup: 0.1,
    pageSpeed: 0.1,
    mobileFriendliness: 0.1,
  };

  score(input: ScoreInput): SeoScoreResult {
    const breakdown = {
      keywordPresence: this.scoreKeywordPresence(input),
      contentDepth: this.scoreContentDepth(input),
      internalLinking: this.scoreInternalLinking(input),
      metaDescription: this.scoreMetaDescription(input),
      schemaMarkup: this.scoreSchemaMarkup(input),
      pageSpeed: input.pageSpeedScore ?? 50,
      mobileFriendliness: input.mobileScore ?? 50,
    };

    const overall = Math.round(
      Object.entries(breakdown).reduce((sum, [key, val]) => {
        return sum + val * this.weights[key as keyof typeof this.weights];
      }, 0),
    );

    const recommendations = this.generateRecommendations(breakdown);

    return { overall, breakdown, recommendations };
  }

  private scoreKeywordPresence(input: ScoreInput): number {
    if (!input.targetKeywords?.length) return 0;
    let score = 0;

    const titleLower = (input.title || '').toLowerCase();
    const bodyLower = (input.bodyText || '').toLowerCase();
    const h1s = (input.headings?.['h1'] || []).map((h) => h.toLowerCase());

    for (const kw of input.targetKeywords) {
      const kwLower = kw.toLowerCase();
      if (titleLower.includes(kwLower)) score += 30;
      if (h1s.some((h) => h.includes(kwLower))) score += 30;
      if (bodyLower.includes(kwLower)) score += 40;
    }

    return Math.min(100, score / input.targetKeywords.length);
  }

  private scoreContentDepth(input: ScoreInput): number {
    const wordCount = (input.bodyText || '').split(/\s+/).length;
    if (wordCount >= 2000) return 100;
    if (wordCount >= 1000) return 75;
    if (wordCount >= 500) return 50;
    if (wordCount >= 200) return 25;
    return 10;
  }

  private scoreInternalLinking(input: ScoreInput): number {
    const links = input.internalLinks ?? 0;
    if (links >= 10) return 100;
    if (links >= 5) return 75;
    if (links >= 2) return 50;
    if (links >= 1) return 25;
    return 0;
  }

  private scoreMetaDescription(input: ScoreInput): number {
    const desc = input.metaDescription || '';
    if (!desc) return 0;
    if (desc.length >= 120 && desc.length <= 160) return 100;
    if (desc.length >= 80 && desc.length <= 200) return 70;
    return 40;
  }

  private scoreSchemaMarkup(input: ScoreInput): number {
    return input.hasSchemaMarkup ? 100 : 0;
  }

  private generateRecommendations(
    breakdown: SeoScoreResult['breakdown'],
  ): string[] {
    const recs: string[] = [];

    if (breakdown.keywordPresence < 50) {
      recs.push('Include target keywords in title, H1, and body content');
    }
    if (breakdown.contentDepth < 50) {
      recs.push('Increase content length to at least 1000 words');
    }
    if (breakdown.internalLinking < 50) {
      recs.push('Add more internal links (aim for 5+)');
    }
    if (breakdown.metaDescription < 70) {
      recs.push('Optimize meta description (120-160 characters)');
    }
    if (breakdown.schemaMarkup < 50) {
      recs.push('Add schema markup (JSON-LD)');
    }
    if (breakdown.pageSpeed < 50) {
      recs.push('Improve page speed score');
    }
    if (breakdown.mobileFriendliness < 50) {
      recs.push('Improve mobile responsiveness');
    }

    return recs;
  }
}
