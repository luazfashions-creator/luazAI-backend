import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Job } from 'bullmq';
import { ContentGeneratorService } from './content-generator.service';
import { ContentAsset, ContentAssetDocument } from './schemas/content-asset.schema';
import { QueueName } from '../shared/constants/queues.constant';

@Processor(QueueName.CONTENT_GENERATION)
export class ContentGenerationProcessor extends WorkerHost {
  private readonly logger = new Logger(ContentGenerationProcessor.name);

  constructor(
    private readonly contentGenerator: ContentGeneratorService,
    @InjectModel(ContentAsset.name)
    private readonly contentAssetModel: Model<ContentAssetDocument>,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.log(`Processing content generation job ${job.id}`);

    const { brandId, type, brief } = job.data;

    await job.updateProgress(10);

    const result = await this.contentGenerator.generate({
      brandId,
      type,
      topic: brief.topic,
      keywords: brief.keywords,
      tone: brief.tone,
      wordCount: brief.wordCount,
      targetAudience: brief.targetAudience,
    });

    await job.updateProgress(80);

    await this.contentAssetModel.create({
      brandId: new Types.ObjectId(brandId),
      type,
      title: result.title,
      body: result.body,
      metadata: result.metadata,
      status: 'draft',
      generatedBy: {
        model: result.model,
        promptVersion: '1.0',
      },
    });

    await job.updateProgress(100);
    this.logger.log(`Content generation job ${job.id} completed`);
  }
}
