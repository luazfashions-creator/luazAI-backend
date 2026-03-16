import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { WorkflowEngineService } from './workflow-engine.service';
import { AgentStateService } from './agent-state.service';
import { TriggerWorkflowDto } from './dto/trigger-workflow.dto';
import { AuthGuard } from '../shared/guards/auth.guard';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AgentTask, AgentTaskDocument } from './schemas/agent-task.schema';
import { AgentStatus } from '../shared/enums/agent-status.enum';
import {
  SEO_ANALYSIS_WORKFLOW,
  CONTENT_GENERATION_WORKFLOW,
} from './workflows/workflow-definitions';
import { WorkflowDefinition } from './workflow-engine.service';

@ApiTags('Agents')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('agents')
export class AgentOrchestratorController {
  constructor(
    private readonly workflowEngine: WorkflowEngineService,
    private readonly stateService: AgentStateService,
    @InjectModel(AgentTask.name)
    private readonly taskModel: Model<AgentTaskDocument>,
  ) {}

  @Post('workflows')
  @ApiOperation({ summary: 'Trigger a workflow' })
  async triggerWorkflow(@Body() dto: TriggerWorkflowDto) {
    const definitions: Record<string, WorkflowDefinition> = {
      'seo-analysis': SEO_ANALYSIS_WORKFLOW,
      'content-generation': CONTENT_GENERATION_WORKFLOW,
    };

    const definition = definitions[dto.workflow];
    if (!definition) {
      throw new BadRequestException(
        `Unknown workflow: ${dto.workflow}. Available: ${Object.keys(definitions).join(', ')}`,
      );
    }

    const result = await this.workflowEngine.startWorkflow(
      definition,
      dto.brandId,
      dto.input || {},
    );

    return {
      workflowId: result.workflowId,
      taskCount: result.tasks.length,
      status: 'started',
    };
  }

  @Get('workflows/:id')
  @ApiOperation({ summary: 'Get workflow status' })
  async getWorkflowStatus(@Param('id') id: string) {
    return this.workflowEngine.getWorkflowStatus(id);
  }

  @Get('tasks')
  @ApiOperation({ summary: 'List agent tasks' })
  @ApiQuery({ name: 'brandId', required: false })
  @ApiQuery({ name: 'status', required: false })
  async listTasks(
    @Query('brandId') brandId?: string,
    @Query('status') status?: string,
  ) {
    const filter: Record<string, any> = {};
    if (brandId) filter.brandId = new Types.ObjectId(brandId);
    if (status) filter.status = status;

    return this.taskModel.find(filter).sort({ createdAt: -1 }).limit(50).exec();
  }

  @Get('tasks/:id')
  @ApiOperation({ summary: 'Get task detail with state history' })
  async getTask(@Param('id') id: string) {
    const task = await this.taskModel.findById(id).exec();
    const state = await this.stateService.getState(id);
    return { task, state };
  }

  @Post('tasks/:id/cancel')
  @ApiOperation({ summary: 'Cancel a running task' })
  async cancelTask(@Param('id') id: string) {
    const task = await this.taskModel.findById(id).exec();
    if (!task) {
      throw new BadRequestException(`Task ${id} not found`);
    }

    await this.stateService.transition(
      id,
      AgentStatus.CANCELLED,
      'Cancelled by user',
    );
    task.status = AgentStatus.CANCELLED;
    task.completedAt = new Date();
    await task.save();

    return { id, status: 'cancelled' };
  }
}
