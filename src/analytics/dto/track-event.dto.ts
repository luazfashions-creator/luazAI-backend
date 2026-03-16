import {
  IsMongoId,
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TrackEventDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  brandId: string;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439012' })
  @IsOptional()
  @IsMongoId()
  campaignId?: string;

  @ApiProperty({ example: 'page_view' })
  @IsNotEmpty()
  @IsString()
  eventType: string;

  @ApiProperty({ example: 'google' })
  @IsNotEmpty()
  @IsString()
  source: string;

  @ApiPropertyOptional({ example: 'organic' })
  @IsOptional()
  @IsString()
  channel?: string;

  @ApiProperty({ example: 'views' })
  @IsNotEmpty()
  @IsString()
  metric: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  value: number;

  @ApiPropertyOptional({ example: { device: 'mobile', country: 'US' } })
  @IsOptional()
  @IsObject()
  dimensions?: Record<string, string>;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439013' })
  @IsOptional()
  @IsMongoId()
  contentAssetId?: string;
}
