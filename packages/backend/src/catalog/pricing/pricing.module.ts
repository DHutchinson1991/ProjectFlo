import { Module } from '@nestjs/common';
import { PricingService } from './pricing.service';
import { PricingAuditService } from './services/pricing-audit.service';
import { PricingController } from './pricing.controller';
import { PrismaModule } from '../../platform/prisma/prisma.module';
import { TaskLibraryModule } from '../../workflow/task-library/task-library.module';

@Module({
  imports: [PrismaModule, TaskLibraryModule],
  controllers: [PricingController],
  providers: [PricingService, PricingAuditService],
  exports: [PricingService, PricingAuditService],
})
export class PricingModule {}
