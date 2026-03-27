import { Module } from '@nestjs/common';
import { ServicePackagesService } from './service-packages.service';
import { ServicePackagesBuilderService } from './services/service-packages-builder.service';
import { ServicePackagesVersionsService } from './services/service-packages-versions.service';
import { ServicePackagesController } from './service-packages.controller';
import { PrismaModule } from '../../platform/prisma/prisma.module';
import { PricingModule } from '../pricing/pricing.module';

@Module({
  imports: [PrismaModule, PricingModule],
  controllers: [ServicePackagesController],
  providers: [ServicePackagesService, ServicePackagesBuilderService, ServicePackagesVersionsService],
  exports: [ServicePackagesService],
})
export class ServicePackagesModule {}
