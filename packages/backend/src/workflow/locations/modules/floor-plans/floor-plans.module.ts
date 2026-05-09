import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../../platform/prisma/prisma.module';
import { FloorPlansController } from './floor-plans.controller';
import { FloorPlansService } from './floor-plans.service';
import { SpaceSlotBlockingEnvironmentController } from './space-slot-blocking-environment.controller';
import { SpaceSlotBlockingEnvironmentService } from './space-slot-blocking-environment.service';
import { SpaceSlotLayoutService } from './space-slot-layout.service';
import { SpaceSlotSpatialEditorController } from './space-slot-spatial-editor.controller';
import { SpaceSlotSpatialEditorService } from './space-slot-spatial-editor.service';
import { SpaceSlotSpatialReadController } from './space-slot-spatial-read.controller';
import { SpaceSlotSpatialService } from './space-slot-spatial.service';
import { SpaceSlotSpatialSyncService } from './space-slot-spatial-sync.service';

@Module({
    imports: [PrismaModule],
    controllers: [
        FloorPlansController,
        SpaceSlotSpatialReadController,
        SpaceSlotSpatialEditorController,
        SpaceSlotBlockingEnvironmentController,
    ],
    providers: [
        FloorPlansService,
        SpaceSlotSpatialService,
        SpaceSlotSpatialSyncService,
        SpaceSlotSpatialEditorService,
        SpaceSlotLayoutService,
        SpaceSlotBlockingEnvironmentService,
    ],
    exports: [
        FloorPlansService,
        SpaceSlotSpatialService,
        SpaceSlotSpatialSyncService,
        SpaceSlotSpatialEditorService,
        SpaceSlotLayoutService,
        SpaceSlotBlockingEnvironmentService,
    ],
})
export class FloorPlansModule {}
