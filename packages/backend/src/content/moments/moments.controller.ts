import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    ParseIntPipe,
} from '@nestjs/common';
import { ShotType } from '@prisma/client';
import { MomentsService } from './moments.service';
import { CreateMomentDto } from './dto/create-moment.dto';
import { UpdateMomentDto } from './dto/update-moment.dto';

@Controller('moments')
export class MomentsController {
    constructor(private readonly momentsService: MomentsService) { }

    // Scene-scoped moment management
    @Post('scenes/:sceneId/moments')
    create(
        @Param('sceneId', ParseIntPipe) sceneId: number,
        @Body() createMomentDto: CreateMomentDto
    ) {
        // Override scene_id from URL parameter
        createMomentDto.film_scene_id = sceneId;
        return this.momentsService.create(createMomentDto);
    }

    @Get('scenes/:sceneId/moments')
    findAll(@Param('sceneId', ParseIntPipe) sceneId: number) {
        return this.momentsService.findAll(sceneId);
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.momentsService.findOne(id);
    }

    @Get(':id/recording-setup')
    getRecordingSetup(@Param('id', ParseIntPipe) id: number) {
        return this.momentsService.getRecordingSetup(id);
    }

    @Patch(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateMomentDto: UpdateMomentDto
    ) {
        return this.momentsService.update(id, updateMomentDto);
    }

    @Patch(':id/recording-setup')
    upsertRecordingSetup(
        @Param('id', ParseIntPipe) id: number,
        @Body() data: {
            camera_track_ids?: number[];
            camera_assignments?: Array<{ track_id: number; subject_ids?: number[]; shot_type?: ShotType | null }>;
            audio_track_ids?: number[];
            graphics_enabled?: boolean;
            graphics_title?: string | null;
        }
    ) {
        return this.momentsService.upsertRecordingSetup(id, data);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.momentsService.remove(id);
    }

    @Delete(':id/recording-setup')
    deleteRecordingSetup(@Param('id', ParseIntPipe) id: number) {
        return this.momentsService.deleteRecordingSetup(id);
    }

    // Utility endpoints
    @Post('scenes/:sceneId/reorder')
    reorderMoments(
        @Param('sceneId', ParseIntPipe) sceneId: number,
        @Body() momentOrderings: Array<{ id: number; order_index: number }>
    ) {
        return this.momentsService.reorderMoments(sceneId, momentOrderings);
    }
}
