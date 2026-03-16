import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ContentType } from '../../shared/enums/content-type.enum';

export type ContentAssetDocument = HydratedDocument<ContentAsset>;

@Schema({ _id: false })
class ContentMetadata {
  @Prop({ type: [String], default: [] })
  keywords: string[];

  @Prop()
  targetAudience?: string;

  @Prop()
  tone?: string;

  @Prop()
  wordCount?: number;

  @Prop()
  readingLevel?: string;
}

@Schema({ _id: false })
class GeneratedBy {
  @Prop()
  agentId?: string;

  @Prop()
  model?: string;

  @Prop()
  promptVersion?: string;
}

@Schema({ timestamps: true, collection: 'content_assets' })
export class ContentAsset {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  brandId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, index: true })
  campaignId?: Types.ObjectId;

  @Prop({ required: true, enum: ContentType })
  type: ContentType;

  @Prop({ required: true })
  title: string;

  @Prop()
  body?: string;

  @Prop({ type: ContentMetadata, default: {} })
  metadata: ContentMetadata;

  @Prop({ type: Number, min: 0, max: 100 })
  seoScore?: number;

  @Prop({ default: 'pending' })
  complianceStatus: string;

  @Prop({
    required: true,
    enum: ['draft', 'approved', 'published', 'archived'],
    default: 'draft',
    index: true,
  })
  status: string;

  @Prop({ type: [String], default: [] })
  publishedTo: string[];

  @Prop()
  s3Key?: string;

  @Prop({ type: [Number], default: [] })
  embedding: number[];

  @Prop({ type: GeneratedBy, default: {} })
  generatedBy: GeneratedBy;
}

export const ContentAssetSchema = SchemaFactory.createForClass(ContentAsset);

ContentAssetSchema.index({ brandId: 1, type: 1 });
ContentAssetSchema.index({ campaignId: 1 });
