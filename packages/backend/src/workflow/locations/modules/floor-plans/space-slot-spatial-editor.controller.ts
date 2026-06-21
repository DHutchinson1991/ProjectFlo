import {
    Body,
    Controller,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Put,
    UseGuards,
    ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
    SaveSpaceSlotCanvasDto,
    UpsertSpaceSlotZoneDto,
} from './dto/space-slot-spatial.dto';
import { SpaceSlotSpatialEditorService } from './space-slot-spatial-editor.service';

@Controller('api/space-slots')
@UseGuards(AuthGuard('jwt'))
export class SpaceSlotSpatialEditorController {
    constructor(private readonly editor: SpaceSlotSpatialEditorService) {}

    @Patch(':id/canvas')
    updateCanvas(
        @Param('id', ParseIntPipe) id: number,
        @Body(ValidationPipe) dto: SaveSpaceSlotCanvasDto,
    ) {
        return this.editor.saveCanvas(id, dto);
    }

    @Patch('cameras/:id/position')
    updateCameraPosition(
        @Param('id', ParseIntPipe) id: number,
        @Body() body: { x: number; y: number; rotation?: number; sceneMomentId?: number },
    ) {
        return this.editor.updateCameraPosition(id, body.x, body.y, body.rotation, body.sceneMomentId);
    }

    @Patch('subjects/:id/position')
    updateSubjectPosition(
        @Param('id', ParseIntPipe) id: number,
        @Body() body: {
            x: number;
            y: number;
            rotation?: number;
            packageMomentId?: number;
            sceneMomentId?: number;
        },
    ) {
        return this.editor.updateSubjectPosition(
            id,
            body.x,
            body.y,
            body.rotation,
            body.packageMomentId,
            body.sceneMomentId,
        );
    }

    @Put('moment-cameras/:cameraPositionId/:momentId')
    updateMomentCamera(
        @Param('cameraPositionId', ParseIntPipe) cameraPositionId: number,
        @Param('momentId', ParseIntPipe) momentId: number,
        @Body() body: { x: number; y: number; rotation?: number; sceneMomentId?: number },
    ) {
        return this.editor.upsertMomentCamera(
            cameraPositionId,
            momentId,
            body.x,
            body.y,
            body.rotation,
            body.sceneMomentId,
        );
    }

    @Put('moment-subjects/:subjectPositionId/:momentId')
    updateMomentSubject(
        @Param('subjectPositionId', ParseIntPipe) subjectPositionId: number,
        @Param('momentId', ParseIntPipe) momentId: number,
        @Body() body: { x: number; y: number; rotation?: number; sceneMomentId?: number },
    ) {
        return this.editor.upsertMomentSubject(
            subjectPositionId,
            momentId,
            body.x,
            body.y,
            body.rotation,
            body.sceneMomentId,
        );
    }

    @Post(':slotId/aim-cameras')
    aimCameras(
        @Param('slotId', ParseIntPipe) slotId: number,
        @Body() body: { packageMomentId: number; sceneMomentId: number },
    ) {
        return this.editor.aimCamerasForMoment(slotId, body.packageMomentId, body.sceneMomentId);
    }

    @Put(':slotId/zones')
    updateZones(
        @Param('slotId', ParseIntPipe) slotId: number,
        @Body(ValidationPipe) zones: UpsertSpaceSlotZoneDto[],
    ) {
        return this.editor.upsertZones(slotId, zones);
    }
}