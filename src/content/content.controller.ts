import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ContentService } from './content.service';
import { GenerateContentDto } from './dto/generate-content.dto';
import { AuthGuard } from '../shared/guards/auth.guard';
import { PaginationDto } from '../shared/dto/pagination.dto';

@ApiTags('Content')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate content asynchronously' })
  async generate(@Body() dto: GenerateContentDto) {
    const job = await this.contentService.enqueueGeneration(dto);
    return { jobId: job.id, status: 'queued' };
  }

  @Get('assets')
  @ApiOperation({ summary: 'List content assets for a brand' })
  @ApiQuery({ name: 'brandId', required: true })
  async listAssets(
    @Query('brandId') brandId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.contentService.listAssets(brandId, pagination);
  }

  @Get('templates')
  @ApiOperation({ summary: 'List available content templates' })
  async getTemplates() {
    return this.contentService.getTemplates();
  }

  @Get('assets/:id')
  @ApiOperation({ summary: 'Get content asset detail' })
  async getAsset(@Param('id') id: string) {
    return this.contentService.getAsset(id);
  }

  @Patch('assets/:id')
  @ApiOperation({ summary: 'Update content asset' })
  async updateAsset(
    @Param('id') id: string,
    @Body() updateData: Record<string, any>,
  ) {
    return this.contentService.updateAsset(id, updateData);
  }

  @Delete('assets/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete content asset' })
  async deleteAsset(@Param('id') id: string) {
    await this.contentService.deleteAsset(id);
  }

  @Post('assets/:id/approve')
  @ApiOperation({ summary: 'Approve content asset' })
  async approveAsset(@Param('id') id: string) {
    return this.contentService.approveAsset(id);
  }
}
