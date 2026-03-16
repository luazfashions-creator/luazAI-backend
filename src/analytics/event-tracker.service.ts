import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AnalyticsEvent, AnalyticsEventDocument } from './schemas/analytics-event.schema';
import { TrackEventDto } from './dto/track-event.dto';

@Injectable()
export class EventTrackerService {
  private readonly logger = new Logger(EventTrackerService.name);

  constructor(
    @InjectModel(AnalyticsEvent.name)
    private readonly eventModel: Model<AnalyticsEventDocument>,
  ) {}

  async track(dto: TrackEventDto): Promise<AnalyticsEventDocument> {
    this.logger.debug(`Tracking event: ${dto.eventType} for brand ${dto.brandId}`);

    return this.eventModel.create({
      brandId: new Types.ObjectId(dto.brandId),
      campaignId: dto.campaignId ? new Types.ObjectId(dto.campaignId) : undefined,
      eventType: dto.eventType,
      source: dto.source,
      channel: dto.channel,
      metric: dto.metric,
      value: dto.value,
      dimensions: dto.dimensions || {},
      contentAssetId: dto.contentAssetId
        ? new Types.ObjectId(dto.contentAssetId)
        : undefined,
      timestamp: new Date(),
    });
  }

  async trackBatch(events: TrackEventDto[]): Promise<number> {
    const docs = events.map((dto) => ({
      brandId: new Types.ObjectId(dto.brandId),
      campaignId: dto.campaignId ? new Types.ObjectId(dto.campaignId) : undefined,
      eventType: dto.eventType,
      source: dto.source,
      channel: dto.channel,
      metric: dto.metric,
      value: dto.value,
      dimensions: dto.dimensions || {},
      contentAssetId: dto.contentAssetId
        ? new Types.ObjectId(dto.contentAssetId)
        : undefined,
      timestamp: new Date(),
    }));

    const result = await this.eventModel.insertMany(docs);
    return result.length;
  }
}
