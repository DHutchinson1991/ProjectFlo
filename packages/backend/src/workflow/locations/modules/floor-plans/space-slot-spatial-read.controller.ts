import {
    Controller,
    Get,
    Param,
    ParseIntPipe,
    UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SpaceSlotSpatialService } from './space-slot-spatial.service';
import { SpaceSlotSpatialSyncService } from './space-slot-spatial-sync.service';

@Controller('api/space-slots')
@UseGuards(AuthGuard('jwt'))
export class SpaceSlotSpatialReadController {
    constructor(
        private readonly reader: SpaceSlotSpatialService,
        private readonly sync: SpaceSlotSpatialSyncService,
    ) {}

    @Get('by-activity/:activityId')
    findByActivity(@Param('activityId', ParseIntPipe) activityId: number) {
        return this.sync.getByActivity(activityId);
    }

    @Get('by-package/:packageId')
    findByPackage(@Param('packageId', ParseIntPipe) packageId: number) {
        return this.sync.getByPackage(packageId);
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.reader.getById(id);
    }

    @Get(':slotId/moments/:momentId')
    findMomentOverrides(
        @Param('slotId', ParseIntPipe) slotId: number,
        @Param('momentId', ParseIntPipe) momentId: number,
    ) {
        return this.reader.getMomentOverrides(slotId, momentId);
    }

    @Get(':slotId/zones')
    findZones(@Param('slotId', ParseIntPipe) slotId: number) {
        return this.reader.getZones(slotId);
    }
}