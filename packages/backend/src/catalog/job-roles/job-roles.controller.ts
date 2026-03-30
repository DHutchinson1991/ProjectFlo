import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    ParseIntPipe,
    HttpStatus,
    HttpCode,
    UseGuards,
    ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JobRolesService } from './job-roles.service';
import { JobRoleAssignmentsService } from './services/job-role-assignments.service';
import { CreateJobRoleDto, UpdateJobRoleDto } from './dto/job-role.dto';
import { AssignJobRoleDto, UpdateJobRoleAssignmentDto } from './dto/crew-job-role.dto';

@Controller('api/job-roles')
@UseGuards(AuthGuard('jwt'))
export class JobRolesController {
    constructor(
        private readonly jobRolesService: JobRolesService,
        private readonly assignmentsService: JobRoleAssignmentsService,
    ) {}

    @Get()
    async getAllJobRoles() {
        return this.jobRolesService.findAllJobRoles();
    }

    @Get('by-category')
    async getJobRolesByCategory() {
        return this.jobRolesService.getJobRolesByCategory();
    }

    @Get(':id')
    async getJobRole(@Param('id', ParseIntPipe) id: number) {
        return this.jobRolesService.findJobRoleById(id);
    }

    @Post()
    async createJobRole(@Body(new ValidationPipe({ transform: true })) createJobRoleDto: CreateJobRoleDto) {
        return this.jobRolesService.createJobRole(createJobRoleDto);
    }

    @Put(':id')
    async updateJobRole(
        @Param('id', ParseIntPipe) id: number,
        @Body(new ValidationPipe({ transform: true })) updateJobRoleDto: UpdateJobRoleDto,
    ) {
        return this.jobRolesService.updateJobRole(id, updateJobRoleDto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteJobRole(@Param('id', ParseIntPipe) id: number) {
        await this.jobRolesService.deleteJobRole(id);
    }

    @Get('crew/:crewId/assignments')
    async getCrewJobRoles(@Param('crewId', ParseIntPipe) crewId: number) {
        return this.assignmentsService.getCrewJobRoles(crewId);
    }

    @Post('assignments')
    async assignJobRole(@Body(new ValidationPipe({ transform: true })) assignJobRoleDto: AssignJobRoleDto) {
        return this.assignmentsService.assignJobRole(assignJobRoleDto);
    }

    @Put('crew/:crewId/job-role/:jobRoleId')
    async updateCrewJobRoleAssignment(
        @Param('crewId', ParseIntPipe) crewId: number,
        @Param('jobRoleId', ParseIntPipe) jobRoleId: number,
        @Body(new ValidationPipe({ transform: true })) updateDto: UpdateJobRoleAssignmentDto,
    ) {
        return this.assignmentsService.updateJobRoleAssignment(crewId, jobRoleId, updateDto);
    }

    @Delete('crew/:crewId/job-role/:jobRoleId')
    @HttpCode(HttpStatus.NO_CONTENT)
    async removeCrewJobRoleAssignment(
        @Param('crewId', ParseIntPipe) crewId: number,
        @Param('jobRoleId', ParseIntPipe) jobRoleId: number,
    ) {
        await this.assignmentsService.removeJobRoleAssignment(crewId, jobRoleId);
    }

    @Get(':jobRoleId/crew')
    async getCrewByJobRole(@Param('jobRoleId', ParseIntPipe) jobRoleId: number) {
        return this.assignmentsService.getCrewByJobRole(jobRoleId);
    }
}
