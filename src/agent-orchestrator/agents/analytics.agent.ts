import { Injectable } from '@nestjs/common';
import { BaseAgent, AgentExecutionContext, AgentResult } from '../base.agent';

@Injectable()
export class AnalyticsAgent extends BaseAgent {
  constructor() {
    super('analytics');
  }

  getTools(): string[] {
    return ['event-aggregator', 'report-builder'];
  }

  async execute(context: AgentExecutionContext): Promise<AgentResult> {
    await context.memory.setShortTerm(context.taskId, {
      phase: 'aggregating',
    });

    // Placeholder — will be wired to AnalyticsModule in Step 12
    return {
      success: true,
      data: {
        message: 'Analytics aggregation placeholder',
        brandId: context.brandId,
      },
    };
  }
}
