import { Module } from '@nestjs/common';
import { BrandFinanceSettingsController } from './brand-finance-settings.controller';
import { BrandFinanceSettingsService } from './brand-finance-settings.service';
import { PrismaModule } from '../../platform/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BrandFinanceSettingsController],
  providers: [BrandFinanceSettingsService],
  exports: [BrandFinanceSettingsService],
})
export class BrandFinanceSettingsModule {}
