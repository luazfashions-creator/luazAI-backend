import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { EventTrackerService } from './event-tracker.service';
import { ReportBuilderService } from './report-builder.service';
import { TrackEventDto } from './dto/track-event.dto';
import { AuthGuard } from '../shared/guards/auth.guard';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly eventTracker: EventTrackerService,
    private readonly reportBuilder: ReportBuilderService,
  ) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get analytics overview for a brand' })
  @ApiQuery({ name: 'brandId', required: true })
  @ApiQuery({ name: 'period', required: false, enum: ['7d', '30d', '90d', '12m'] })
  async getOverview(
    @Query('brandId') brandId: string,
    @Query('period') period: string = '30d',
  ) {
    return this.reportBuilder.getOverview(brandId, period);
  }

  @Get('seo')
  @ApiOperation({ summary: 'Get SEO analytics' })
  @ApiQuery({ name: 'brandId', required: true })
  @ApiQuery({ name: 'period', required: false })
  async getSeoAnalytics(
    @Query('brandId') brandId: string,
    @Query('period') period: string = '30d',
  ) {
    return this.reportBuilder.getSeoReport(brandId, period);
  }

  @Get('content')
  @ApiOperation({ summary: 'Get content analytics' })
  @ApiQuery({ name: 'brandId', required: true })
  async getContentAnalytics(@Query('brandId') brandId: string) {
    return this.reportBuilder.getContentReport(brandId);
  }

  @Get('campaigns/:id')
  @ApiOperation({ summary: 'Get campaign analytics' })
  async getCampaignAnalytics(@Param('id') id: string) {
    return this.reportBuilder.getCampaignReport(id);
  }

  @Post('events')
  @ApiOperation({ summary: 'Track an analytics event' })
  async trackEvent(@Body() dto: TrackEventDto) {
    const event = await this.eventTracker.track(dto);
    return { id: event._id, status: 'tracked' };
  }

  @Get('reports')
  @ApiOperation({ summary: 'Get aggregated reports' })
  @ApiQuery({ name: 'brandId', required: true })
  @ApiQuery({ name: 'period', required: false })
  async getReports(
    @Query('brandId') brandId: string,
    @Query('period') period: string = '30d',
  ) {
    return this.reportBuilder.getOverview(brandId, period);
  }

  @Get('visibility')
  @ApiOperation({ summary: 'Get search visibility (placeholder for Phase 2)' })
  @ApiQuery({ name: 'brandId', required: true })
  async getVisibility(@Query('brandId') brandId: string) {
    return {
      brandId,
      message: 'Search visibility tracking — available in Phase 2',
      status: HttpStatus.NOT_IMPLEMENTED,
    };
  }
}
