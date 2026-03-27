import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';

@Injectable()
export class SkillRoleMappingsQueryService {
    constructor(private prisma: PrismaService) {}

    /**
     * Get all unique skill names currently in use across task_library + mappings.
     */
    async getAvailableSkills(brandId?: number) {
        const tasks = await this.prisma.task_library.findMany({
            where: brandId ? { brand_id: brandId, is_active: true } : { is_active: true },
            select: { skills_needed: true },
        });

        const librarySkills = new Set<string>();
        for (const t of tasks) {
            for (const s of t.skills_needed) {
                librarySkills.add(s);
            }
        }

        const mappings = await this.prisma.skill_role_mappings.findMany({
            where: brandId
                ? { OR: [{ brand_id: brandId }, { brand_id: null }], is_active: true }
                : { is_active: true },
            select: { skill_name: true },
        });

        const mappedSkills = new Set(mappings.map(m => m.skill_name));
        const allSkills = new Set([...librarySkills, ...mappedSkills]);

        return Array.from(allSkills)
            .sort()
            .map(skill => ({
                skill_name: skill,
                in_task_library: librarySkills.has(skill),
                has_mapping: mappedSkills.has(skill),
                is_unmapped: !mappedSkills.has(skill),
            }));
    }

    /**
     * Get a summary view: which skills map to which roles, with bracket ranges.
     */
    async getMappingSummary(brandId?: number) {
        const mappings = await this.prisma.skill_role_mappings.findMany({
            where: {
                ...(brandId ? { OR: [{ brand_id: brandId }, { brand_id: null }] } : {}),
                is_active: true,
            },
            include: {
                job_role: {
                    select: { id: true, name: true, display_name: true, category: true },
                },
                payment_bracket: {
                    select: { id: true, name: true, level: true, hourly_rate: true, day_rate: true },
                },
            },
            orderBy: [{ skill_name: 'asc' }, { priority: 'desc' }],
        });

        const bySkill = new Map<string, Array<{ role: string; priority: number }>>();
        for (const m of mappings) {
            const skill = m.skill_name;
            if (!bySkill.has(skill)) bySkill.set(skill, []);
            bySkill.get(skill)!.push({
                role: m.job_role.display_name || m.job_role.name,
                priority: m.priority,
            });
        }

        const byRole = new Map<string, string[]>();
        for (const m of mappings) {
            const role = m.job_role.display_name || m.job_role.name;
            if (!byRole.has(role)) byRole.set(role, []);
            if (!byRole.get(role)!.includes(m.skill_name)) {
                byRole.get(role)!.push(m.skill_name);
            }
        }

        return {
            total_mappings: mappings.length,
            unique_skills: bySkill.size,
            unique_roles: byRole.size,
            by_skill: Object.fromEntries(bySkill),
            by_role: Object.fromEntries(byRole),
        };
    }
}
