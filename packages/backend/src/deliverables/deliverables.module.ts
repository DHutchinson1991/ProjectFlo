import { Module } from '@nestjs/common';
import { DeliverablesController } from './deliverables.controller';
import { DeliverablesService } from './deliverables.service';
import { PrismaService } from '../prisma.service';
import { AuditService } from '../audit/audit.service';
import { PricingService } from '../pricing/pricing.service';

@Module({
  controllers: [DeliverablesController],
  providers: [DeliverablesService, PrismaService, AuditService, PricingService],
  exports: [DeliverablesService],
})
export class DeliverablesModule {}