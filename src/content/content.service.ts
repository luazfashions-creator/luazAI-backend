import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectQueue } from '@nestjs/bullmq';
import { Model, Types } from 'mongoose';
import { Queue } from 'bullmq';
import {
  ContentAsset,
  ContentAssetDocument,
} from './schemas/content-asset.schema';
import { ContentGeneratorService } from './content-generator.service';
import { TemplateService } from './template.service';
import { GenerateContentDto } from './dto/generate-content.dto';
import { PaginationDto } from '../shared/dto/pagination.dto';
import { QueueName } from '../shared/constants/queues.constant';

@Injectable()
export class ContentService {
  private readonly logger = new Logger(ContentService.name);

  constructor(
    @InjectModel(ContentAsset.name)
    private readonly contentAssetModel: Model<ContentAssetDocument>,
    @InjectQueue(QueueName.CONTENT_GENERATION)
    private readonly contentQueue: Queue,
    private readonly contentGenerator: ContentGeneratorService,
    private readonly templateService: TemplateService,
  ) {}

  async enqueueGeneration(dto: GenerateContentDto) {
    this.logger.log(`Enqueuing content generation for brand ${dto.brandId}`);
    return this.contentQueue.add('generate', dto, {
      removeOnComplete: { age: 86400 },
      removeOnFail: { age: 604800 },
    });
  }

  async listAssets(brandId: string, pagination: PaginationDto) {
    const {
      page = 1,
      limit = 20,
      sort = 'createdAt',
      order = 'desc',
    } = pagination;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.contentAssetModel
        .find({ brandId: new Types.ObjectId(brandId) })
        .sort({ [sort]: order === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.contentAssetModel.countDocuments({
        brandId: new Types.ObjectId(brandId),
      }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getAsset(id: string): Promise<ContentAssetDocument> {
    const asset = await this.contentAssetModel.findById(id).exec();
    if (!asset) {
      throw new NotFoundException(`Content asset ${id} not found`);
    }
    return asset;
  }

  async updateAsset(
    id: string,
    updateData: Record<string, any>,
  ): Promise<ContentAssetDocument> {
    const asset = await this.contentAssetModel
      .findByIdAndUpdate(id, { $set: updateData }, { new: true })
      .exec();
    if (!asset) {
      throw new NotFoundException(`Content asset ${id} not found`);
    }
    return asset;
  }

  async deleteAsset(id: string): Promise<void> {
    const result = await this.contentAssetModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Content asset ${id} not found`);
    }
  }

  async approveAsset(id: string): Promise<ContentAssetDocument> {
    const asset = await this.contentAssetModel
      .findByIdAndUpdate(id, { $set: { status: 'approved' } }, { new: true })
      .exec();
    if (!asset) {
      throw new NotFoundException(`Content asset ${id} not found`);
    }
    return asset;
  }

  getTemplates() {
    return this.templateService.getTemplates();
  }
}
