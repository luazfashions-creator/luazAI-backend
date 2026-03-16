import { IsEnum, IsMongoId, IsNotEmpty, IsOptional, IsBoolean, IsArray, IsString, IsNumber, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContentType } from '../../shared/enums/content-type.enum';

class ContentBriefDto {
  @ApiProperty({ example: 'Top 10 SEO Tips for 2025' })
  @IsNotEmpty()
  @IsString()
  topic: string;

  @ApiPropertyOptional({ example: ['seo tips', 'search optimization'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];

  @ApiPropertyOptional({ example: 'professional' })
  @IsOptional()
  @IsString()
  tone?: string;

  @ApiPropertyOptional({ example: 1500 })
  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(10000)
  wordCount?: number;

  @ApiPropertyOptional({ example: 'Marketing professionals' })
  @IsOptional()
  @IsString()
  targetAudience?: string;
}

export class GenerateContentDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  brandId: string;

  @ApiProperty({ enum: ContentType, example: ContentType.BLOG_POST })
  @IsEnum(ContentType)
  type: ContentType;

  @ApiProperty({ type: ContentBriefDto })
  @ValidateNested()
  @Type(() => ContentBriefDto)
  brief: ContentBriefDto;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  useRAG?: boolean;
}
