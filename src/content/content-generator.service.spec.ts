import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ContentGeneratorService } from './content-generator.service';
import { BrandService } from '../brand/brand.service';
import { ContentType } from '../shared/enums/content-type.enum';

describe('ContentGeneratorService', () => {
  let service: ContentGeneratorService;
  let brandService: jest.Mocked<BrandService>;

  const mockBrand = {
    _id: '507f1f77bcf86cd799439011',
    name: 'TestBrand',
    industry: 'Technology',
    description: 'A tech company',
    guidelines: {
      tone: ['professional', 'friendly'],
      doNotUse: ['jargon', 'slang'],
      colors: [],
      fonts: [],
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContentGeneratorService,
        {
          provide: BrandService,
          useValue: {
            findById: jest.fn().mockResolvedValue(mockBrand),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: unknown) => {
              const config: Record<string, unknown> = {
                'ai.gemini.model': 'gemini-2.0-flash',
                'ai.gemini.apiKey': 'test-key',
                'ai.gemini.maxTokens': 8192,
                'ai.gemini.temperature': 0.7,
              };
              return config[key] ?? defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<ContentGeneratorService>(ContentGeneratorService);
    brandService = module.get(BrandService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should load brand context when generating content', async () => {
    // We test that the service calls brandService.findById with the right ID.
    // The actual AI call would fail without a real API key, so we mock the model.
    const mockModel = {
      invoke: jest.fn().mockResolvedValue({
        content: 'Generated blog post content about SEO tips.',
      }),
    };
    (service as unknown as { model: typeof mockModel }).model = mockModel;

    // Since we can't easily mock the LangChain model via DI, we verify the brand loading part
    try {
      await service.generate({
        brandId: '507f1f77bcf86cd799439011',
        type: ContentType.BLOG_POST,
        topic: 'SEO Tips',
        keywords: ['seo', 'optimization'],
        tone: 'professional',
        wordCount: 1500,
      });
    } catch {
      // Expected to fail without real API key — that's fine for this test
    }

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(brandService.findById).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439011',
    );
  });

  it('should throw when circuit breaker is open', async () => {
    // Force circuit breaker open
    (service as unknown as { circuitOpenUntil: number }).circuitOpenUntil =
      Date.now() + 60_000;

    await expect(
      service.generate({
        brandId: '507f1f77bcf86cd799439011',
        type: ContentType.BLOG_POST,
        topic: 'Test',
      }),
    ).rejects.toThrow('circuit breaker is open');
  });

  it('should reset circuit breaker after timeout elapses', async () => {
    // Set circuit breaker to expired
    (service as unknown as { circuitOpenUntil: number }).circuitOpenUntil =
      Date.now() - 1000;
    (
      service as unknown as { consecutiveFailures: number }
    ).consecutiveFailures = 10;

    // The circuit breaker check should pass (half-open), then it will try to call the AI
    try {
      await service.generate({
        brandId: '507f1f77bcf86cd799439011',
        type: ContentType.BLOG_POST,
        topic: 'Test',
      });
    } catch {
      // Will fail due to no real API key, but circuit breaker should have reset
    }

    expect(
      (service as unknown as { circuitOpenUntil: number }).circuitOpenUntil,
    ).toBe(0);
    expect(
      (service as unknown as { consecutiveFailures: number })
        .consecutiveFailures,
    ).toBeLessThanOrEqual(1);
  });
});
