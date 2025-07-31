import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    ParseIntPipe,
    UseGuards,
    Headers,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProjectsService } from './projects.service';
import { CreateProjectDto, UpdateProjectDto } from './dto/projects.dto';

@Controller('projects')
@UseGuards(AuthGuard('jwt'))
export class ProjectsController {
    constructor(private readonly projectsService: ProjectsService) { }

    @Get()
    async getAllProjects(@Headers('x-brand-context') brandId?: string) {
        const parsedBrandId = brandId ? parseInt(brandId) : undefined;
        return this.projectsService.getAllProjects(parsedBrandId);
    }

    @Get(':id')
    async getProjectById(@Param('id', ParseIntPipe) id: number) {
        return this.projectsService.getProjectById(id);
    }

    @Post()
    async createProject(
        @Body() createProjectDto: CreateProjectDto,
        @Headers('x-brand-context') brandId?: string,
    ) {
        const parsedBrandId = brandId ? parseInt(brandId) : undefined;
        return this.projectsService.createProject(createProjectDto, parsedBrandId);
    }

    @Put(':id')
    async updateProject(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateProjectDto: UpdateProjectDto,
    ) {
        return this.projectsService.updateProject(id, updateProjectDto);
    }

    @Delete(':id')
    async deleteProject(@Param('id', ParseIntPipe) id: number) {
        return this.projectsService.deleteProject(id);
    }
}
