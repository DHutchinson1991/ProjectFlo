import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { AssignJobRoleDto, UpdateJobRoleAssignmentDto } from '../dto/contributor-job-role.dto';

@Injectable()
export class JobRoleAssignmentsService {
    constructor(private prisma: PrismaService) {}

    async getContributorJobRoles(contributorId: number) {
        return this.prisma.crewMemberJobRole.findMany({
            where: { crew_member_id: contributorId },
            include: {
                job_role: true,
                payment_bracket: true,
                assigned_by_user: {
                    include: {
                        contact: {
                            select: {
                                first_name: true,
                                last_name: true,
                            },
                        },
                    },
                },
            },
            orderBy: [{ is_primary: 'desc' }, { assigned_at: 'desc' }],
        });
    }

    async assignJobRole(assignJobRoleDto: AssignJobRoleDto) {
        const { crew_member_id, job_role_id, is_primary, assigned_by } = assignJobRoleDto;

        const existingAssignment = await this.prisma.crewMemberJobRole.findUnique({
            where: {
                crew_member_id_job_role_id: { crew_member_id: crew_member_id, job_role_id },
            },
        });

        if (existingAssignment) {
            throw new ConflictException('Contributor already has this job role assigned');
        }

        if (is_primary) {
            await this.prisma.crewMemberJobRole.updateMany({
                where: { crew_member_id: crew_member_id, is_primary: true },
                data: { is_primary: false },
            });
        }

        return this.prisma.crewMemberJobRole.create({
            data: {
                crew_member_id: crew_member_id,
                job_role_id,
                is_primary: is_primary || false,
                assigned_by,
                payment_bracket_id: assignJobRoleDto.payment_bracket_id,
            },
            include: {
                job_role: true,
                payment_bracket: true,
                crew_member: {
                    include: {
                        contact: {
                            select: {
                                first_name: true,
                                last_name: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        });
    }

    async updateJobRoleAssignment(
        contributorId: number,
        jobRoleId: number,
        updateDto: UpdateJobRoleAssignmentDto,
    ) {
        const assignment = await this.prisma.crewMemberJobRole.findUnique({
            where: {
                crew_member_id_job_role_id: {
                    crew_member_id: contributorId,
                    job_role_id: jobRoleId,
                },
            },
        });

        if (!assignment) {
            throw new NotFoundException('Job role assignment not found');
        }

        if (updateDto.is_primary) {
            await this.prisma.crewMemberJobRole.updateMany({
                where: {
                    crew_member_id: contributorId,
                    is_primary: true,
                    job_role_id: { not: jobRoleId },
                },
                data: { is_primary: false },
            });
        }

        return this.prisma.crewMemberJobRole.update({
            where: {
                crew_member_id_job_role_id: {
                    crew_member_id: contributorId,
                    job_role_id: jobRoleId,
                },
            },
            data: updateDto,
            include: {
                job_role: true,
                payment_bracket: true,
                crew_member: {
                    include: {
                        contact: {
                            select: {
                                first_name: true,
                                last_name: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        });
    }

    async removeJobRoleAssignment(contributorId: number, jobRoleId: number) {
        try {
            return await this.prisma.crewMemberJobRole.delete({
                where: {
                    crew_member_id_job_role_id: {
                        crew_member_id: contributorId,
                        job_role_id: jobRoleId,
                    },
                },
            });
        } catch (error: unknown) {
            if (error instanceof Object && 'code' in error && error.code === 'P2025') {
                throw new NotFoundException('Job role assignment not found');
            }
            throw error;
        }
    }

    async getContributorsByJobRole(jobRoleId: number) {
        return this.prisma.crewMemberJobRole.findMany({
            where: { job_role_id: jobRoleId },
            include: {
                crew_member: {
                    include: {
                        contact: {
                            select: {
                                first_name: true,
                                last_name: true,
                                email: true,
                                phone_number: true,
                            },
                        },
                    },
                },
                job_role: true,
            },
            orderBy: [{ is_primary: 'desc' }, { assigned_at: 'desc' }],
        });
    }
}
