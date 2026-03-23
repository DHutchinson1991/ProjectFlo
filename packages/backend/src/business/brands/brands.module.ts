import { Module } from '@nestjs/common';
import { BrandsService } from './brands.service';
import { BrandsController } from './brands.controller';
import { PrismaService } from '../../prisma/prisma.service';
import { BrandProvisioningService } from './brand-provisioning.service';

@Module({
    controllers: [BrandsController],
    providers: [BrandsService, BrandProvisioningService, PrismaService],
    exports: [BrandsService],
})
export class BrandsModule { }
