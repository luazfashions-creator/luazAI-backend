import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';
import { ContentGeneratorService } from './content-generator.service';
import { TemplateService } from './template.service';
import { ContentGenerationProcessor } from './content-generation.processor';
import {
  ContentAsset,
  ContentAssetSchema,
} from './schemas/content-asset.schema';
import { BrandModule } from '../brand/brand.module';
import { QueueName } from '../shared/constants/queues.constant';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ContentAsset.name, schema: ContentAssetSchema },
    ]),
    BullModule.registerQueue({ name: QueueName.CONTENT_GENERATION }),
    forwardRef(() => BrandModule),
  ],
  controllers: [ContentController],
  providers: [
    ContentService,
    ContentGeneratorService,
    TemplateService,
    ContentGenerationProcessor,
  ],
  exports: [ContentService, ContentGeneratorService],
})
export class ContentModule {}
