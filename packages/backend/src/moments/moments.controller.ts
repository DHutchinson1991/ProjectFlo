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
import { MomentsService } from './moments.service';
import {
    CreateMomentTemplateDto,
    UpdateMomentTemplateDto,
    CreateSceneMomentBodyDto,
    UpdateSceneMomentDto,
    ReorderMomentsDto,
    CreateSceneMomentMusicDto,
    UpdateSceneMomentMusicDto,
} from './dto/moments.dto';

@Controller('moments')
export class MomentsController {
    constructor(private readonly momentsService: MomentsService) { }

    // ==================== MOMENT TEMPLATES ====================

    @Get('templates')
    async getAllMomentTemplates() {
        return this.momentsService.getAllMomentTemplates();
    }

    @Post('templates')
    async createMomentTemplate(@Body() createDto: CreateMomentTemplateDto) {
        return this.momentsService.createMomentTemplate(createDto);
    }

    @Patch('templates/:id')
    async updateMomentTemplate(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateDto: UpdateMomentTemplateDto,
    ) {
        return this.momentsService.updateMomentTemplate(id, updateDto);
    }

    @Delete('templates/:id')
    async deleteMomentTemplate(@Param('id', ParseIntPipe) id: number) {
        return this.momentsService.deleteMomentTemplate(id);
    }

    // ==================== SCENE MOMENTS ====================

    @Get('scenes/:sceneId')
    async getSceneMoments(
        @Param('sceneId', ParseIntPipe) sceneId: number,
        @Query('project_id') projectId?: string,
    ) {
        const parsedProjectId = projectId ? parseInt(projectId) : undefined;
        return this.momentsService.getSceneMoments(sceneId, parsedProjectId);
    }

    @Post('scenes/:sceneId')
    async createSceneMoment(
        @Param('sceneId', ParseIntPipe) sceneId: number,
        @Body() createDto: CreateSceneMomentBodyDto,
    ) {
        // Ensure the scene_id matches the URL parameter
        const data = { ...createDto, scene_id: sceneId };
        return this.momentsService.createSceneMoment(data);
    }

    @Post('scenes/:sceneId/from-template')
    async createMomentsFromTemplate(
        @Param('sceneId', ParseIntPipe) sceneId: number,
        @Body() body: { scene_type: string; project_id?: number },
    ) {
        return this.momentsService.createMomentsFromTemplate(
            sceneId,
            body.scene_type,
            body.project_id,
        );
    }

    @Patch('scenes/:sceneId/normalize-coverage')
    async normalizeSceneCoverage(@Param('sceneId', ParseIntPipe) sceneId: number) {
        return this.momentsService.normalizeSceneCoverage(sceneId);
    }

    @Patch('scenes/:sceneId/update-assignments')
    async updateSceneCoverageAssignments(@Param('sceneId', ParseIntPipe) sceneId: number) {
        return this.momentsService.updateSceneCoverageAssignments(sceneId);
    }

    @Patch('scenes/:sceneId/:momentId')
    async updateSceneMoment(
        @Param('sceneId', ParseIntPipe) sceneId: number,
        @Param('momentId', ParseIntPipe) momentId: number,
        @Body() updateDto: UpdateSceneMomentDto,
    ) {
        return this.momentsService.updateSceneMoment(momentId, updateDto);
    }

    @Post('scenes/:sceneId/reorder')
    async reorderSceneMoments(
        @Param('sceneId', ParseIntPipe) sceneId: number,
        @Body() reorderDto: ReorderMomentsDto,
    ) {
        console.log('🔄 Reorder request received:', { sceneId, reorderDto });
        try {
            const result = await this.momentsService.reorderSceneMoments(sceneId, reorderDto);
            console.log('✅ Reorder successful, returning:', result?.length, 'moments');
            return result;
        } catch (error) {
            console.error('❌ Reorder failed:', error);
            throw error;
        }
    }

    @Delete('scenes/:sceneId/:momentId')
    async deleteSceneMoment(
        @Param('sceneId', ParseIntPipe) sceneId: number,
        @Param('momentId', ParseIntPipe) momentId: number,
    ) {
        return this.momentsService.deleteSceneMoment(momentId);
    }

    // ==================== MOMENT COVERAGE ASSIGNMENTS ====================

    @Post(':momentId/coverage/:coverageId')
    async assignCoverageToMoment(
        @Param('momentId', ParseIntPipe) momentId: number,
        @Param('coverageId', ParseIntPipe) coverageId: number,
    ) {
        return this.momentsService.assignCoverageToMoment(momentId, coverageId);
    }

    @Delete(':momentId/coverage/:coverageId')
    async removeCoverageFromMoment(
        @Param('momentId', ParseIntPipe) momentId: number,
        @Param('coverageId', ParseIntPipe) coverageId: number,
    ) {
        return this.momentsService.removeCoverageFromMoment(momentId, coverageId);
    }

    // ==================== MOMENT MUSIC ====================

    @Get(':momentId/music')
    async getSceneMomentMusic(@Param('momentId', ParseIntPipe) momentId: number) {
        return this.momentsService.getSceneMomentMusic(momentId);
    }

    @Post(':momentId/music')
    async createSceneMomentMusic(
        @Param('momentId', ParseIntPipe) momentId: number,
        @Body() createDto: CreateSceneMomentMusicDto,
    ) {
        // Override moment_id from URL param
        return this.momentsService.createSceneMomentMusic({
            ...createDto,
            moment_id: momentId,
        });
    }

    @Patch(':momentId/music')
    async updateSceneMomentMusic(
        @Param('momentId', ParseIntPipe) momentId: number,
        @Body() updateDto: UpdateSceneMomentMusicDto,
    ) {
        return this.momentsService.updateSceneMomentMusic(momentId, updateDto);
    }

    @Delete(':momentId/music')
    async deleteSceneMomentMusic(@Param('momentId', ParseIntPipe) momentId: number) {
        return this.momentsService.deleteSceneMomentMusic(momentId);
    }
}
