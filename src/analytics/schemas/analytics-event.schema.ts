import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AnalyticsEventDocument = HydratedDocument<AnalyticsEvent>;

@Schema({ _id: false })
class Dimensions {
  @Prop()
  device?: string;

  @Prop()
  browser?: string;

  @Prop()
  country?: string;

  @Prop()
  page?: string;
}

@Schema({ timestamps: true, collection: 'analytics_events' })
export class AnalyticsEvent {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  brandId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, index: true })
  campaignId?: Types.ObjectId;

  @Prop({ required: true, index: true })
  eventType: string;

  @Prop({ required: true })
  source: string;

  @Prop()
  channel?: string;

  @Prop({ required: true })
  metric: string;

  @Prop({ required: true, type: Number })
  value: number;

  @Prop({ type: Dimensions, default: {} })
  dimensions: Dimensions;

  @Prop({ type: Types.ObjectId })
  contentAssetId?: Types.ObjectId;

  @Prop({ required: true, default: () => new Date(), index: true })
  timestamp: Date;
}

export const AnalyticsEventSchema = SchemaFactory.createForClass(AnalyticsEvent);

AnalyticsEventSchema.index({ brandId: 1, eventType: 1, timestamp: -1 });
AnalyticsEventSchema.index({ source: 1 });
AnalyticsEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 }); // 1 year TTL
