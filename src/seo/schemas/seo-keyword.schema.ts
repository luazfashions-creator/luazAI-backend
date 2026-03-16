import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SeoKeywordDocument = HydratedDocument<SeoKeyword>;

@Schema({ _id: false })
class SerpData {
  @Prop({ default: false })
  featuredSnippet: boolean;

  @Prop({ default: false })
  aiOverview: boolean;

  @Prop({ type: [String], default: [] })
  topCompetitors: string[];
}

@Schema({ timestamps: true, collection: 'seo_keywords' })
export class SeoKeyword {
  @Prop({ type: Types.ObjectId, ref: 'Brand', required: true })
  brandId: Types.ObjectId;

  @Prop({ required: true })
  keyword: string;

  @Prop({ default: 0 })
  searchVolume: number;

  @Prop({ default: 0, min: 0, max: 100 })
  difficulty: number;

  @Prop({ default: 0 })
  cpc: number;

  @Prop()
  currentRank?: number;

  @Prop()
  previousRank?: number;

  @Prop({
    type: String,
    enum: ['informational', 'navigational', 'transactional', 'commercial'],
    default: 'informational',
  })
  intent: string;

  @Prop({ type: SerpData, default: () => ({}) })
  serp: SerpData;

  @Prop({
    type: String,
    enum: ['rising', 'stable', 'declining'],
    default: 'stable',
  })
  trend: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ default: 'ai' })
  source: string;

  @Prop({ default: 0 })
  opportunityScore: number;

  @Prop()
  lastUpdated?: Date;
}

export const SeoKeywordSchema = SchemaFactory.createForClass(SeoKeyword);

SeoKeywordSchema.index({ brandId: 1, keyword: 1 }, { unique: true });
SeoKeywordSchema.index({ searchVolume: -1 });
SeoKeywordSchema.index({ difficulty: 1 });
