import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BrandController } from './brand.controller';
import { BrandService } from './brand.service';
import { BrandRepository } from './brand.repository';
import { Brand, BrandSchema } from './schemas/brand.schema';
import { AgentOrchestratorModule } from '../agent-orchestrator/agent-orchestrator.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Brand.name, schema: BrandSchema }]),
    forwardRef(() => AgentOrchestratorModule),
  ],
  controllers: [BrandController],
  providers: [BrandService, BrandRepository],
  exports: [BrandService, BrandRepository],
})
export class BrandModule {}
