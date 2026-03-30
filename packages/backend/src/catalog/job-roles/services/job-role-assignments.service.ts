import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { AssignJobRoleDto, UpdateJobRoleAssignmentDto } from '../dto/crew-job-role.dto';

@Injectable()
export class JobRoleAssignmentsService {
    constructor(private prisma: PrismaService) {}

    async getCrewJobRoles(crewId: number) {
        return this.prisma.crewJobRole.findMany({
            where: { crew_id: crewId },
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
        const { crew_id, job_role_id, is_primary, assigned_by } = assignJobRoleDto;

        const existingAssignment = await this.prisma.crewJobRole.findUnique({
            where: {
                crew_id_job_role_id: { crew_id: crew_id, job_role_id },
            },
        });

        if (existingAssignment) {
            throw new ConflictException('Crew already has this job role assigned');
        }

        if (is_primary) {
            await this.prisma.crewJobRole.updateMany({
                where: { crew_id: crew_id, is_primary: true },
                data: { is_primary: false },
            });
        }

        return this.prisma.crewJobRole.create({
            data: {
                crew_id: crew_id,
                job_role_id,
                is_primary: is_primary || false,
                assigned_by,
                payment_bracket_id: assignJobRoleDto.payment_bracket_id,
            },
            include: {
                job_role: true,
                payment_bracket: true,
                crew: {
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
        crewId: number,
        jobRoleId: number,
        updateDto: UpdateJobRoleAssignmentDto,
    ) {
        const assignment = await this.prisma.crewJobRole.findUnique({
            where: {
                crew_id_job_role_id: {
                    crew_id: crewId,
                    job_role_id: jobRoleId,
                },
            },
        });

        if (!assignment) {
            throw new NotFoundException('Job role assignment not found');
        }

        if (updateDto.is_primary) {
            await this.prisma.crewJobRole.updateMany({
                where: {
                    crew_id: crewId,
                    is_primary: true,
                    job_role_id: { not: jobRoleId },
                },
                data: { is_primary: false },
            });
        }

        return this.prisma.crewJobRole.update({
            where: {
                crew_id_job_role_id: {
                    crew_id: crewId,
                    job_role_id: jobRoleId,
                },
            },
            data: updateDto,
            include: {
                job_role: true,
                payment_bracket: true,
                crew: {
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

    async removeJobRoleAssignment(crewId: number, jobRoleId: number) {
        try {
            return await this.prisma.crewJobRole.delete({
                where: {
                    crew_id_job_role_id: {
                        crew_id: crewId,
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

    async getCrewByJobRole(jobRoleId: number) {
        return this.prisma.crewJobRole.findMany({
            where: { job_role_id: jobRoleId },
            include: {
                crew: {
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
