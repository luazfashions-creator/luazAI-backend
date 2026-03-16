import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type BrandDocument = HydratedDocument<Brand>;

@Schema({ _id: false })
class BrandGuidelines {
  @Prop({ type: [String], default: [] })
  tone: string[];

  @Prop({ type: [String], default: [] })
  colors: string[];

  @Prop({ type: [String], default: [] })
  fonts: string[];

  @Prop()
  logoUrl?: string;

  @Prop({ type: [String], default: [] })
  doNotUse: string[];
}

@Schema({ _id: false })
class Competitor {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  website: string;

  @Prop()
  notes?: string;
}

@Schema({ _id: false })
class KnowledgeBase {
  @Prop()
  lastIngested?: Date;

  @Prop({ default: 0 })
  documentCount: number;

  @Prop()
  vectorIndexName?: string;
}

@Schema({ _id: false })
class Subscription {
  @Prop({ default: 'free' })
  plan: string;

  @Prop({ default: 'active' })
  status: string;

  @Prop()
  expiresAt?: Date;
}

@Schema({ timestamps: true, collection: 'brands' })
export class Brand {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true })
  slug: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  ownerId: Types.ObjectId;

  @Prop()
  website?: string;

  @Prop()
  industry?: string;

  @Prop()
  description?: string;

  @Prop({ type: BrandGuidelines, default: () => ({}) })
  guidelines: BrandGuidelines;

  @Prop({ type: [Competitor], default: [] })
  competitors: Competitor[];

  @Prop({ type: KnowledgeBase, default: () => ({}) })
  knowledgeBase: KnowledgeBase;

  @Prop({ type: Subscription, default: () => ({}) })
  subscription: Subscription;
}

export const BrandSchema = SchemaFactory.createForClass(Brand);

BrandSchema.index({ slug: 1 }, { unique: true });
BrandSchema.index({ ownerId: 1 });
BrandSchema.index({ industry: 1 });
