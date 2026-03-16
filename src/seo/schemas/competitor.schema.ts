import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CompetitorDocument = HydratedDocument<Competitor>;

@Schema({ timestamps: true, collection: 'competitors' })
export class Competitor {
  @Prop({ type: Types.ObjectId, ref: 'Brand', required: true })
  brandId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  website: string;

  @Prop({ type: [String], default: [] })
  pageTitles: string[];

  @Prop({ type: [String], default: [] })
  metaDescriptions: string[];

  @Prop({ type: Object })
  headingStructure?: Record<string, string[]>;

  @Prop({ type: [String], default: [] })
  targetKeywords: string[];

  @Prop({ type: [Object], default: [] })
  backlinkProfiles: Record<string, unknown>[];

  @Prop()
  lastScrapedAt?: Date;
}

export const CompetitorSchema = SchemaFactory.createForClass(Competitor);

CompetitorSchema.index({ brandId: 1, website: 1 }, { unique: true });
