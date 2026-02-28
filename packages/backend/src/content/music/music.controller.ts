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
import { MusicService } from './music.service';
import { CreateSceneMusicDto, CreateMomentMusicDto } from './dto/create-music.dto';
import { UpdateSceneMusicDto, UpdateMomentMusicDto } from './dto/update-music.dto';

@Controller('music')
export class MusicController {
    constructor(private readonly musicService: MusicService) { }

    // Scene Music Endpoints
    @Post('scenes/:sceneId/music')
    createSceneMusic(
        @Param('sceneId', ParseIntPipe) sceneId: number,
        @Body() createDto: CreateSceneMusicDto
    ) {
        createDto.film_scene_id = sceneId;
        return this.musicService.createSceneMusic(createDto);
    }

    @Get('scenes/:sceneId/music')
    getSceneMusic(@Param('sceneId', ParseIntPipe) sceneId: number) {
        return this.musicService.getSceneMusic(sceneId);
    }

    @Patch('scenes/:sceneId/music')
    updateSceneMusic(
        @Param('sceneId', ParseIntPipe) sceneId: number,
        @Body() updateDto: UpdateSceneMusicDto
    ) {
        return this.musicService.updateSceneMusic(sceneId, updateDto);
    }

    @Delete('scenes/:sceneId/music')
    removeSceneMusic(@Param('sceneId', ParseIntPipe) sceneId: number) {
        return this.musicService.removeSceneMusic(sceneId);
    }

    // Moment Music Endpoints
    @Post('moments/:momentId/music')
    createMomentMusic(
        @Param('momentId', ParseIntPipe) momentId: number,
        @Body() createDto: CreateMomentMusicDto
    ) {
        createDto.moment_id = momentId;
        return this.musicService.createMomentMusic(createDto);
    }

    @Get('moments/:momentId/music')
    getMomentMusic(@Param('momentId', ParseIntPipe) momentId: number) {
        return this.musicService.getMomentMusic(momentId);
    }

    @Patch('moments/:momentId/music')
    updateMomentMusic(
        @Param('momentId', ParseIntPipe) momentId: number,
        @Body() updateDto: UpdateMomentMusicDto
    ) {
        return this.musicService.updateMomentMusic(momentId, updateDto);
    }

    @Delete('moments/:momentId/music')
    removeMomentMusic(@Param('momentId', ParseIntPipe) momentId: number) {
        return this.musicService.removeMomentMusic(momentId);
    }

    // Utility Endpoints
    @Get('types')
    getMusicTypes() {
        return this.musicService.getMusicTypes();
    }

    @Get('films/:filmId/music')
    getFilmMusic(@Param('filmId', ParseIntPipe) filmId: number) {
        return this.musicService.getFilmMusic(filmId);
    }
}
