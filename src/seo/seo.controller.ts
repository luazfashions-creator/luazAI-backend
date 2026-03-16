import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SeoService } from './seo.service';
import { KeywordResearchDto } from './dto/keyword-research.dto';
import { CompetitorAnalysisDto } from './dto/competitor-analysis.dto';
import { PaginationDto } from '../shared/dto/pagination.dto';
import { AuthGuard } from '../shared/guards/auth.guard';
import { CurrentUser } from '../shared/decorators/current-user.decorator';

@ApiTags('SEO')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('seo')
export class SeoController {
  constructor(private readonly seoService: SeoService) {}

  @Get('keywords')
  @ApiOperation({ summary: 'List keywords for a brand' })
  async getKeywords(
    @Query('brandId') brandId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.seoService.getKeywords(brandId, pagination);
  }

  @Post('keywords/research')
  @ApiOperation({ summary: 'Trigger async keyword research' })
  async triggerResearch(@Body() dto: KeywordResearchDto) {
    return this.seoService.triggerKeywordResearch(
      dto.brandId,
      dto.seedKeywords,
      dto.country || 'us',
      dto.language || 'en',
      dto.limit || 20,
    );
  }

  @Get('keywords/:id')
  @ApiOperation({ summary: 'Get keyword detail' })
  async getKeyword(@Param('id') id: string) {
    return this.seoService.getKeywordById(id);
  }

  @Post('competitors/analyze')
  @ApiOperation({ summary: 'Trigger competitor analysis' })
  async analyzeCompetitors(
    @Body() dto: CompetitorAnalysisDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.seoService.triggerCompetitorAnalysis(dto.brandId, userId);
  }

  @Get('competitors')
  @ApiOperation({ summary: 'Get competitor analysis results' })
  async getCompetitors(@Query('brandId') brandId: string) {
    return this.seoService.getCompetitorResults(brandId);
  }

  @Get('score')
  @ApiOperation({ summary: 'Get SEO score summary' })
  async getScore(@Query('brandId') brandId: string) {
    return this.seoService.getSeoScore(brandId);
  }

  @Get('content-gaps')
  @ApiOperation({ summary: 'Get content gap analysis' })
  async getContentGaps(@Query('brandId') brandId: string) {
    return this.seoService.getContentGaps(brandId);
  }

  @Post('audit')
  @ApiOperation({ summary: 'Trigger full SEO audit' })
  async triggerAudit(@Body('brandId') brandId: string) {
    return this.seoService.triggerFullAudit(brandId);
  }
}
