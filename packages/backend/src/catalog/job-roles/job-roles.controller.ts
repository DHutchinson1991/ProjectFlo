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
import { AssignJobRoleDto, UpdateJobRoleAssignmentDto } from './dto/contributor-job-role.dto';

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

    @Get('contributor/:contributorId/assignments')
    async getContributorJobRoles(@Param('contributorId', ParseIntPipe) contributorId: number) {
        return this.assignmentsService.getContributorJobRoles(contributorId);
    }

    @Post('assignments')
    async assignJobRole(@Body(new ValidationPipe({ transform: true })) assignJobRoleDto: AssignJobRoleDto) {
        return this.assignmentsService.assignJobRole(assignJobRoleDto);
    }

    @Put('contributor/:contributorId/job-role/:jobRoleId')
    async updateJobRoleAssignment(
        @Param('contributorId', ParseIntPipe) contributorId: number,
        @Param('jobRoleId', ParseIntPipe) jobRoleId: number,
        @Body(new ValidationPipe({ transform: true })) updateDto: UpdateJobRoleAssignmentDto,
    ) {
        return this.assignmentsService.updateJobRoleAssignment(contributorId, jobRoleId, updateDto);
    }

    @Delete('contributor/:contributorId/job-role/:jobRoleId')
    @HttpCode(HttpStatus.NO_CONTENT)
    async removeJobRoleAssignment(
        @Param('contributorId', ParseIntPipe) contributorId: number,
        @Param('jobRoleId', ParseIntPipe) jobRoleId: number,
    ) {
        await this.assignmentsService.removeJobRoleAssignment(contributorId, jobRoleId);
    }

    @Get(':jobRoleId/contributors')
    async getContributorsByJobRole(@Param('jobRoleId', ParseIntPipe) jobRoleId: number) {
        return this.assignmentsService.getContributorsByJobRole(jobRoleId);
    }
}
