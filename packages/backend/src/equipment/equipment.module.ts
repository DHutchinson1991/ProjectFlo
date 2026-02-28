import { Module } from '@nestjs/common';
import { EquipmentService } from './equipment.service';
import { EquipmentController } from './equipment.controller';
import { EquipmentTemplatesController } from './equipment-templates.controller';
import { EquipmentTemplatesService } from './equipment-templates.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [EquipmentController, EquipmentTemplatesController],
    providers: [EquipmentService, EquipmentTemplatesService],
    exports: [EquipmentService],
})
export class EquipmentModule { }
