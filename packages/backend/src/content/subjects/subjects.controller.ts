import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    ParseIntPipe
} from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { CreateSubjectDto, AssignSubjectToSceneDto, UpdateSceneSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';

@Controller('subjects')
export class SubjectsController {
    constructor(private readonly subjectsService: SubjectsService) { }

    // Subjects Library Management
    @Post()
    create(@Body() createSubjectDto: CreateSubjectDto) {
        return this.subjectsService.create(createSubjectDto);
    }

    @Get()
    findAll(@Query('brandId') brandId?: string) {
        const brandIdNum = brandId ? parseInt(brandId) : undefined;
        return this.subjectsService.findAll(brandIdNum);
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

    @Get(':id/stats')
    getStats(@Param('id', ParseIntPipe) id: number) {
        return this.subjectsService.getSubjectStats(id);
    }

    @Get(':id/scenes')
    getSubjectScenes(@Param('id', ParseIntPipe) id: number) {
        return this.subjectsService.getSubjectScenes(id);
    }

    // Scene-Subject Assignment Management
    @Post('scenes/:sceneId/assign')
    assignToScene(
        @Param('sceneId', ParseIntPipe) sceneId: number,
        @Body() assignDto: AssignSubjectToSceneDto
    ) {
        return this.subjectsService.assignToScene(sceneId, assignDto);
    }

    @Get('scenes/:sceneId')
    getSceneSubjects(@Param('sceneId', ParseIntPipe) sceneId: number) {
        return this.subjectsService.getSceneSubjects(sceneId);
    }

    @Patch('scenes/:sceneId/subjects/:subjectId')
    updateSceneSubject(
        @Param('sceneId', ParseIntPipe) sceneId: number,
        @Param('subjectId', ParseIntPipe) subjectId: number,
        @Body() updateDto: UpdateSceneSubjectDto
    ) {
        return this.subjectsService.updateSceneSubject(sceneId, subjectId, updateDto);
    }

    @Delete('scenes/:sceneId/subjects/:subjectId')
    removeFromScene(
        @Param('sceneId', ParseIntPipe) sceneId: number,
        @Param('subjectId', ParseIntPipe) subjectId: number
    ) {
        return this.subjectsService.removeFromScene(sceneId, subjectId);
    }
}
