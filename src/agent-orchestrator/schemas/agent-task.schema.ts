import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { AgentStatus } from '../../shared/enums/agent-status.enum';

export type AgentTaskDocument = HydratedDocument<AgentTask>;

@Schema({ _id: false })
class RetryPolicy {
  @Prop({ default: 3 })
  maxRetries: number;

  @Prop({ default: 'exponential' })
  backoff: string;

  @Prop({ default: 5000 })
  backoffDelay: number;
}

@Schema({ timestamps: true, collection: 'agent_tasks' })
export class AgentTask {
  @Prop({ required: true })
  agentType: string;

  @Prop({ type: Types.ObjectId, index: true })
  workflowId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  brandId: Types.ObjectId;

  @Prop({ type: Object, default: {} })
  input: Record<string, any>;

  @Prop({ default: 0 })
  priority: number;

  @Prop({ type: RetryPolicy, default: {} })
  retryPolicy: RetryPolicy;

  @Prop({ default: 120000 })
  timeout: number;

  @Prop({ type: [Types.ObjectId], default: [] })
  dependsOn: Types.ObjectId[];

  @Prop({
    required: true,
    enum: AgentStatus,
    default: AgentStatus.PENDING,
    index: true,
  })
  status: AgentStatus;

  @Prop({ type: Object })
  result?: Record<string, any>;

  @Prop()
  error?: string;

  @Prop({ default: 0 })
  retryCount: number;

  @Prop()
  startedAt?: Date;

  @Prop()
  completedAt?: Date;
}

export const AgentTaskSchema = SchemaFactory.createForClass(AgentTask);

AgentTaskSchema.index({ workflowId: 1, status: 1 });
AgentTaskSchema.index({ brandId: 1, agentType: 1 });
