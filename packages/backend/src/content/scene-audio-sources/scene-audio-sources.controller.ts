import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    ParseIntPipe,
    HttpCode,
    HttpStatus,
    UseGuards,
    ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SceneAudioSourcesService } from './scene-audio-sources.service';
import { CreateSceneAudioSourceDto } from './dto/create-scene-audio-source.dto';
import { UpdateSceneAudioSourceDto } from './dto/update-scene-audio-source.dto';

@Controller('api/scene-audio-sources')
@UseGuards(AuthGuard('jwt'))
export class SceneAudioSourcesController {
    constructor(private readonly audioSourcesService: SceneAudioSourcesService) {}

    @Post('scenes/:sceneId/audio-sources')
    create(
        @Param('sceneId', ParseIntPipe) sceneId: number,
        @Body(new ValidationPipe({ transform: true })) createDto: CreateSceneAudioSourceDto,
    ) {
        createDto.scene_id = sceneId;
        return this.audioSourcesService.create(createDto);
    }

    @Get('scenes/:sceneId/audio-sources')
    findAll(@Param('sceneId', ParseIntPipe) sceneId: number) {
        return this.audioSourcesService.findAll(sceneId);
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.audioSourcesService.findOne(id);
    }

    @Patch(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body(new ValidationPipe({ transform: true })) updateDto: UpdateSceneAudioSourceDto,
    ) {
        return this.audioSourcesService.update(id, updateDto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.audioSourcesService.remove(id);
    }

    @Post('scenes/:sceneId/audio-sources/reorder')
    reorder(
        @Param('sceneId', ParseIntPipe) sceneId: number,
        @Body(new ValidationPipe({ transform: true })) orderings: Array<{ id: number; order_index: number }>,
    ) {
        return this.audioSourcesService.reorder(sceneId, orderings);
    }
}
