import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    ParseIntPipe,
} from '@nestjs/common';
import { MusicService } from './music.service';
import { CreateMusicLibraryItemDto, UpdateMusicLibraryItemDto, AttachMusicToMomentDto } from './dto/music.dto';

@Controller('music')
export class MusicController {
    constructor(private readonly musicService: MusicService) { }

    // ==================== MUSIC LIBRARY ====================

    @Get('library')
    async getMusicLibrary(
        @Query('project_id') projectId?: string,
        @Query('brand_id') brandId?: string,
    ) {
        const projectIdNum = projectId ? parseInt(projectId) : undefined;
        const brandIdNum = brandId ? parseInt(brandId) : undefined;
        return this.musicService.getMusicLibrary(projectIdNum, brandIdNum);
    }

    @Get('library/:id')
    async getMusicLibraryItem(@Param('id', ParseIntPipe) id: number) {
        return this.musicService.getMusicLibraryItem(id);
    }

    @Post('library')
    async createMusicLibraryItem(@Body() createDto: CreateMusicLibraryItemDto) {
        return this.musicService.createMusicLibraryItem(createDto);
    }

    @Patch('library/:id')
    async updateMusicLibraryItem(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateDto: UpdateMusicLibraryItemDto,
    ) {
        return this.musicService.updateMusicLibraryItem(id, updateDto);
    }

    @Delete('library/:id')
    async deleteMusicLibraryItem(@Param('id', ParseIntPipe) id: number) {
        return this.musicService.deleteMusicLibraryItem(id);
    }

    // ==================== ATTACH/DETACH MUSIC TO MOMENTS ====================

    @Post('moments/:momentId/attach')
    async attachMusicToMoment(
        @Param('momentId', ParseIntPipe) momentId: number,
        @Body() attachDto: AttachMusicToMomentDto,
    ) {
        return this.musicService.attachMusicToMoment(momentId, attachDto.music_library_item_id);
    }

    @Post('moments/:momentId/detach')
    async detachMusicFromMoment(@Param('momentId', ParseIntPipe) momentId: number) {
        return this.musicService.detachMusicFromMoment(momentId);
    }
}
