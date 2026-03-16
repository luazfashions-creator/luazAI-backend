import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsArray,
  IsOptional,
  IsInt,
  Min,
  Max,
  ArrayMinSize,
} from 'class-validator';

export class KeywordResearchDto {
  @ApiProperty({ description: 'Brand ID' })
  @IsString()
  brandId: string;

  @ApiProperty({ type: [String], example: ['seo tools', 'keyword research'] })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  seedKeywords: string[];

  @ApiPropertyOptional({ default: 'us' })
  @IsOptional()
  @IsString()
  country?: string = 'us';

  @ApiPropertyOptional({ default: 'en' })
  @IsOptional()
  @IsString()
  language?: string = 'en';

  @ApiPropertyOptional({ default: 20, minimum: 5, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(100)
  limit?: number = 20;
}
