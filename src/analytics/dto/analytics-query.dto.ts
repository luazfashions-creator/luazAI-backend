import { IsMongoId, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AnalyticsQueryDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  brandId: string;

  @ApiPropertyOptional({ enum: ['7d', '30d', '90d', '12m'], default: '30d' })
  @IsOptional()
  @IsString()
  period?: string;

  @ApiPropertyOptional({ example: 'page_view' })
  @IsOptional()
  @IsString()
  eventType?: string;

  @ApiPropertyOptional({ example: 'google' })
  @IsOptional()
  @IsString()
  source?: string;
}
