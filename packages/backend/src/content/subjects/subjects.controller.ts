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
import { CreateSceneSubjectDto } from './dto/create-scene-subject.dto';
import { UpdateSceneSubjectDto } from './dto/update-scene-subject.dto';
import { CreateSubjectRolesDto } from './dto/create-subject-role.dto';
import { UpdateSubjectRoleDto } from './dto/update-subject-role.dto';
import { BrandId } from '../../core/auth/decorators/brand-id.decorator';

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
    getSubjectTemplates(@BrandId() brandId?: number) {
        return this.subjectsService.getSubjectTemplates(brandId);
    }

    // Scene subject assignments
    @Get('scenes/:sceneId')
    getByScene(@Param('sceneId', ParseIntPipe) sceneId: number) {
        return this.subjectsService.getSceneSubjects(sceneId);
    }

    @Post('scenes/:sceneId/assign')
    assignToScene(
        @Param('sceneId', ParseIntPipe) sceneId: number,
        @Body() dto: CreateSceneSubjectDto,
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
        @Body() dto: CreateSceneSubjectDto,
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

    // ===== Subject Role Management (Brand-specific) =====

    @Get('roles/brand/:brandId')
    getSubjectRoles(
        @Param('brandId', ParseIntPipe) brandId: number,
    ) {
        return this.subjectsService.getSubjectRoles(brandId);
    }

    @Post('roles/brand/:brandId')
    createSubjectRoles(
        @Param('brandId', ParseIntPipe) brandId: number,
        @Body() dto: CreateSubjectRolesDto,
    ) {
        return this.subjectsService.createSubjectRoles(brandId, dto);
    }

    @Patch('roles/:roleId')
    updateSubjectRole(
        @Param('roleId', ParseIntPipe) roleId: number,
        @Body() dto: UpdateSubjectRoleDto,
    ) {
        return this.subjectsService.updateSubjectRole(roleId, dto);
    }

    @Delete('roles/:roleId')
    deleteSubjectRole(
        @Param('roleId', ParseIntPipe) roleId: number,
    ) {
        return this.subjectsService.deleteSubjectRole(roleId);
    }
}
