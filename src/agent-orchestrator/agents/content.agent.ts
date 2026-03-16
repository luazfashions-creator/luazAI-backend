import { Injectable } from '@nestjs/common';
import { BaseAgent, AgentExecutionContext, AgentResult } from '../base.agent';
import { ContentService } from '../../content/content.service';
import { ContentType } from '../../shared/enums/content-type.enum';

@Injectable()
export class ContentAgent extends BaseAgent {
  constructor(private readonly contentService: ContentService) {
    super('content');
  }

  getTools(): string[] {
    return ['content-generator', 'seo-optimizer'];
  }

  async execute(context: AgentExecutionContext): Promise<AgentResult> {
    const { brandId, input } = context;

    await context.memory.setShortTerm(context.taskId, { phase: 'generating' });

    const job = await this.contentService.enqueueGeneration({
      brandId,
      type: (input.contentType as ContentType) || ContentType.BLOG_POST,
      brief: {
        topic: input.topic as string,
        keywords: input.keywords as string[],
        tone: input.tone as string,
        wordCount: input.wordCount as number,
        targetAudience: input.targetAudience as string,
      },
    });

    return {
      success: true,
      data: {
        contentJobId: job.id,
        message: 'Content generation enqueued',
      },
    };
  }
}
