import { Injectable } from '@nestjs/common';
import { BaseAgent, AgentExecutionContext, AgentResult } from '../base.agent';
import { SeoService } from '../../seo/seo.service';

@Injectable()
export class SeoAgent extends BaseAgent {
  constructor(private readonly seoService: SeoService) {
    super('seo');
  }

  getTools(): string[] {
    return ['keyword-researcher', 'seo-scorer'];
  }

  async execute(context: AgentExecutionContext): Promise<AgentResult> {
    const { brandId, input } = context;

    await context.memory.setShortTerm(context.taskId, { phase: 'keyword-research' });

    const keywordJob = await this.seoService.triggerKeywordResearch(
      brandId,
      input.seedKeywords || [],
      input.country || 'US',
      input.language || 'en',
      input.limit || 50,
    );

    await context.memory.setShortTerm(context.taskId, { phase: 'scoring' });

    const score = await this.seoService.getSeoScore(brandId);

    return {
      success: true,
      data: {
        keywordJobId: keywordJob.jobId,
        seoScore: score,
      },
    };
  }
}
