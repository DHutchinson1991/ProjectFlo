import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    ParseIntPipe,
    Query,
} from '@nestjs/common';
import { ScenesService } from './scenes.service';
import { CreateSceneDto } from './dto/create-scene.dto';
import { UpdateSceneDto } from './dto/update-scene.dto';

@Controller('scenes')
export class ScenesController {
    constructor(private readonly scenesService: ScenesService) { }

    // Film-scoped scene management
    @Post('films/:filmId/scenes')
    create(
        @Param('filmId', ParseIntPipe) filmId: number,
        @Body() createSceneDto: CreateSceneDto
    ) {
        // Override film_id from URL parameter
        createSceneDto.film_id = filmId;
        return this.scenesService.create(createSceneDto);
    }

    @Get('films/:filmId/scenes')
    findAll(@Param('filmId', ParseIntPipe) filmId: number) {
        return this.scenesService.findAll(filmId);
    }

    @Get('templates')
    getSceneTemplates(@Query('brandId') brandId?: string) {
        return this.scenesService.getSceneTemplates();
    }

    @Post('templates/from-scene')
    createTemplateFromScene(@Body() data: { scene_id: number; name?: string }) {
        return this.scenesService.createTemplateFromScene(data.scene_id, data.name);
    }

    @Delete('templates/:id')
    deleteSceneTemplate(@Param('id', ParseIntPipe) id: number) {
        return this.scenesService.deleteSceneTemplate(id);
    }

    @Get('template/:templateId/scenes')
    getScenesByTemplate(@Param('templateId', ParseIntPipe) templateId: number) {
        return this.scenesService.getScenesByTemplate(templateId);
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.scenesService.findOne(id);
    }

    @Get(':id/recording-setup')
    getRecordingSetup(@Param('id', ParseIntPipe) id: number) {
        return this.scenesService.getRecordingSetup(id);
    }

    @Patch(':id/recording-setup')
    upsertRecordingSetup(
        @Param('id', ParseIntPipe) id: number,
        @Body() data: { camera_track_ids?: number[]; audio_track_ids?: number[]; graphics_enabled?: boolean }
    ) {
        return this.scenesService.upsertRecordingSetup(id, data);
    }

    @Delete(':id/recording-setup')
    deleteRecordingSetup(@Param('id', ParseIntPipe) id: number) {
        return this.scenesService.deleteRecordingSetup(id);
    }

    @Patch(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateSceneDto: UpdateSceneDto
    ) {
        return this.scenesService.update(id, updateSceneDto);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.scenesService.remove(id);
    }

    // Utility endpoints
    @Post(':id/reorder')
    reorderScenes(
        @Param('id', ParseIntPipe) filmId: number,
        @Body() sceneOrderings: Array<{ id: number; order_index: number }>
    ) {
        return this.scenesService.reorderScenes(filmId, sceneOrderings);
    }
}
