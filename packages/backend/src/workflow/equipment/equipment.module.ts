import { Module } from '@nestjs/common';
import { EquipmentService } from './equipment.service';
import { EquipmentQueryService } from './equipment-query.service';
import { EquipmentAvailabilityService } from './equipment-availability.service';
import { EquipmentController } from './equipment.controller';
import { EquipmentTemplatesController } from './equipment-templates.controller';
import { EquipmentTemplatesService } from './equipment-templates.service';
import { PrismaModule } from '../../platform/prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [EquipmentController, EquipmentTemplatesController],
    providers: [EquipmentService, EquipmentQueryService, EquipmentAvailabilityService, EquipmentTemplatesService],
    exports: [EquipmentService, EquipmentQueryService],
})
export class EquipmentModule { }
