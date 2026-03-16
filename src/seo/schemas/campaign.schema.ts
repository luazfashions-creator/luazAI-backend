import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CampaignDocument = HydratedDocument<Campaign>;

@Schema({ _id: false })
class CampaignSchedule {
  @Prop()
  startDate?: Date;

  @Prop()
  endDate?: Date;

  @Prop()
  cron?: string;
}

@Schema({ timestamps: true, collection: 'campaigns' })
export class Campaign {
  @Prop({ type: Types.ObjectId, ref: 'Brand', required: true })
  brandId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({
    type: String,
    enum: ['seo', 'sco', 'content', 'social'],
    required: true,
  })
  type: string;

  @Prop({
    type: String,
    enum: ['draft', 'active', 'paused', 'completed', 'archived'],
    default: 'draft',
  })
  status: string;

  @Prop({ type: Object })
  goals?: Record<string, unknown>;

  @Prop({ type: CampaignSchedule })
  schedule?: CampaignSchedule;

  @Prop()
  agentWorkflowId?: string;

  @Prop({ type: Object })
  results?: Record<string, unknown>;
}

export const CampaignSchema = SchemaFactory.createForClass(Campaign);

CampaignSchema.index({ brandId: 1, status: 1 });
CampaignSchema.index({ type: 1 });
CampaignSchema.index({ 'schedule.startDate': 1 });
