import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJobRoleDto, UpdateJobRoleDto } from './dto/job-role.dto';
import { AssignJobRoleDto, UpdateJobRoleAssignmentDto } from './dto/contributor-job-role.dto';

@Injectable()
export class JobRolesService {
    constructor(private prisma: PrismaService) { }

    // Job Roles CRUD
    async findAllJobRoles() {
        return this.prisma.job_roles.findMany({
            where: { is_active: true },
            orderBy: [
                { category: 'asc' },
                { display_name: 'asc' }
            ],
            include: {
                _count: {
                    select: {
                        contributor_job_roles: true
                    }
                }
            }
        });
    }

    async findJobRoleById(id: number) {
        const jobRole = await this.prisma.job_roles.findUnique({
            where: { id },
            include: {
                contributor_job_roles: {
                    include: {
                        contributor: {
                            include: {
                                contact: {
                                    select: {
                                        first_name: true,
                                        last_name: true,
                                        email: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!jobRole) {
            throw new NotFoundException(`Job role with ID ${id} not found`);
        }

        return jobRole;
    }

    async createJobRole(createJobRoleDto: CreateJobRoleDto) {
        try {
            return await this.prisma.job_roles.create({
                data: createJobRoleDto
            });
        } catch (error) {
            if (error.code === 'P2002') {
                throw new ConflictException(`Job role with name '${createJobRoleDto.name}' already exists`);
            }
            throw error;
        }
    }

    async updateJobRole(id: number, updateJobRoleDto: UpdateJobRoleDto) {
        try {
            return await this.prisma.job_roles.update({
                where: { id },
                data: updateJobRoleDto
            });
        } catch (error) {
            if (error.code === 'P2025') {
                throw new NotFoundException(`Job role with ID ${id} not found`);
            }
            if (error.code === 'P2002') {
                throw new ConflictException(`Job role with name '${updateJobRoleDto.name}' already exists`);
            }
            throw error;
        }
    }

    async deleteJobRole(id: number) {
        try {
            // Soft delete by setting is_active to false
            return await this.prisma.job_roles.update({
                where: { id },
                data: { is_active: false }
            });
        } catch (error) {
            if (error.code === 'P2025') {
                throw new NotFoundException(`Job role with ID ${id} not found`);
            }
            throw error;
        }
    }

    // Contributor Job Role Assignments
    async getContributorJobRoles(contributorId: number) {
        return this.prisma.contributor_job_roles.findMany({
            where: { contributor_id: contributorId },
            include: {
                job_role: true,
                assigned_by_user: {
                    include: {
                        contact: {
                            select: {
                                first_name: true,
                                last_name: true
                            }
                        }
                    }
                }
            },
            orderBy: [
                { is_primary: 'desc' },
                { assigned_at: 'desc' }
            ]
        });
    }

    async assignJobRole(assignJobRoleDto: AssignJobRoleDto) {
        const { contributor_id, job_role_id, is_primary, assigned_by } = assignJobRoleDto;

        // Check if assignment already exists
        const existingAssignment = await this.prisma.contributor_job_roles.findUnique({
            where: {
                contributor_id_job_role_id: {
                    contributor_id,
                    job_role_id
                }
            }
        });

        if (existingAssignment) {
            throw new ConflictException('Contributor already has this job role assigned');
        }

        // If this is being set as primary, remove primary from other roles for this contributor
        if (is_primary) {
            await this.prisma.contributor_job_roles.updateMany({
                where: {
                    contributor_id,
                    is_primary: true
                },
                data: { is_primary: false }
            });
        }

        return this.prisma.contributor_job_roles.create({
            data: {
                contributor_id,
                job_role_id,
                is_primary: is_primary || false,
                assigned_by
            },
            include: {
                job_role: true,
                contributor: {
                    include: {
                        contact: {
                            select: {
                                first_name: true,
                                last_name: true,
                                email: true
                            }
                        }
                    }
                }
            }
        });
    }

    async updateJobRoleAssignment(
        contributorId: number,
        jobRoleId: number,
        updateDto: UpdateJobRoleAssignmentDto
    ) {
        const assignment = await this.prisma.contributor_job_roles.findUnique({
            where: {
                contributor_id_job_role_id: {
                    contributor_id: contributorId,
                    job_role_id: jobRoleId
                }
            }
        });

        if (!assignment) {
            throw new NotFoundException('Job role assignment not found');
        }

        // If setting as primary, remove primary from other roles for this contributor
        if (updateDto.is_primary) {
            await this.prisma.contributor_job_roles.updateMany({
                where: {
                    contributor_id: contributorId,
                    is_primary: true,
                    job_role_id: { not: jobRoleId }
                },
                data: { is_primary: false }
            });
        }

        return this.prisma.contributor_job_roles.update({
            where: {
                contributor_id_job_role_id: {
                    contributor_id: contributorId,
                    job_role_id: jobRoleId
                }
            },
            data: updateDto,
            include: {
                job_role: true,
                contributor: {
                    include: {
                        contact: {
                            select: {
                                first_name: true,
                                last_name: true,
                                email: true
                            }
                        }
                    }
                }
            }
        });
    }

    async removeJobRoleAssignment(contributorId: number, jobRoleId: number) {
        try {
            return await this.prisma.contributor_job_roles.delete({
                where: {
                    contributor_id_job_role_id: {
                        contributor_id: contributorId,
                        job_role_id: jobRoleId
                    }
                }
            });
        } catch (error) {
            if (error.code === 'P2025') {
                throw new NotFoundException('Job role assignment not found');
            }
            throw error;
        }
    }

    // Get contributors by job role
    async getContributorsByJobRole(jobRoleId: number) {
        return this.prisma.contributor_job_roles.findMany({
            where: { job_role_id: jobRoleId },
            include: {
                contributor: {
                    include: {
                        contact: {
                            select: {
                                first_name: true,
                                last_name: true,
                                email: true,
                                phone_number: true
                            }
                        }
                    }
                },
                job_role: true
            },
            orderBy: [
                { is_primary: 'desc' },
                { assigned_at: 'desc' }
            ]
        });
    }

    // Get job roles by category
    async getJobRolesByCategory() {
        const jobRoles = await this.prisma.job_roles.findMany({
            where: { is_active: true },
            orderBy: [
                { category: 'asc' },
                { display_name: 'asc' }
            ],
            include: {
                _count: {
                    select: {
                        contributor_job_roles: true
                    }
                }
            }
        });

        // Group by category
        const grouped = jobRoles.reduce((acc, role) => {
            const category = role.category || 'uncategorized';
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(role);
            return acc;
        }, {} as Record<string, typeof jobRoles>);

        return grouped;
    }
}
