import { Module } from '@nestjs/common';
import { PricingService } from './pricing.service';
import { PrismaService } from '../prisma.service';

@Module({
  providers: [PricingService, PrismaService],
  exports: [PricingService],
})
export class PricingModule {}
