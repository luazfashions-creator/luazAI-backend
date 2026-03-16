import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AnalyticsEvent, AnalyticsEventDocument } from './schemas/analytics-event.schema';

@Injectable()
export class ReportBuilderService {
  private readonly logger = new Logger(ReportBuilderService.name);

  constructor(
    @InjectModel(AnalyticsEvent.name)
    private readonly eventModel: Model<AnalyticsEventDocument>,
  ) {}

  async getOverview(brandId: string, period: string) {
    const since = this.periodToDate(period);

    const pipeline = [
      {
        $match: {
          brandId: new Types.ObjectId(brandId),
          timestamp: { $gte: since },
        },
      },
      {
        $group: {
          _id: '$eventType',
          totalValue: { $sum: '$value' },
          count: { $sum: 1 },
        },
      },
      { $sort: { totalValue: -1 as const } },
    ];

    const results = await this.eventModel.aggregate(pipeline).exec();

    return {
      brandId,
      period,
      since,
      metrics: results.map((r) => ({
        eventType: r._id,
        totalValue: r.totalValue,
        count: r.count,
      })),
    };
  }

  async getSeoReport(brandId: string, period: string) {
    const since = this.periodToDate(period);

    const results = await this.eventModel
      .aggregate([
        {
          $match: {
            brandId: new Types.ObjectId(brandId),
            source: { $in: ['google', 'bing', 'organic'] },
            timestamp: { $gte: since },
          },
        },
        {
          $group: {
            _id: { source: '$source', metric: '$metric' },
            totalValue: { $sum: '$value' },
            count: { $sum: 1 },
          },
        },
      ])
      .exec();

    return { brandId, period, since, seoMetrics: results };
  }

  async getContentReport(brandId: string) {
    const results = await this.eventModel
      .aggregate([
        {
          $match: {
            brandId: new Types.ObjectId(brandId),
            contentAssetId: { $exists: true, $ne: null },
          },
        },
        {
          $group: {
            _id: '$contentAssetId',
            totalEngagement: { $sum: '$value' },
            eventTypes: { $addToSet: '$eventType' },
            count: { $sum: 1 },
          },
        },
        { $sort: { totalEngagement: -1 as const } },
        { $limit: 50 },
      ])
      .exec();

    return { brandId, contentMetrics: results };
  }

  async getCampaignReport(campaignId: string) {
    const results = await this.eventModel
      .aggregate([
        { $match: { campaignId: new Types.ObjectId(campaignId) } },
        {
          $group: {
            _id: { eventType: '$eventType', source: '$source' },
            totalValue: { $sum: '$value' },
            count: { $sum: 1 },
          },
        },
      ])
      .exec();

    return { campaignId, campaignMetrics: results };
  }

  private periodToDate(period: string): Date {
    const now = new Date();
    switch (period) {
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case '12m':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      case '30d':
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }
}
