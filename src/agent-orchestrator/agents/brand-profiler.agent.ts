import { Injectable } from '@nestjs/common';
import { BaseAgent, AgentExecutionContext, AgentResult } from '../base.agent';
import { BrandService } from '../../brand/brand.service';

@Injectable()
export class BrandProfilerAgent extends BaseAgent {
  constructor(private readonly brandService: BrandService) {
    super('brand-profiler');
  }

  getTools(): string[] {
    return ['web-scraper', 'text-analyzer'];
  }

  async execute(context: AgentExecutionContext): Promise<AgentResult> {
    const brand = await this.brandService.findById(context.brandId);

    await context.memory.setShortTerm(context.taskId, {
      phase: 'profiling',
      brandName: brand.name,
    });

    // Extract brand signals from website if available
    const signals: Record<string, any> = {
      name: brand.name,
      industry: brand.industry,
      guidelines: brand.guidelines,
      hasWebsite: !!brand.website,
    };

    if (brand.website) {
      signals.website = brand.website;
    }

    return {
      success: true,
      data: { brandProfile: signals },
    };
  }
}
