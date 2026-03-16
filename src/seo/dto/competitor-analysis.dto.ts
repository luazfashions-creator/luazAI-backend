import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CompetitorAnalysisDto {
  @ApiProperty({ description: 'Brand ID' })
  @IsString()
  brandId: string;
}
