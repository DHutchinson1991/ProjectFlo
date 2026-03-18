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
    HttpCode
} from '@nestjs/common';
import { JobRolesService } from './job-roles.service';
import { CreateJobRoleDto, UpdateJobRoleDto } from './dto/job-role.dto';
import { AssignJobRoleDto, UpdateJobRoleAssignmentDto } from './dto/contributor-job-role.dto';

@Controller('job-roles')
export class JobRolesController {
    constructor(private readonly jobRolesService: JobRolesService) { }

    // Job Roles Management
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
    async createJobRole(@Body() createJobRoleDto: CreateJobRoleDto) {
        return this.jobRolesService.createJobRole(createJobRoleDto);
    }

    @Put(':id')
    async updateJobRole(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateJobRoleDto: UpdateJobRoleDto
    ) {
        return this.jobRolesService.updateJobRole(id, updateJobRoleDto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteJobRole(@Param('id', ParseIntPipe) id: number) {
        await this.jobRolesService.deleteJobRole(id);
    }

    // Contributor Job Role Assignments
    @Get('contributor/:contributorId/assignments')
    async getContributorJobRoles(@Param('contributorId', ParseIntPipe) contributorId: number) {
        return this.jobRolesService.getContributorJobRoles(contributorId);
    }

    @Post('assignments')
    async assignJobRole(@Body() assignJobRoleDto: AssignJobRoleDto) {
        return this.jobRolesService.assignJobRole(assignJobRoleDto);
    }

    @Put('contributor/:contributorId/job-role/:jobRoleId')
    async updateJobRoleAssignment(
        @Param('contributorId', ParseIntPipe) contributorId: number,
        @Param('jobRoleId', ParseIntPipe) jobRoleId: number,
        @Body() updateDto: UpdateJobRoleAssignmentDto
    ) {
        return this.jobRolesService.updateJobRoleAssignment(contributorId, jobRoleId, updateDto);
    }

    @Delete('contributor/:contributorId/job-role/:jobRoleId')
    @HttpCode(HttpStatus.NO_CONTENT)
    async removeJobRoleAssignment(
        @Param('contributorId', ParseIntPipe) contributorId: number,
        @Param('jobRoleId', ParseIntPipe) jobRoleId: number
    ) {
        await this.jobRolesService.removeJobRoleAssignment(contributorId, jobRoleId);
    }

    @Get(':jobRoleId/contributors')
    async getContributorsByJobRole(@Param('jobRoleId', ParseIntPipe) jobRoleId: number) {
        return this.jobRolesService.getContributorsByJobRole(jobRoleId);
    }
}
