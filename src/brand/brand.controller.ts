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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BrandService } from './brand.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { PaginationDto } from '../shared/dto/pagination.dto';
import { AuthGuard } from '../shared/guards/auth.guard';
import { RolesGuard } from '../shared/guards/roles.guard';
import { Roles } from '../shared/decorators/roles.decorator';
import { CurrentUser } from '../shared/decorators/current-user.decorator';
import { Role } from '../shared/constants/roles.constant';
import { WorkflowEngineService } from '../agent-orchestrator/workflow-engine.service';

@ApiTags('Brands')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('brands')
export class BrandController {
  constructor(
    private readonly brandService: BrandService,
    private readonly workflowEngine: WorkflowEngineService,
  ) {}

  @Post()
  @Roles(Role.OWNER, Role.ADMIN)
  @ApiOperation({ summary: 'Create a new brand' })
  async create(@Body() dto: CreateBrandDto, @CurrentUser('id') userId: string) {
    return this.brandService.create(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: "List user's brands" })
  async findAll(
    @CurrentUser('id') userId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.brandService.findAll(userId, pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get brand details' })
  async findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.brandService.findOne(id, userId);
  }

  @Patch(':id')
  @Roles(Role.OWNER, Role.ADMIN)
  @ApiOperation({ summary: 'Update a brand' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateBrandDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.brandService.update(id, dto, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.OWNER)
  @ApiOperation({ summary: 'Delete a brand' })
  async delete(@Param('id') id: string, @CurrentUser('id') userId: string) {
    await this.brandService.delete(id, userId);
  }

  @Post(':id/ingest')
  @Roles(Role.OWNER, Role.ADMIN)
  @ApiOperation({
    summary: 'Trigger brand knowledge ingestion via Brand Profiler agent',
  })
  async ingest(@Param('id') id: string) {
    const result = await this.workflowEngine.startWorkflow(
      {
        name: 'Brand Ingestion',
        steps: [{ agentType: 'brand-profiler', input: {} }],
      },
      id,
    );
    return {
      workflowId: result.workflowId,
      status: 'started',
      message: 'Brand ingestion workflow triggered',
    };
  }

  @Get(':id/knowledge')
  @ApiOperation({ summary: 'Get brand knowledge base stats' })
  async getKnowledge(@Param('id') id: string) {
    const brand = await this.brandService.findById(id);
    return {
      brandId: id,
      knowledgeBase: brand.knowledgeBase || {
        documentCount: 0,
        lastIngested: null,
      },
    };
  }
}
