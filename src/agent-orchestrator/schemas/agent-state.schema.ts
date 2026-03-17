import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { AgentStatus } from '../../shared/enums/agent-status.enum';

export type AgentStateDocument = HydratedDocument<AgentState>;

@Schema({ _id: false })
class StateTransition {
  @Prop({ type: String, required: true, enum: AgentStatus })
  from: AgentStatus;

  @Prop({ type: String, required: true, enum: AgentStatus })
  to: AgentStatus;

  @Prop({ required: true, default: () => new Date() })
  timestamp: Date;

  @Prop()
  reason?: string;
}

@Schema({ timestamps: true, collection: 'agent_states' })
export class AgentState {
  @Prop({ type: Types.ObjectId, required: true, unique: true, index: true })
  taskId: Types.ObjectId;

  @Prop({ type: String, required: true, enum: AgentStatus, default: AgentStatus.PENDING })
  currentStatus: AgentStatus;

  @Prop({ type: [StateTransition], default: [] })
  transitions: StateTransition[];
}

export const AgentStateSchema = SchemaFactory.createForClass(AgentState);
