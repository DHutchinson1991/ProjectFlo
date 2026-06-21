import { Module } from '@nestjs/common';
import { PrismaModule } from '../../platform/prisma/prisma.module';
import { EquipmentPresetsController } from './equipment-presets.controller';
import { EquipmentPresetsService } from './equipment-presets.service';

@Module({
  imports: [PrismaModule],
  controllers: [EquipmentPresetsController],
  providers: [EquipmentPresetsService],
  exports: [EquipmentPresetsService],
})
export class EquipmentPresetsModule {}
