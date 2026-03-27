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
import { SubjectsCrudService } from './subjects-crud.service';
import { SubjectSceneAssignmentsService } from './subject-scene-assignments.service';
import { SubjectMomentAssignmentsService } from './subject-moment-assignments.service';
import { SubjectRolesService } from './subject-roles.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { CreateSceneSubjectDto } from './dto/create-scene-subject.dto';
import { UpdateSceneSubjectDto } from './dto/update-scene-subject.dto';
import { CreateSubjectRolesDto } from './dto/create-subject-role.dto';
import { UpdateSubjectRoleDto } from './dto/update-subject-role.dto';
import { BrandId } from '../../platform/auth/decorators/brand-id.decorator';

@Controller('api/subjects')
@UseGuards(AuthGuard('jwt'))
export class SubjectsController {
    constructor(
        private readonly crudService: SubjectsCrudService,
        private readonly sceneAssignments: SubjectSceneAssignmentsService,
        private readonly momentAssignments: SubjectMomentAssignmentsService,
        private readonly rolesService: SubjectRolesService,
    ) { }

    // Film-scoped subject management
    @Post('films/:filmId/subjects')
    create(
        @Param('filmId', ParseIntPipe) filmId: number,
        @Body(ValidationPipe) createSubjectDto: CreateSubjectDto
    ) {
        createSubjectDto.film_id = filmId;
        return this.crudService.create(createSubjectDto);
    }

    @Get('films/:filmId/subjects')
    findAll(@Param('filmId', ParseIntPipe) filmId: number) {
        return this.crudService.findAll(filmId);
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.crudService.findOne(id);
    }

    @Patch(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body(ValidationPipe) updateSubjectDto: UpdateSubjectDto
    ) {
        return this.crudService.update(id, updateSubjectDto);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.crudService.remove(id);
    }

    @Get('templates/library')
    getSubjectTemplates(@BrandId() brandId?: number) {
        return this.crudService.getSubjectTemplates(brandId);
    }

    // Scene subject assignments
    @Get('scenes/:sceneId')
    getByScene(@Param('sceneId', ParseIntPipe) sceneId: number) {
        return this.sceneAssignments.getSceneSubjects(sceneId);
    }

    @Post('scenes/:sceneId/assign')
    assignToScene(
        @Param('sceneId', ParseIntPipe) sceneId: number,
        @Body(ValidationPipe) dto: CreateSceneSubjectDto,
    ) {
        return this.sceneAssignments.assignSubjectToScene(sceneId, dto);
    }

    @Patch('scenes/:sceneId/subjects/:subjectId')
    updateSceneAssignment(
        @Param('sceneId', ParseIntPipe) sceneId: number,
        @Param('subjectId', ParseIntPipe) subjectId: number,
        @Body(ValidationPipe) dto: UpdateSceneSubjectDto,
    ) {
        return this.sceneAssignments.updateSceneSubject(sceneId, subjectId, dto);
    }

    @Delete('scenes/:sceneId/subjects/:subjectId')
    removeFromScene(
        @Param('sceneId', ParseIntPipe) sceneId: number,
        @Param('subjectId', ParseIntPipe) subjectId: number,
    ) {
        return this.sceneAssignments.removeSubjectFromScene(sceneId, subjectId);
    }

    // Moment subject assignments
    @Get('moments/:momentId')
    getByMoment(@Param('momentId', ParseIntPipe) momentId: number) {
        return this.momentAssignments.getMomentSubjects(momentId);
    }

    @Post('moments/:momentId/assign')
    assignToMoment(
        @Param('momentId', ParseIntPipe) momentId: number,
        @Body(ValidationPipe) dto: CreateSceneSubjectDto,
    ) {
        return this.momentAssignments.assignSubjectToMoment(momentId, dto);
    }

    @Patch('moments/:momentId/subjects/:subjectId')
    updateMomentAssignment(
        @Param('momentId', ParseIntPipe) momentId: number,
        @Param('subjectId', ParseIntPipe) subjectId: number,
        @Body(ValidationPipe) dto: UpdateSceneSubjectDto,
    ) {
        return this.momentAssignments.updateMomentSubject(momentId, subjectId, dto);
    }

    @Delete('moments/:momentId/subjects/:subjectId')
    removeFromMoment(
        @Param('momentId', ParseIntPipe) momentId: number,
        @Param('subjectId', ParseIntPipe) subjectId: number,
    ) {
        return this.momentAssignments.removeSubjectFromMoment(momentId, subjectId);
    }

    // ===== Subject Role Management (Brand-specific) =====

    @Get('roles/brand/:brandId')
    getSubjectRoles(
        @Param('brandId', ParseIntPipe) brandId: number,
    ) {
        return this.rolesService.getSubjectRoles(brandId);
    }

    @Post('roles/brand/:brandId')
    createSubjectRoles(
        @Param('brandId', ParseIntPipe) brandId: number,
        @Body(ValidationPipe) dto: CreateSubjectRolesDto,
    ) {
        return this.rolesService.createSubjectRoles(brandId, dto);
    }

    @Patch('roles/:roleId')
    updateSubjectRole(
        @Param('roleId', ParseIntPipe) roleId: number,
        @Body(ValidationPipe) dto: UpdateSubjectRoleDto,
    ) {
        return this.rolesService.updateSubjectRole(roleId, dto);
    }

    @Delete('roles/:roleId')
    deleteSubjectRole(
        @Param('roleId', ParseIntPipe) roleId: number,
    ) {
        return this.rolesService.deleteSubjectRole(roleId);
    }
}
