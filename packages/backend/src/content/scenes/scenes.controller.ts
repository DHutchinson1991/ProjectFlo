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
import { ScenesCrudService } from './services/scenes-crud.service';
import { ScenesRecordingService } from './services/scenes-recording.service';
import { SceneTemplatesService } from './services/scene-templates.service';
import { CreateSceneDto } from './dto/create-scene.dto';
import { UpdateSceneDto } from './dto/update-scene.dto';
import { BrandId } from '../../platform/auth/decorators/brand-id.decorator';

@Controller('api/scenes')
@UseGuards(AuthGuard('jwt'))
export class ScenesController {
    constructor(
        private readonly crudService: ScenesCrudService,
        private readonly recordingService: ScenesRecordingService,
        private readonly templatesService: SceneTemplatesService,
    ) { }

    // Film-scoped scene management
    @Post('films/:filmId/scenes')
    create(
        @Param('filmId', ParseIntPipe) filmId: number,
        @Body(new ValidationPipe({ transform: true })) createSceneDto: CreateSceneDto
    ) {
        // Override film_id from URL parameter
        createSceneDto.film_id = filmId;
        return this.crudService.create(createSceneDto);
    }

    @Get('films/:filmId/scenes')
    findAll(@Param('filmId', ParseIntPipe) filmId: number) {
        return this.crudService.findAll(filmId);
    }

    @Get('templates')
    getSceneTemplates(@BrandId() brandId?: number) {
        return this.templatesService.getSceneTemplates(brandId);
    }

    @Post('templates/from-scene')
    createTemplateFromScene(@Body(new ValidationPipe({ transform: true })) data: { scene_id: number; name?: string }) {
        return this.templatesService.createTemplateFromScene(data.scene_id, data.name);
    }

    @Delete('templates/:id')
    deleteSceneTemplate(@Param('id', ParseIntPipe) id: number) {
        return this.templatesService.deleteSceneTemplate(id);
    }

    @Get('template/:templateId/scenes')
    getScenesByTemplate(@Param('templateId', ParseIntPipe) templateId: number) {
        return this.templatesService.getScenesByTemplate(templateId);
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.crudService.findOne(id);
    }

    @Get(':id/recording-setup')
    getRecordingSetup(@Param('id', ParseIntPipe) id: number) {
        return this.recordingService.getRecordingSetup(id);
    }

    @Patch(':id/recording-setup')
    upsertRecordingSetup(
        @Param('id', ParseIntPipe) id: number,
        @Body(new ValidationPipe({ transform: true })) data: { camera_track_ids?: number[]; audio_track_ids?: number[]; graphics_enabled?: boolean }
    ) {
        return this.recordingService.upsertRecordingSetup(id, data);
    }

    @Delete(':id/recording-setup')
    deleteRecordingSetup(@Param('id', ParseIntPipe) id: number) {
        return this.recordingService.deleteRecordingSetup(id);
    }

    @Patch(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body(new ValidationPipe({ transform: true })) updateSceneDto: UpdateSceneDto
    ) {
        return this.crudService.update(id, updateSceneDto);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.crudService.remove(id);
    }

    // Utility endpoints
    @Post(':id/reorder')
    reorderScenes(
        @Param('id', ParseIntPipe) filmId: number,
        @Body(new ValidationPipe({ transform: true })) sceneOrderings: Array<{ id: number; order_index: number }>
    ) {
        return this.crudService.reorderScenes(filmId, sceneOrderings);
    }
}
