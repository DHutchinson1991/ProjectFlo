import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    ParseIntPipe
} from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { AssignSubjectToSceneDto } from './dto/assign-subject-to-scene.dto';
import { UpdateSceneSubjectDto } from './dto/update-scene-subject.dto';

@Controller('subjects')
export class SubjectsController {
    constructor(private readonly subjectsService: SubjectsService) { }

    // Film-scoped subject management
    @Post('films/:filmId/subjects')
    create(
        @Param('filmId', ParseIntPipe) filmId: number,
        @Body() createSubjectDto: CreateSubjectDto
    ) {
        // Override film_id from URL parameter
        createSubjectDto.film_id = filmId;
        return this.subjectsService.create(createSubjectDto);
    }

    @Get('films/:filmId/subjects')
    findAll(@Param('filmId', ParseIntPipe) filmId: number) {
        return this.subjectsService.findAll(filmId);
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.subjectsService.findOne(id);
    }

    @Patch(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateSubjectDto: UpdateSubjectDto
    ) {
        return this.subjectsService.update(id, updateSubjectDto);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.subjectsService.remove(id);
    }

    // Utility endpoints
    @Get('templates/library')
    getSubjectTemplates() {
        return this.subjectsService.getSubjectTemplates();
    }

    // Scene subject assignments
    @Get('scenes/:sceneId')
    getByScene(@Param('sceneId', ParseIntPipe) sceneId: number) {
        return this.subjectsService.getSceneSubjects(sceneId);
    }

    @Post('scenes/:sceneId/assign')
    assignToScene(
        @Param('sceneId', ParseIntPipe) sceneId: number,
        @Body() dto: AssignSubjectToSceneDto,
    ) {
        return this.subjectsService.assignSubjectToScene(sceneId, dto);
    }

    @Patch('scenes/:sceneId/subjects/:subjectId')
    updateSceneAssignment(
        @Param('sceneId', ParseIntPipe) sceneId: number,
        @Param('subjectId', ParseIntPipe) subjectId: number,
        @Body() dto: UpdateSceneSubjectDto,
    ) {
        return this.subjectsService.updateSceneSubject(sceneId, subjectId, dto);
    }

    @Delete('scenes/:sceneId/subjects/:subjectId')
    removeFromScene(
        @Param('sceneId', ParseIntPipe) sceneId: number,
        @Param('subjectId', ParseIntPipe) subjectId: number,
    ) {
        return this.subjectsService.removeSubjectFromScene(sceneId, subjectId);
    }

    // Moment subject assignments
    @Get('moments/:momentId')
    getByMoment(@Param('momentId', ParseIntPipe) momentId: number) {
        return this.subjectsService.getMomentSubjects(momentId);
    }

    @Post('moments/:momentId/assign')
    assignToMoment(
        @Param('momentId', ParseIntPipe) momentId: number,
        @Body() dto: AssignSubjectToSceneDto,
    ) {
        return this.subjectsService.assignSubjectToMoment(momentId, dto);
    }

    @Patch('moments/:momentId/subjects/:subjectId')
    updateMomentAssignment(
        @Param('momentId', ParseIntPipe) momentId: number,
        @Param('subjectId', ParseIntPipe) subjectId: number,
        @Body() dto: UpdateSceneSubjectDto,
    ) {
        return this.subjectsService.updateMomentSubject(momentId, subjectId, dto);
    }

    @Delete('moments/:momentId/subjects/:subjectId')
    removeFromMoment(
        @Param('momentId', ParseIntPipe) momentId: number,
        @Param('subjectId', ParseIntPipe) subjectId: number,
    ) {
        return this.subjectsService.removeSubjectFromMoment(momentId, subjectId);
    }

    // ===== Subject Type Template Management =====

    @Get('type-templates/brand/:brandId')
    getTypeTemplates(
        @Param('brandId', ParseIntPipe) brandId: number,
    ) {
        return this.subjectsService.getSubjectTypeTemplates(brandId);
    }

    @Post('type-templates/brand/:brandId')
    createTypeTemplate(
        @Param('brandId', ParseIntPipe) brandId: number,
        @Body() dto: any,
    ) {
        return this.subjectsService.createSubjectTypeTemplate(brandId, dto);
    }

    @Patch('type-templates/:templateId')
    updateTypeTemplate(
        @Param('templateId', ParseIntPipe) templateId: number,
        @Body() dto: any,
    ) {
        return this.subjectsService.updateSubjectTypeTemplate(templateId, dto);
    }

    @Delete('type-templates/:templateId')
    deleteTypeTemplate(
        @Param('templateId', ParseIntPipe) templateId: number,
    ) {
        return this.subjectsService.deleteSubjectTypeTemplate(templateId);
    }

    @Post('type-templates/:templateId/roles')
    addRoleToTemplate(
        @Param('templateId', ParseIntPipe) templateId: number,
        @Body() roleDto: any,
    ) {
        return this.subjectsService.addRoleToTemplate(templateId, roleDto);
    }

    @Delete('type-templates/roles/:roleId')
    removeRoleFromTemplate(
        @Param('roleId', ParseIntPipe) roleId: number,
    ) {
        return this.subjectsService.removeRoleFromTemplate(roleId);
    }
}
