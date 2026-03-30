import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';

const CREW_INCLUDE = {
    contact: { select: { id: true, first_name: true, last_name: true, email: true, phone_number: true } },
    job_role_assignments: {
        include: { job_role: { select: { id: true, name: true, display_name: true, category: true } } },
    },
} as const;

@Injectable()
export class CrewManagementService {
    constructor(private readonly prisma: PrismaService) {}

    async updateCrewProfile(
        crewId: number,
        dto: { crew_color?: string | null; bio?: string | null },
    ) {
        const prisma = this.prisma as any;
        const existing = await prisma.crew.findUnique({ where: { id: crewId } });
        if (!existing) throw new NotFoundException('Crew not found');

        return prisma.crew.update({
            where: { id: crewId },
            data: {
                crew_color: dto.crew_color !== undefined ? dto.crew_color : undefined,
                bio: dto.bio !== undefined ? dto.bio : undefined,
            },
            include: CREW_INCLUDE,
        });
    }

    async getCrewWorkload(brandId: number) {
        const prisma = this.prisma as any;
        const crew = await prisma.crew.findMany({
            where: {
                contact: { archived_at: null },
                brand_memberships: { some: { brand_id: brandId, is_active: true } },
            },
            include: {
                contact: { select: { first_name: true, last_name: true, email: true } },
                job_role_assignments: {
                    where: { is_primary: true },
                    include: { job_role: { select: { id: true, name: true, display_name: true } } },
                    take: 1,
                },
                _count: { select: { package_crew_assignments: true, project_crew_assignments: true } },
            },
            orderBy: { contact: { first_name: 'asc' } },
        });

        return crew.map((c: any) => ({
            id: c.id,
            name: `${c.contact.first_name || ''} ${c.contact.last_name || ''}`.trim(),
            email: c.contact.email,
            crew_color: c.crew_color,
            primary_role: c.job_role_assignments[0]?.job_role?.display_name || c.job_role_assignments[0]?.job_role?.name || null,
            package_assignments: c._count.package_crew_assignments,
            project_assignments: c._count.project_crew_assignments,
        }));
    }
}
