import { Logger } from '@nestjs/common';
import { AgentMemoryService } from './agent-memory.service';

export interface AgentExecutionContext {
  taskId: string;
  brandId: string;
  input: Record<string, any>;
  memory: AgentMemoryService;
}

export interface AgentResult {
  success: boolean;
  data?: Record<string, any>;
  error?: string;
}

export abstract class BaseAgent {
  protected readonly logger: Logger;

  constructor(protected readonly agentType: string) {
    this.logger = new Logger(`Agent:${agentType}`);
  }

  abstract execute(context: AgentExecutionContext): Promise<AgentResult>;

  abstract getTools(): string[];

  async onStart(context: AgentExecutionContext): Promise<void> {
    this.logger.log(`Starting ${this.agentType} for brand ${context.brandId}`);
  }

  async onComplete(context: AgentExecutionContext, result: AgentResult): Promise<void> {
    this.logger.log(`${this.agentType} completed for brand ${context.brandId}`);
    await context.memory.saveLongTerm(context.taskId, result.data ?? {});
    await context.memory.clearShortTerm(context.taskId);
  }

  async onFail(context: AgentExecutionContext, error: Error): Promise<void> {
    this.logger.error(`${this.agentType} failed: ${error.message}`);
    await context.memory.clearShortTerm(context.taskId);
  }
}
