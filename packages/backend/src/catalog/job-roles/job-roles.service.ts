import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { CreateJobRoleDto, UpdateJobRoleDto } from './dto/job-role.dto';

@Injectable()
export class JobRolesService {
    constructor(private prisma: PrismaService) {}

    async findAllJobRoles() {
        return this.prisma.job_roles.findMany({
            where: { is_active: true },
            orderBy: [{ category: 'asc' }, { display_name: 'asc' }],
            include: {
                _count: { select: { crew_member_job_roles: true } },
            },
        });
    }

    async findJobRoleById(id: number) {
        const jobRole = await this.prisma.job_roles.findUnique({
            where: { id },
            include: {
                crew_member_job_roles: {
                    include: {
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
                },
            },
        });

        if (!jobRole) {
            throw new NotFoundException(`Job role with ID ${id} not found`);
        }

        return jobRole;
    }

    async createJobRole(createJobRoleDto: CreateJobRoleDto) {
        try {
            return await this.prisma.job_roles.create({
                data: createJobRoleDto,
            });
        } catch (error: unknown) {
            if (error instanceof Object && 'code' in error && error.code === 'P2002') {
                throw new ConflictException(`Job role with name '${createJobRoleDto.name}' already exists`);
            }
            throw error;
        }
    }

    async updateJobRole(id: number, updateJobRoleDto: UpdateJobRoleDto) {
        try {
            return await this.prisma.job_roles.update({
                where: { id },
                data: updateJobRoleDto,
            });
        } catch (error: unknown) {
            if (error instanceof Object && 'code' in error && error.code === 'P2025') {
                throw new NotFoundException(`Job role with ID ${id} not found`);
            }
            if (error instanceof Object && 'code' in error && error.code === 'P2002') {
                throw new ConflictException(`Job role with name '${updateJobRoleDto.name}' already exists`);
            }
            throw error;
        }
    }

    async deleteJobRole(id: number) {
        try {
            return await this.prisma.job_roles.update({
                where: { id },
                data: { is_active: false },
            });
        } catch (error: unknown) {
            if (error instanceof Object && 'code' in error && error.code === 'P2025') {
                throw new NotFoundException(`Job role with ID ${id} not found`);
            }
            throw error;
        }
    }

    async getJobRolesByCategory() {
        const jobRoles = await this.prisma.job_roles.findMany({
            where: { is_active: true },
            orderBy: [{ category: 'asc' }, { display_name: 'asc' }],
            include: {
                _count: { select: { crew_member_job_roles: true } },
            },
        });

        const grouped = jobRoles.reduce(
            (acc, role) => {
                const category = role.category || 'uncategorized';
                if (!acc[category]) {
                    acc[category] = [];
                }
                acc[category].push(role);
                return acc;
            },
            {} as Record<string, typeof jobRoles>,
        );

        return grouped;
    }
}
