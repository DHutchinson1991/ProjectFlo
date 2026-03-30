import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';

@Injectable()
export class CrewService {
    constructor(private readonly prisma: PrismaService) {}

    async getCrewByBrand(brandId: number) {
        return this.prisma.crew.findMany({
            where: {
                contact: { archived_at: null },
                brand_memberships: { some: { brand_id: brandId, is_active: true } },
            },
            include: {
                contact: {
                    select: {
                        id: true, first_name: true, last_name: true,
                        email: true, phone_number: true, company_name: true,
                        user_account: { select: { system_role: { select: { id: true, name: true } } } },
                    },
                },
                job_role_assignments: {
                    include: { job_role: { select: { id: true, name: true, display_name: true, category: true } } },
                    orderBy: [{ is_primary: 'desc' }, { assigned_at: 'asc' }],
                },
            },
            orderBy: { contact: { first_name: 'asc' } },
        });
    }

    async getCrewById(id: number) {
        const member = await this.prisma.crew.findUnique({
            where: { id },
            include: {
                contact: { include: { user_account: { include: { system_role: true } } } },
                job_role_assignments: {
                    include: { job_role: true },
                    orderBy: [{ is_primary: 'desc' }, { assigned_at: 'asc' }],
                },
                package_crew_assignments: {
                    include: {
                        package: { select: { id: true, name: true } },
                        package_event_day: { select: { id: true, event_day: { select: { name: true } } } },
                        job_role: { select: { id: true, name: true, display_name: true } },
                    },
                    orderBy: { created_at: 'desc' },
                    take: 20,
                },
                brand_memberships: {
                    include: { brand: { select: { id: true, name: true, display_name: true } } },
                },
            },
        });
        if (!member) throw new NotFoundException('Crew not found');
        return member;
    }

    async getCrewByJobRole(brandId: number, jobRoleId: number) {
        return this.prisma.crew.findMany({
            where: {
                contact: { archived_at: null },
                brand_memberships: { some: { brand_id: brandId, is_active: true } },
                job_role_assignments: { some: { job_role_id: jobRoleId } },
            },
            include: {
                contact: { select: { id: true, first_name: true, last_name: true, email: true } },
                job_role_assignments: {
                    where: { job_role_id: jobRoleId },
                    include: { job_role: { select: { id: true, name: true, display_name: true } } },
                },
            },
            orderBy: { contact: { first_name: 'asc' } },
        });
    }
}
