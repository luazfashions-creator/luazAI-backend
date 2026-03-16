import { Injectable } from '@nestjs/common';
import { BaseAgent, AgentExecutionContext, AgentResult } from '../base.agent';
import { CompetitorAnalysisService } from '../../seo/competitor-analysis.service';

@Injectable()
export class CompetitorAnalysisAgent extends BaseAgent {
  constructor(
    private readonly competitorService: CompetitorAnalysisService,
  ) {
    super('competitor-analysis');
  }

  getTools(): string[] {
    return ['web-scraper', 'competitor-analyzer'];
  }

  async execute(context: AgentExecutionContext): Promise<AgentResult> {
    const { brandId } = context;
    const userId = context.input.userId;

    await context.memory.setShortTerm(context.taskId, {
      phase: 'analyzing-competitors',
    });

    const result = await this.competitorService.analyze(brandId, userId);

    return {
      success: true,
      data: {
        jobsEnqueued: result.jobIds.length,
        message: 'Competitor analysis jobs enqueued',
      },
    };
  }
}
