import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AgentState, AgentStateDocument } from './schemas/agent-state.schema';
import { AgentStatus } from '../shared/enums/agent-status.enum';

const VALID_TRANSITIONS: Record<AgentStatus, AgentStatus[]> = {
  [AgentStatus.PENDING]: [AgentStatus.QUEUED, AgentStatus.CANCELLED],
  [AgentStatus.QUEUED]: [AgentStatus.RUNNING, AgentStatus.CANCELLED],
  [AgentStatus.RUNNING]: [
    AgentStatus.COMPLETED,
    AgentStatus.FAILED,
    AgentStatus.WAITING_INPUT,
    AgentStatus.WAITING_DEPENDENCY,
    AgentStatus.CANCELLED,
  ],
  [AgentStatus.COMPLETED]: [],
  [AgentStatus.FAILED]: [AgentStatus.QUEUED, AgentStatus.DEAD],
  [AgentStatus.DEAD]: [],
  [AgentStatus.WAITING_INPUT]: [AgentStatus.RUNNING, AgentStatus.CANCELLED],
  [AgentStatus.WAITING_DEPENDENCY]: [
    AgentStatus.RUNNING,
    AgentStatus.CANCELLED,
  ],
  [AgentStatus.CANCELLED]: [],
};

@Injectable()
export class AgentStateService {
  private readonly logger = new Logger(AgentStateService.name);

  constructor(
    @InjectModel(AgentState.name)
    private readonly stateModel: Model<AgentStateDocument>,
  ) {}

  async createState(taskId: string): Promise<AgentStateDocument> {
    return this.stateModel.create({
      taskId: new Types.ObjectId(taskId),
      currentStatus: AgentStatus.PENDING,
      transitions: [],
    });
  }

  async transition(
    taskId: string,
    newStatus: AgentStatus,
    reason?: string,
  ): Promise<AgentStateDocument> {
    const state = await this.stateModel.findOne({
      taskId: new Types.ObjectId(taskId),
    });

    if (!state) {
      throw new BadRequestException(`No state found for task ${taskId}`);
    }

    const allowed = VALID_TRANSITIONS[state.currentStatus];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid transition from ${state.currentStatus} to ${newStatus}`,
      );
    }

    state.transitions.push({
      from: state.currentStatus,
      to: newStatus,
      timestamp: new Date(),
      reason,
    } as (typeof state.transitions)[number]);

    state.currentStatus = newStatus;
    return state.save();
  }

  async getState(taskId: string): Promise<AgentStateDocument | null> {
    return this.stateModel.findOne({
      taskId: new Types.ObjectId(taskId),
    });
  }
}
