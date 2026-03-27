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
import { BeatsService } from './beats.service';
import { CreateBeatDto } from './dto/create-beat.dto';
import { UpdateBeatDto } from './dto/update-beat.dto';

@Controller('api/beats')
@UseGuards(AuthGuard('jwt'))
export class BeatsController {
    constructor(private readonly beatsService: BeatsService) {}

    @Post('scenes/:sceneId/beats')
    create(
        @Param('sceneId', ParseIntPipe) sceneId: number,
        @Body(new ValidationPipe({ transform: true })) createBeatDto: CreateBeatDto
    ) {
        createBeatDto.film_scene_id = sceneId;
        return this.beatsService.create(createBeatDto);
    }

    @Get('scenes/:sceneId/beats')
    findAll(@Param('sceneId', ParseIntPipe) sceneId: number) {
        return this.beatsService.findAll(sceneId);
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.beatsService.findOne(id);
    }

    @Get(':id/recording-setup')
    getRecordingSetup(@Param('id', ParseIntPipe) id: number) {
        return this.beatsService.getRecordingSetup(id);
    }

    @Patch(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body(new ValidationPipe({ transform: true })) updateBeatDto: UpdateBeatDto
    ) {
        return this.beatsService.update(id, updateBeatDto);
    }

    @Patch(':id/recording-setup')
    upsertRecordingSetup(
        @Param('id', ParseIntPipe) id: number,
        @Body(new ValidationPipe({ transform: true })) data: { camera_track_ids?: number[]; audio_track_ids?: number[]; graphics_enabled?: boolean }
    ) {
        return this.beatsService.upsertRecordingSetup(id, data);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.beatsService.remove(id);
    }

    @Delete(':id/recording-setup')
    deleteRecordingSetup(@Param('id', ParseIntPipe) id: number) {
        return this.beatsService.deleteRecordingSetup(id);
    }

    @Post('scenes/:sceneId/reorder')
    reorderBeats(
        @Param('sceneId', ParseIntPipe) sceneId: number,
        @Body(new ValidationPipe({ transform: true })) beatOrderings: Array<{ id: number; order_index: number }>
    ) {
        return this.beatsService.reorderBeats(sceneId, beatOrderings);
    }
}
