import { Module } from '@nestjs/common';
import { PricingService } from './pricing.service';
import { PricingController } from './pricing.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { TaskLibraryModule } from '../task-library/task-library.module';

@Module({
  imports: [PrismaModule, TaskLibraryModule],
  controllers: [PricingController],
  providers: [PricingService],
  exports: [PricingService],
})
export class PricingModule {}
