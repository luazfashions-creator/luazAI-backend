import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { BrandService } from '../brand/brand.service';
import { BrandDocument } from '../brand/schemas/brand.schema';
import { ContentType } from '../shared/enums/content-type.enum';

export interface ContentGenerationInput {
  brandId: string;
  type: ContentType;
  topic: string;
  keywords?: string[];
  tone?: string;
  wordCount?: number;
  targetAudience?: string;
}

export interface ContentGenerationResult {
  title: string;
  body: string;
  metadata: {
    keywords: string[];
    targetAudience?: string;
    tone?: string;
    wordCount: number;
    readingLevel?: string;
  };
  model: string;
}

@Injectable()
export class ContentGeneratorService {
  private readonly logger = new Logger(ContentGeneratorService.name);
  private readonly model: ChatGoogleGenerativeAI;
  private consecutiveFailures = 0;
  private circuitOpenUntil = 0;

  constructor(
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

  async generate(
    input: ContentGenerationInput,
  ): Promise<ContentGenerationResult> {
    this.checkCircuitBreaker();

    const brand = await this.brandService.findById(input.brandId);
    const brandContext = this.buildBrandContext(brand);
    const systemPrompt = this.buildSystemPrompt(input.type, brandContext);
    const userPrompt = this.buildUserPrompt(input);

    try {
      const response = await this.model.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage(userPrompt),
      ]);

      this.consecutiveFailures = 0;

      const content =
        typeof response.content === 'string'
          ? response.content
          : JSON.stringify(response.content);

      const wordCount = content.split(/\s+/).filter(Boolean).length;

      return {
        title: input.topic,
        body: content,
        metadata: {
          keywords: input.keywords || [],
          targetAudience: input.targetAudience,
          tone: input.tone,
          wordCount,
          readingLevel: this.estimateReadingLevel(wordCount),
        },
        model: this.config.get<string>('ai.gemini.model', 'gemini-2.0-flash'),
      };
    } catch (error) {
      this.consecutiveFailures++;
      if (this.consecutiveFailures >= 10) {
        this.circuitOpenUntil = Date.now() + 60_000;
        this.logger.error(
          'Circuit breaker opened — too many consecutive AI failures',
        );
      }
      throw error;
    }
  }

  private checkCircuitBreaker(): void {
    if (this.circuitOpenUntil > Date.now()) {
      throw new Error('AI service circuit breaker is open. Retry later.');
    }
    if (this.circuitOpenUntil > 0 && this.circuitOpenUntil <= Date.now()) {
      this.logger.log('Circuit breaker half-open — allowing retry');
      this.circuitOpenUntil = 0;
      this.consecutiveFailures = 0;
    }
  }

  private buildBrandContext(brand: BrandDocument): string {
    const parts: string[] = [
      `Brand: ${brand.name}`,
      `Industry: ${brand.industry || 'General'}`,
    ];

    if (brand.guidelines) {
      if (brand.guidelines.tone?.length) {
        parts.push(`Tone: ${brand.guidelines.tone.join(', ')}`);
      }
      if (brand.guidelines.doNotUse?.length) {
        parts.push(`Avoid using: ${brand.guidelines.doNotUse.join(', ')}`);
      }
    }

    if (brand.description) {
      parts.push(`Description: ${brand.description}`);
    }

    return parts.join('\n');
  }

  private buildSystemPrompt(type: ContentType, brandContext: string): string {
    const typeInstructions: Record<ContentType, string> = {
      [ContentType.BLOG_POST]:
        'Write a well-structured blog post with an engaging introduction, clear headings, and a compelling conclusion. Include SEO-optimized headings.',
      [ContentType.AD_COPY]:
        'Write concise, high-converting ad copy. Include a headline, description, and call-to-action. Keep it punchy and persuasive.',
      [ContentType.SOCIAL_POST]:
        'Write an engaging social media post. Keep it concise, include relevant hashtags, and add a call-to-action.',
      [ContentType.EMAIL]:
        'Write a professional email with a compelling subject line, clear body, and strong call-to-action.',
      [ContentType.LANDING_PAGE]:
        'Write landing page copy with a hero headline, value propositions, benefits list, social proof section, and strong CTA.',
      [ContentType.PRODUCT_DESCRIPTION]:
        'Write a compelling product description highlighting features, benefits, and unique selling points.',
    };

    return `You are an expert content writer. Generate high-quality content aligned with the brand guidelines below.

${brandContext}

Content Type: ${type}
Instructions: ${typeInstructions[type]}

Write naturally, following the brand's tone and avoiding any words/phrases listed in the "Avoid" list.`;
  }

  private buildUserPrompt(input: ContentGenerationInput): string {
    const parts: string[] = [`Topic: ${input.topic}`];

    if (input.keywords?.length) {
      parts.push(
        `Target keywords (weave naturally): ${input.keywords.join(', ')}`,
      );
    }
    if (input.targetAudience) {
      parts.push(`Target audience: ${input.targetAudience}`);
    }
    if (input.tone) {
      parts.push(`Tone override: ${input.tone}`);
    }
    if (input.wordCount) {
      parts.push(`Target word count: approximately ${input.wordCount} words`);
    }

    return parts.join('\n');
  }

  private estimateReadingLevel(wordCount: number): string {
    if (wordCount < 300) return 'basic';
    if (wordCount < 800) return 'intermediate';
    return 'advanced';
  }
}
