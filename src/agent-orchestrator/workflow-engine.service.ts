import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectQueue } from '@nestjs/bullmq';
import { Model, Types } from 'mongoose';
import { Queue } from 'bullmq';
import { AgentTask, AgentTaskDocument } from './schemas/agent-task.schema';
import { AgentStateService } from './agent-state.service';
import { AgentStatus } from '../shared/enums/agent-status.enum';
import { QueueName } from '../shared/constants/queues.constant';

export interface WorkflowStep {
  agentType: string;
  input?: Record<string, any>;
  dependsOnIndex?: number[];
}

export interface WorkflowDefinition {
  name: string;
  steps: WorkflowStep[];
}

@Injectable()
export class WorkflowEngineService {
  private readonly logger = new Logger(WorkflowEngineService.name);

  constructor(
    @InjectModel(AgentTask.name)
    private readonly taskModel: Model<AgentTaskDocument>,
    @InjectQueue(QueueName.AI_TASKS)
    private readonly aiQueue: Queue,
    private readonly stateService: AgentStateService,
  ) {}

  async startWorkflow(
    definition: WorkflowDefinition,
    brandId: string,
    globalInput: Record<string, any> = {},
  ): Promise<{ workflowId: string; tasks: AgentTaskDocument[] }> {
    const workflowId = new Types.ObjectId();
    this.logger.log(
      `Starting workflow "${definition.name}" (${workflowId.toString()})`,
    );

    const tasks: AgentTaskDocument[] = [];

    // Create all tasks first
    for (let i = 0; i < definition.steps.length; i++) {
      const step = definition.steps[i];
      const dependsOn = (step.dependsOnIndex || []).map(
        (idx) => tasks[idx]._id,
      );

      const task = await this.taskModel.create({
        agentType: step.agentType,
        workflowId,
        brandId: new Types.ObjectId(brandId),
        input: { ...globalInput, ...step.input },
        dependsOn,
        status: AgentStatus.PENDING,
      });

      await this.stateService.createState(task._id.toString());
      tasks.push(task);
    }

    // Enqueue tasks with no dependencies
    for (const task of tasks) {
      if (!task.dependsOn.length) {
        await this.enqueueTask(task);
      }
    }

    return { workflowId: workflowId.toString(), tasks };
  }

  async onTaskCompleted(taskId: string): Promise<void> {
    const task = await this.taskModel.findById(taskId);
    if (!task?.workflowId) return;

    // Find tasks depending on the completed task
    const dependents = await this.taskModel.find({
      workflowId: task.workflowId,
      dependsOn: task._id,
      status: AgentStatus.PENDING,
    });

    for (const dependent of dependents) {
      // Check if ALL dependencies are completed
      const deps = await this.taskModel.find({
        _id: { $in: dependent.dependsOn },
      });

      const allCompleted = deps.every(
        (d) => d.status === AgentStatus.COMPLETED,
      );

      if (allCompleted) {
        await this.enqueueTask(dependent);
      }
    }
  }

  async getWorkflowStatus(workflowId: string) {
    const tasks = await this.taskModel
      .find({ workflowId: new Types.ObjectId(workflowId) })
      .sort({ createdAt: 1 })
      .exec();

    if (!tasks.length) {
      throw new NotFoundException(`Workflow ${workflowId} not found`);
    }

    const statuses = tasks.map((t) => t.status);
    let overallStatus: string;

    if (statuses.every((s) => s === AgentStatus.COMPLETED)) {
      overallStatus = 'completed';
    } else if (
      statuses.some((s) => s === AgentStatus.FAILED || s === AgentStatus.DEAD)
    ) {
      overallStatus = 'failed';
    } else if (statuses.some((s) => s === AgentStatus.RUNNING)) {
      overallStatus = 'running';
    } else {
      overallStatus = 'pending';
    }

    return {
      workflowId,
      status: overallStatus,
      tasks: tasks.map((t) => ({
        id: t._id,
        agentType: t.agentType,
        status: t.status,
        startedAt: t.startedAt,
        completedAt: t.completedAt,
        error: t.error,
      })),
    };
  }

  private async enqueueTask(task: AgentTaskDocument): Promise<void> {
    await this.stateService.transition(
      task._id.toString(),
      AgentStatus.QUEUED,
      'Dependencies resolved',
    );

    task.status = AgentStatus.QUEUED;
    await task.save();

    await this.aiQueue.add(
      'agent-task',
      { taskId: task._id.toString() },
      {
        priority: task.priority,
        removeOnComplete: { age: 86400 },
        removeOnFail: { age: 604800 },
      },
    );

    this.logger.log(`Task ${task._id.toString()} (${task.agentType}) enqueued`);
  }
}
