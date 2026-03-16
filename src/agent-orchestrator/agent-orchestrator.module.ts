import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';
import { AgentOrchestratorController } from './agent-orchestrator.controller';
import { WorkflowEngineService } from './workflow-engine.service';
import { AgentStateService } from './agent-state.service';
import { AgentMemoryService } from './agent-memory.service';
import { AgentTaskProcessor } from './agent-task.processor';
import { AgentTask, AgentTaskSchema } from './schemas/agent-task.schema';
import { AgentState, AgentStateSchema } from './schemas/agent-state.schema';
import { BrandProfilerAgent } from './agents/brand-profiler.agent';
import { CompetitorAnalysisAgent } from './agents/competitor-analysis.agent';
import { SeoAgent } from './agents/seo.agent';
import { ContentAgent } from './agents/content.agent';
import { AnalyticsAgent } from './agents/analytics.agent';
import { BrandModule } from '../brand/brand.module';
import { SeoModule } from '../seo/seo.module';
import { ContentModule } from '../content/content.module';
import { QueueName } from '../shared/constants/queues.constant';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AgentTask.name, schema: AgentTaskSchema },
      { name: AgentState.name, schema: AgentStateSchema },
    ]),
    BullModule.registerQueue({ name: QueueName.AI_TASKS }),
    forwardRef(() => BrandModule),
    SeoModule,
    ContentModule,
  ],
  controllers: [AgentOrchestratorController],
  providers: [
    WorkflowEngineService,
    AgentStateService,
    AgentMemoryService,
    AgentTaskProcessor,
    BrandProfilerAgent,
    CompetitorAnalysisAgent,
    SeoAgent,
    ContentAgent,
    AnalyticsAgent,
  ],
  exports: [WorkflowEngineService, AgentStateService],
})
export class AgentOrchestratorModule {}
