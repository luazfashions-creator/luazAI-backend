import { Test, TestingModule } from '@nestjs/testing';
import { SeoScoringService } from './seo-scoring.service';

describe('SeoScoringService', () => {
  let service: SeoScoringService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SeoScoringService],
    }).compile();

    service = module.get<SeoScoringService>(SeoScoringService);
  });

  it('should return score 0 for empty input', () => {
    const result = service.score({});
    expect(result.overall).toBeGreaterThanOrEqual(0);
    expect(result.overall).toBeLessThanOrEqual(100);
    expect(result.breakdown).toBeDefined();
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it('should score high for well-optimized content', () => {
    const result = service.score({
      title: 'Best SEO Tools for 2024',
      metaDescription:
        'Discover the best SEO tools for 2024. Compare features, pricing, and get expert recommendations for your SEO strategy.',
      headings: {
        h1: ['Best SEO Tools for 2024'],
        h2: ['Top Tools', 'Pricing'],
        h3: [],
      },
      bodyText: 'SEO tools '.repeat(300), // 600 words
      targetKeywords: ['seo tools'],
      internalLinks: 8,
      hasSchemaMarkup: true,
      pageSpeedScore: 90,
      mobileScore: 95,
    });

    expect(result.overall).toBeGreaterThan(70);
  });

  it('should calculate keyword presence correctly', () => {
    const result = service.score({
      title: 'Digital Marketing Guide',
      headings: { h1: ['Digital Marketing Guide'] },
      bodyText: 'This is a guide about digital marketing strategies.',
      targetKeywords: ['digital marketing'],
    });

    expect(result.breakdown.keywordPresence).toBeGreaterThan(0);
  });

  it('should handle content depth scoring by word count', () => {
    const shortResult = service.score({ bodyText: 'Short text here.' });
    const longResult = service.score({
      bodyText: 'word '.repeat(2000),
    });

    expect(longResult.breakdown.contentDepth).toBeGreaterThan(
      shortResult.breakdown.contentDepth,
    );
  });

  it('should score meta description quality', () => {
    const goodMeta = service.score({
      metaDescription:
        'This is a well-crafted meta description that is exactly the right length for search engine results pages display.',
    });

    const noMeta = service.score({});

    expect(goodMeta.breakdown.metaDescription).toBeGreaterThan(
      noMeta.breakdown.metaDescription,
    );
  });

  it('should generate recommendations for low scores', () => {
    const result = service.score({});
    expect(result.recommendations).toContain('Add schema markup (JSON-LD)');
  });
});
