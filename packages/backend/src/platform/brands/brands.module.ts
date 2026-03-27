import { Module } from '@nestjs/common';
import { PrismaModule } from '../../platform/prisma/prisma.module';
import { BrandsService } from './brands.service';
import { BrandsController } from './brands.controller';
import { BrandProvisioningService } from './brand-provisioning.service';
import { BrandMembershipsService } from './services/brand-memberships.service';
import { BrandSettingsService } from './services/brand-settings.service';

@Module({
    imports: [PrismaModule],
    controllers: [BrandsController],
    providers: [
        BrandsService,
        BrandProvisioningService,
        BrandMembershipsService,
        BrandSettingsService,
    ],
    exports: [BrandsService],
})
export class BrandsModule { }
