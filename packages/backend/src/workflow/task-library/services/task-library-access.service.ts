import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';

/**
 * Handles brand-access guards and role+bracket resolution helpers shared by
 * the CRUD and execute auto-generation services.
 */
@Injectable()
export class TaskLibraryAccessService {
    constructor(private readonly prisma: PrismaService) {}

    async checkBrandAccess(brandId: number, userId: number) {
        const contributor = await this.prisma.crewMember.findUnique({
            where: { id: userId },
            include: { role: true },
        });
        if (contributor?.role?.name === 'Global Admin') return true;

        const userBrand = await this.prisma.brandMember.findFirst({
            where: { crew_member_id: userId, brand_id: brandId, is_active: true },
        });
        if (!userBrand) throw new ForbiddenException('Access denied to this brand');
        return userBrand;
    }

    async getUserBrands(userId: number) {
        const contributor = await this.prisma.crewMember.findUnique({
            where: { id: userId },
            include: { role: true },
        });
        if (contributor?.role?.name === 'Global Admin') {
            const allBrands = await this.prisma.brands.findMany({
                where: { is_active: true },
                select: { id: true, name: true },
            });
            return allBrands.map(brand => ({ user_id: userId, brand_id: brand.id, brand }));
        }
        return this.prisma.brandMember.findMany({
            where: { crew_member_id: userId, is_active: true },
            include: { brand: { select: { id: true, name: true } } },
        });
    }

    /**
     * Auto-select a contributor for a role, scoped to a brand.
     * Returns null when multiple people qualify (manual pick needed).
     */
    async resolveContributorForRole(jobRoleId: number, bracketId?: number | null, brandId?: number): Promise<number | null> {
        const brandFilter = brandId ? {
            crew_member: { contact: { OR: [{ brand_id: brandId }, { brand_id: null }] } },
        } : {};

        if (bracketId != null) {
            const bracket = await this.prisma.payment_brackets.findUnique({
                where: { id: bracketId },
                select: { level: true },
            });
            if (bracket) {
                const eligible = await this.prisma.crewMemberJobRole.findMany({
                    where: { job_role_id: jobRoleId, payment_bracket: { level: { gte: bracket.level } }, ...brandFilter },
                    select: { crew_member_id: true },
                });
                if (eligible.length === 1) return eligible[0].crew_member_id;
                if (eligible.length > 1) return null;
            }
        }

        const allRows = await this.prisma.crewMemberJobRole.findMany({
            where: { job_role_id: jobRoleId, ...brandFilter },
            select: { crew_member_id: true },
        });
        return allRows.length === 1 ? allRows[0].crew_member_id : null;
    }

    /** Resolve the highest-level payment bracket for a role+skills combination. */
    async resolveBracketForRoleSkills(jobRoleId: number, skills: string[]): Promise<number | null> {
        if (!skills.length) return null;
        const mappings = await this.prisma.skill_role_mappings.findMany({
            where: {
                job_role_id: jobRoleId,
                skill_name: { in: skills, mode: 'insensitive' },
                payment_bracket_id: { not: null },
                is_active: true,
            },
            include: { payment_bracket: { select: { id: true, level: true } } },
        });
        let highest: { id: number; level: number } | null = null;
        for (const m of mappings) {
            if (!m.payment_bracket) continue;
            if (!highest || m.payment_bracket.level > highest.level) {
                highest = { id: m.payment_bracket.id, level: m.payment_bracket.level };
            }
        }
        return highest?.id ?? null;
    }
}
