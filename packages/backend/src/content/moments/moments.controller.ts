import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    ParseIntPipe,
    UseGuards,
    ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ShotType } from '@prisma/client';
import { MomentsCrudService } from './moments-crud.service';
import { MomentRecordingSetupService } from './moment-recording-setup.service';
import { CreateMomentDto } from './dto/create-moment.dto';
import { UpdateMomentDto } from './dto/update-moment.dto';

@Controller('api/moments')
@UseGuards(AuthGuard('jwt'))
export class MomentsController {
    constructor(
        private readonly crudService: MomentsCrudService,
        private readonly recordingService: MomentRecordingSetupService,
    ) { }

    // Scene-scoped moment management
    @Post('scenes/:sceneId/moments')
    create(
        @Param('sceneId', ParseIntPipe) sceneId: number,
        @Body(new ValidationPipe({ transform: true })) createMomentDto: CreateMomentDto
    ) {
        createMomentDto.film_scene_id = sceneId;
        return this.crudService.create(createMomentDto);
    }

    @Get('scenes/:sceneId/moments')
    findAll(@Param('sceneId', ParseIntPipe) sceneId: number) {
        return this.crudService.findAll(sceneId);
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.crudService.findOne(id);
    }

    @Get(':id/recording-setup')
    getRecordingSetup(@Param('id', ParseIntPipe) id: number) {
        return this.recordingService.getRecordingSetup(id);
    }

    @Patch(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body(new ValidationPipe({ transform: true })) updateMomentDto: UpdateMomentDto
    ) {
        return this.crudService.update(id, updateMomentDto);
    }

    @Patch(':id/recording-setup')
    upsertRecordingSetup(
        @Param('id', ParseIntPipe) id: number,
        @Body(new ValidationPipe({ transform: true })) data: {
            camera_track_ids?: number[];
            camera_assignments?: Array<{ track_id: number; subject_ids?: number[]; shot_type?: ShotType | null }>;
            audio_track_ids?: number[];
            graphics_enabled?: boolean;
            graphics_title?: string | null;
        }
    ) {
        return this.recordingService.upsertRecordingSetup(id, data);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.crudService.remove(id);
    }

    @Delete(':id/recording-setup')
    deleteRecordingSetup(@Param('id', ParseIntPipe) id: number) {
        return this.recordingService.deleteRecordingSetup(id);
    }

    // Utility endpoints
    @Post('scenes/:sceneId/reorder')
    reorderMoments(
        @Param('sceneId', ParseIntPipe) sceneId: number,
        @Body(new ValidationPipe({ transform: true })) momentOrderings: Array<{ id: number; order_index: number }>
    ) {
        return this.crudService.reorderMoments(sceneId, momentOrderings);
    }
}
