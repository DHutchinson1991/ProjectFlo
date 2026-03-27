import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';

const CONTRIBUTOR_INCLUDE = {
    contact: { select: { id: true, first_name: true, last_name: true, email: true, phone_number: true } },
    role: { select: { id: true, name: true } },
    crew_member_job_roles: {
        include: { job_role: { select: { id: true, name: true, display_name: true, category: true } } },
    },
} as const;

@Injectable()
export class CrewManagementService {
    constructor(private readonly prisma: PrismaService) {}

    async updateCrewProfile(
        contributorId: number,
        dto: { crew_color?: string | null; bio?: string | null },
    ) {
        const existing = await this.prisma.crewMember.findUnique({ where: { id: contributorId } });
        if (!existing) throw new NotFoundException('Crew member not found');

        return this.prisma.crewMember.update({
            where: { id: contributorId },
            data: {
                crew_color: dto.crew_color !== undefined ? dto.crew_color : undefined,
                bio: dto.bio !== undefined ? dto.bio : undefined,
            },
            include: CONTRIBUTOR_INCLUDE,
        });
    }

    async getCrewWorkload(brandId: number) {
        const crew = await this.prisma.crewMember.findMany({
            where: {
                archived_at: null,
                brand_memberships: { some: { brand_id: brandId, is_active: true } },
            },
            include: {
                contact: { select: { first_name: true, last_name: true, email: true } },
                crew_member_job_roles: {
                    where: { is_primary: true },
                    include: { job_role: { select: { id: true, name: true, display_name: true } } },
                    take: 1,
                },
                _count: { select: { package_crew_assignments: true, project_crew_assignments: true } },
            },
            orderBy: { contact: { first_name: 'asc' } },
        });

        return crew.map((c) => ({
            id: c.id,
            name: `${c.contact.first_name || ''} ${c.contact.last_name || ''}`.trim(),
            email: c.contact.email,
            crew_color: c.crew_color,
            primary_role: c.crew_member_job_roles[0]?.job_role?.display_name || c.crew_member_job_roles[0]?.job_role?.name || null,
            package_assignments: c._count.package_crew_assignments,
            project_assignments: c._count.project_crew_assignments,
        }));
    }
}
