import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Job } from 'bullmq';
import { ModuleRef } from '@nestjs/core';
import { AgentTask, AgentTaskDocument } from './schemas/agent-task.schema';
import { AgentStateService } from './agent-state.service';
import { AgentMemoryService } from './agent-memory.service';
import { WorkflowEngineService } from './workflow-engine.service';
import { BaseAgent } from './base.agent';
import { AgentStatus } from '../shared/enums/agent-status.enum';
import { QueueName } from '../shared/constants/queues.constant';
import { BrandProfilerAgent } from './agents/brand-profiler.agent';
import { CompetitorAnalysisAgent } from './agents/competitor-analysis.agent';
import { SeoAgent } from './agents/seo.agent';
import { ContentAgent } from './agents/content.agent';
import { AnalyticsAgent } from './agents/analytics.agent';

const AGENT_MAP: Record<string, new (...args: any[]) => BaseAgent> = {
  'brand-profiler': BrandProfilerAgent,
  'competitor-analysis': CompetitorAnalysisAgent,
  seo: SeoAgent,
  content: ContentAgent,
  analytics: AnalyticsAgent,
};

@Processor(QueueName.AI_TASKS)
export class AgentTaskProcessor extends WorkerHost {
  private readonly logger = new Logger(AgentTaskProcessor.name);

  constructor(
    @InjectModel(AgentTask.name)
    private readonly taskModel: Model<AgentTaskDocument>,
    private readonly stateService: AgentStateService,
    private readonly memoryService: AgentMemoryService,
    private readonly workflowEngine: WorkflowEngineService,
    private readonly moduleRef: ModuleRef,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    const { taskId } = job.data as { taskId: string };
    this.logger.log(`Processing agent task ${taskId}`);

    const task = await this.taskModel.findById(taskId);
    if (!task) {
      this.logger.error(`Task ${taskId} not found`);
      return;
    }

    // Resolve agent instance via DI
    const AgentClass = AGENT_MAP[task.agentType];
    if (!AgentClass) {
      this.logger.error(`Unknown agent type: ${task.agentType}`);
      await this.failTask(task, `Unknown agent type: ${task.agentType}`);
      return;
    }

    let agent: BaseAgent;
    try {
      agent = this.moduleRef.get(AgentClass, { strict: false });
    } catch {
      this.logger.error(`Could not resolve agent: ${task.agentType}`);
      await this.failTask(task, `Agent ${task.agentType} not available`);
      return;
    }

    const context = {
      taskId: task._id.toString(),
      brandId: task.brandId.toString(),
      input: task.input,
      memory: this.memoryService,
    };

    // Transition to RUNNING
    await this.stateService.transition(
      task._id.toString(),
      AgentStatus.RUNNING,
    );
    task.status = AgentStatus.RUNNING;
    task.startedAt = new Date();
    await task.save();

    try {
      await agent.onStart(context);
      const result = await agent.execute(context);

      if (result.success) {
        await agent.onComplete(context, result);
        await this.stateService.transition(
          task._id.toString(),
          AgentStatus.COMPLETED,
        );
        task.status = AgentStatus.COMPLETED;
        task.result = result.data;
        task.completedAt = new Date();
        await task.save();

        // Notify workflow engine
        await this.workflowEngine.onTaskCompleted(task._id.toString());
      } else {
        throw new Error(result.error || 'Agent execution returned failure');
      }
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      await agent.onFail(context, err);
      await this.failTask(task, err.message);
    }
  }

  private async failTask(
    task: AgentTaskDocument,
    errorMessage: string,
  ): Promise<void> {
    const maxRetries = task.retryPolicy?.maxRetries ?? 3;

    if (task.retryCount < maxRetries) {
      task.retryCount += 1;
      task.status = AgentStatus.FAILED;
      task.error = errorMessage;
      await task.save();
      await this.stateService.transition(
        task._id.toString(),
        AgentStatus.FAILED,
        errorMessage,
      );
    } else {
      task.status = AgentStatus.DEAD;
      task.error = errorMessage;
      task.completedAt = new Date();
      await task.save();
      await this.stateService.transition(
        task._id.toString(),
        AgentStatus.FAILED,
        'Max retries reached',
      );
      await this.stateService.transition(
        task._id.toString(),
        AgentStatus.DEAD,
        'Max retries reached',
      );
    }
  }
}
