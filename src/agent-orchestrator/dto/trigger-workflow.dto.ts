import { IsMongoId, IsNotEmpty, IsString, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TriggerWorkflowDto {
  @ApiProperty({ example: 'seo-analysis', description: 'Workflow name: seo-analysis | content-generation' })
  @IsNotEmpty()
  @IsString()
  workflow: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  brandId: string;

  @ApiPropertyOptional({ example: { seedKeywords: ['seo', 'marketing'] } })
  @IsOptional()
  @IsObject()
  input?: Record<string, any>;
}
