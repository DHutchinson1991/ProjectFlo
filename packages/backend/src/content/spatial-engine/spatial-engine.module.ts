import { Module } from '@nestjs/common';
import { PrismaModule } from '../../platform/prisma/prisma.module';
import { FloorplanDataService } from './services/floorplan-data.service';
import { SpatialTranslatorService } from './services/spatial-translator.service';
import { DynamicControlnetService } from './services/dynamic-controlnet.service';
import { SpatialOverlayService } from './services/spatial-overlay.service';

@Module({
  imports: [PrismaModule],
  providers: [
    FloorplanDataService,
    SpatialTranslatorService,
    DynamicControlnetService,
    SpatialOverlayService,
  ],
  exports: [
    FloorplanDataService,
    SpatialTranslatorService,
    DynamicControlnetService,
    SpatialOverlayService,
  ],
})
export class SpatialEngineModule {}
