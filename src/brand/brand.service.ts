import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { BrandRepository } from './brand.repository';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { generateSlug } from '../shared/utils/slug.util';
import { PaginationDto } from '../shared/dto/pagination.dto';
import { BrandDocument } from './schemas/brand.schema';
import { PaginatedResponse } from '../shared/interfaces/paginated-response.interface';

const CACHE_PREFIX = 'cache:brand:';
const CACHE_TTL = 900; // 15 minutes

@Injectable()
export class BrandService {
  private readonly logger = new Logger(BrandService.name);
  private readonly redis: Redis;

  constructor(
    private readonly brandRepo: BrandRepository,
    private readonly config: ConfigService,
  ) {
    this.redis = new Redis({
      host: this.config.get<string>('redis.host'),
      port: this.config.get<number>('redis.port'),
      password: this.config.get<string>('redis.password'),
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
  }

  async create(dto: CreateBrandDto, userId: string): Promise<BrandDocument> {
    const slug = generateSlug(dto.name);

    const existing = await this.brandRepo.findBySlug(slug);
    if (existing) {
      throw new ConflictException(`Brand with slug "${slug}" already exists`);
    }

    const brand = await this.brandRepo.create({
      name: dto.name,
      slug,
      ownerId: userId as any,
      website: dto.website,
      industry: dto.industry,
      description: dto.description,
      guidelines: dto.guidelines as any,
      competitors: dto.competitors as any,
    });

    this.logger.log(`Brand created: ${brand.name} (${brand.slug})`);
    return brand;
  }

  async findAll(
    userId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResponse<BrandDocument>> {
    const { page, limit, sort, order } = pagination;
    const { data, total } = await this.brandRepo.findByOwner(
      userId,
      page,
      limit,
      sort || 'createdAt',
      order || 'desc',
    );

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userId: string): Promise<BrandDocument> {
    // Check cache
    const cached = await this.redis.get(`${CACHE_PREFIX}${id}`);
    if (cached) {
      return JSON.parse(cached);
    }

    const brand = await this.brandRepo.findById(id);
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    this.checkOwnership(brand, userId);

    // Cache the result
    await this.redis.setex(`${CACHE_PREFIX}${id}`, CACHE_TTL, JSON.stringify(brand));

    return brand;
  }

  async findById(id: string): Promise<BrandDocument> {
    const cached = await this.redis.get(`${CACHE_PREFIX}${id}`);
    if (cached) {
      return JSON.parse(cached);
    }

    const brand = await this.brandRepo.findById(id);
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    await this.redis.setex(`${CACHE_PREFIX}${id}`, CACHE_TTL, JSON.stringify(brand));
    return brand;
  }

  async update(
    id: string,
    dto: UpdateBrandDto,
    userId: string,
  ): Promise<BrandDocument> {
    const brand = await this.brandRepo.findById(id);
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    this.checkOwnership(brand, userId);

    const updateData: Record<string, unknown> = { ...dto };
    if (dto.name) {
      updateData.slug = generateSlug(dto.name);
    }

    const updated = await this.brandRepo.update(id, updateData);
    if (!updated) {
      throw new NotFoundException('Brand not found');
    }

    // Invalidate cache
    await this.redis.del(`${CACHE_PREFIX}${id}`);

    return updated;
  }

  async delete(id: string, userId: string): Promise<void> {
    const brand = await this.brandRepo.findById(id);
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    this.checkOwnership(brand, userId);

    await this.brandRepo.delete(id);
    await this.redis.del(`${CACHE_PREFIX}${id}`);

    this.logger.log(`Brand deleted: ${brand.name}`);
  }

  private checkOwnership(brand: BrandDocument, userId: string): void {
    if (brand.ownerId.toString() !== userId) {
      throw new ForbiddenException('You do not own this brand');
    }
  }
}
