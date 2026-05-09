import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Delete,
    Put,
    ParseIntPipe,
    ValidationPipe,
    UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SceneSpatialService } from '../services/scene-spatial.service';
import {
    UpsertCameraPositionDto,
    UpsertSubjectPositionDto,
    AddSceneSpaceDto,
    UpsertMomentCameraPositionDto,
    UpsertMomentSubjectPositionDto,
} from '../dto/scene-spatial.dto';

@Controller('api/films/scenes/:sceneId/spatial')
@UseGuards(AuthGuard('jwt'))
export class SceneSpatialController {
    constructor(private readonly sceneSpatialService: SceneSpatialService) {}

    // ── Full layout ───────────────────────────────────────────

    @Get()
    getLayout(@Param('sceneId', ParseIntPipe) sceneId: number) {
        return this.sceneSpatialService.getSceneSpatialLayout(sceneId);
    }

    // ── Scene spaces ──────────────────────────────────────────

    @Get('spaces')
    getSpaces(@Param('sceneId', ParseIntPipe) sceneId: number) {
        return this.sceneSpatialService.getSceneSpaces(sceneId);
    }

    @Post('spaces')
    addSpace(
        @Param('sceneId', ParseIntPipe) sceneId: number,
        @Body(ValidationPipe) dto: AddSceneSpaceDto,
    ) {
        return this.sceneSpatialService.addSceneSpace(sceneId, dto);
    }

    @Delete('spaces/:spaceId')
    removeSpace(
        @Param('sceneId', ParseIntPipe) sceneId: number,
        @Param('spaceId', ParseIntPipe) spaceId: number,
    ) {
        return this.sceneSpatialService.removeSceneSpace(sceneId, spaceId);
    }

    // ── Camera positions ──────────────────────────────────────

    @Get('cameras')
    getCameras(@Param('sceneId', ParseIntPipe) sceneId: number) {
        return this.sceneSpatialService.getCameraPositions(sceneId);
    }

    @Put('cameras')
    upsertCamera(
        @Param('sceneId', ParseIntPipe) sceneId: number,
        @Body(ValidationPipe) dto: UpsertCameraPositionDto,
    ) {
        return this.sceneSpatialService.upsertCameraPosition(sceneId, dto);
    }

    @Delete('cameras/:trackId')
    removeCamera(
        @Param('sceneId', ParseIntPipe) sceneId: number,
        @Param('trackId', ParseIntPipe) trackId: number,
    ) {
        return this.sceneSpatialService.removeCameraPosition(sceneId, trackId);
    }

    // ── Subject positions ─────────────────────────────────────

    @Get('subjects')
    getSubjects(@Param('sceneId', ParseIntPipe) sceneId: number) {
        return this.sceneSpatialService.getSubjectPositions(sceneId);
    }

    @Put('subjects')
    upsertSubject(
        @Param('sceneId', ParseIntPipe) sceneId: number,
        @Body(ValidationPipe) dto: UpsertSubjectPositionDto,
    ) {
        return this.sceneSpatialService.upsertSubjectPosition(sceneId, dto);
    }

    @Delete('subjects/:subjectId')
    removeSubject(
        @Param('sceneId', ParseIntPipe) sceneId: number,
        @Param('subjectId', ParseIntPipe) subjectId: number,
    ) {
        return this.sceneSpatialService.removeSubjectPosition(sceneId, subjectId);
    }

    // ── Moment-level position overrides (keyframes) ───────────

    @Get('moments/:momentId')
    getMomentSpatialLayout(@Param('momentId', ParseIntPipe) momentId: number) {
        return this.sceneSpatialService.getMomentSpatialLayout(momentId);
    }

    @Get('moments/:momentId/cameras')
    getMomentCameras(@Param('momentId', ParseIntPipe) momentId: number) {
        return this.sceneSpatialService.getMomentCameraPositions(momentId);
    }

    @Put('moments/:momentId/cameras')
    upsertMomentCamera(
        @Param('momentId', ParseIntPipe) momentId: number,
        @Body(ValidationPipe) dto: UpsertMomentCameraPositionDto,
    ) {
        return this.sceneSpatialService.upsertMomentCameraPosition(momentId, dto);
    }

    @Delete('moments/:momentId/cameras/:trackId')
    removeMomentCamera(
        @Param('momentId', ParseIntPipe) momentId: number,
        @Param('trackId', ParseIntPipe) trackId: number,
    ) {
        return this.sceneSpatialService.removeMomentCameraPosition(momentId, trackId);
    }

    @Get('moments/:momentId/subjects')
    getMomentSubjects(@Param('momentId', ParseIntPipe) momentId: number) {
        return this.sceneSpatialService.getMomentSubjectPositions(momentId);
    }

    @Put('moments/:momentId/subjects')
    upsertMomentSubject(
        @Param('momentId', ParseIntPipe) momentId: number,
        @Body(ValidationPipe) dto: UpsertMomentSubjectPositionDto,
    ) {
        return this.sceneSpatialService.upsertMomentSubjectPosition(momentId, dto);
    }

    @Delete('moments/:momentId/subjects/:subjectId')
    removeMomentSubject(
        @Param('momentId', ParseIntPipe) momentId: number,
        @Param('subjectId', ParseIntPipe) subjectId: number,
    ) {
        return this.sceneSpatialService.removeMomentSubjectPosition(momentId, subjectId);
    }
}
