import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { ResolvedRoleResult, MappingEntry, ScoredRole } from '../types/resolver.types';

@Injectable()
export class SkillRoleMappingsResolverService {
    private readonly logger = new Logger(SkillRoleMappingsResolverService.name);

    constructor(private prisma: PrismaService) {}

    private readonly mappingInclude = {
        job_role: { select: { id: true, name: true, display_name: true, category: true } },
        payment_bracket: { select: { id: true, name: true, level: true, hourly_rate: true, day_rate: true } },
    } as const;

    async resolveRoleAndBracket(
        skillsNeeded: string[],
        brandId?: number,
    ): Promise<ResolvedRoleResult | null> {
        if (!skillsNeeded || skillsNeeded.length === 0) return null;

        const normalizedSkills = skillsNeeded.map(s => s.toLowerCase().trim());

        const mappings = await this.prisma.skill_role_mappings.findMany({
            where: {
                is_active: true,
                skill_name: { in: normalizedSkills, mode: 'insensitive' },
                OR: brandId
                    ? [{ brand_id: brandId }, { brand_id: null }]
                    : [{ brand_id: null }],
            },
            include: this.mappingInclude,
            orderBy: { priority: 'desc' },
        });

        if (mappings.length === 0) {
            this.logger.debug(`No skill-role mappings found for skills: ${skillsNeeded.join(', ')}`);
            return null;
        }

        const scored = this.scoreMappings(mappings);
        if (!scored) return null;

        if (scored.needsFallbackBracket) {
            scored.resolvedBracket = await this.findLowestBracket(scored.roleId);
        }
        return this.toResult(scored);
    }

    async batchResolve(
        tasks: Array<{ id: number; skills_needed: string[] }>,
        brandId?: number,
    ): Promise<Map<number, ResolvedRoleResult>> {
        const results = new Map<number, ResolvedRoleResult>();

        const allSkills = new Set<string>();
        for (const task of tasks) {
            for (const skill of task.skills_needed) {
                allSkills.add(skill.toLowerCase().trim());
            }
        }
        if (allSkills.size === 0) return results;

        const mappings = await this.prisma.skill_role_mappings.findMany({
            where: {
                is_active: true,
                skill_name: { in: Array.from(allSkills), mode: 'insensitive' },
                OR: brandId
                    ? [{ brand_id: brandId }, { brand_id: null }]
                    : [{ brand_id: null }],
            },
            include: this.mappingInclude,
            orderBy: { priority: 'desc' },
        });

        const skillMap = new Map<string, MappingEntry[]>();
        for (const m of mappings) {
            const key = m.skill_name.toLowerCase();
            if (!skillMap.has(key)) skillMap.set(key, []);
            skillMap.get(key)!.push(m);
        }

        // Pre-fetch brackets for all discovered roles to avoid N+1 queries
        const roleIds = [...new Set(mappings.map(m => m.job_role_id))];
        const allBrackets = roleIds.length > 0
            ? await this.prisma.payment_brackets.findMany({
                where: { job_role_id: { in: roleIds }, is_active: true },
                orderBy: { level: 'asc' },
            })
            : [];

        const roleBrackets = new Map<number, typeof allBrackets>();
        for (const b of allBrackets) {
            if (!roleBrackets.has(b.job_role_id)) roleBrackets.set(b.job_role_id, []);
            roleBrackets.get(b.job_role_id)!.push(b);
        }

        for (const task of tasks) {
            if (!task.skills_needed || task.skills_needed.length === 0) continue;

            const taskMappings: MappingEntry[] = [];
            for (const skill of task.skills_needed) {
                const matches = skillMap.get(skill.toLowerCase().trim()) || [];
                taskMappings.push(...matches);
            }
            if (taskMappings.length === 0) continue;

            const scored = this.scoreMappings(taskMappings);
            if (!scored) continue;

            if (scored.needsFallbackBracket) {
                const brackets = roleBrackets.get(scored.roleId) || [];
                scored.resolvedBracket = brackets.length > 0 ? brackets[0] : null;
            }
            results.set(task.id, this.toResult(scored));
        }

        return results;
    }

    private scoreMappings(mappings: MappingEntry[]): ScoredRole | null {
        const roleData = new Map<number, {
            role: MappingEntry['job_role'];
            totalScore: number;
            bestSkill: string;
            bracketMatches: Map<number, {
                bracket: NonNullable<MappingEntry['payment_bracket']>;
                matchCount: number;
                score: number;
                bestSkill: string;
            }>;
            hasAnyBracketMapping: boolean;
        }>();

        for (const m of mappings) {
            const bonus = m.brand_id ? 100 : 0;
            if (!roleData.has(m.job_role_id)) {
                roleData.set(m.job_role_id, {
                    role: m.job_role,
                    totalScore: 0,
                    bestSkill: m.skill_name,
                    bracketMatches: new Map(),
                    hasAnyBracketMapping: false,
                });
            }
            const rd = roleData.get(m.job_role_id)!;
            rd.totalScore += m.priority + bonus;

            if (m.payment_bracket_id && m.payment_bracket) {
                rd.hasAnyBracketMapping = true;
                const existing = rd.bracketMatches.get(m.payment_bracket_id);
                if (existing) {
                    existing.matchCount++;
                    existing.score += m.priority + bonus;
                } else {
                    rd.bracketMatches.set(m.payment_bracket_id, {
                        bracket: m.payment_bracket,
                        matchCount: 1,
                        score: m.priority + bonus,
                        bestSkill: m.skill_name,
                    });
                }
            } else {
                rd.bestSkill = m.skill_name;
            }
        }

        let bestRoleId = 0;
        let bestScore = -1;
        let bestRd: (typeof roleData extends Map<number, infer V> ? V : never) | null = null;
        for (const [roleId, data] of roleData.entries()) {
            if (data.totalScore > bestScore) {
                bestScore = data.totalScore;
                bestRoleId = roleId;
                bestRd = data;
            }
        }
        if (!bestRd) return null;

        let resolvedBracket: ScoredRole['resolvedBracket'] = null;
        let resolvedSkill = bestRd.bestSkill;
        let needsFallbackBracket = false;

        if (bestRd.hasAnyBracketMapping && bestRd.bracketMatches.size > 0) {
            let highestLevel = -1;
            for (const [, bm] of bestRd.bracketMatches.entries()) {
                if (bm.bracket.level > highestLevel) {
                    highestLevel = bm.bracket.level;
                    resolvedBracket = bm.bracket;
                    resolvedSkill = bm.bestSkill;
                }
            }
        } else {
            needsFallbackBracket = true;
        }

        return { roleId: bestRoleId, role: bestRd.role, resolvedBracket, resolvedSkill, needsFallbackBracket };
    }

    private toResult(scored: ScoredRole): ResolvedRoleResult {
        return {
            job_role_id: scored.roleId,
            job_role_name: scored.role.name,
            job_role_display_name: scored.role.display_name,
            bracket_id: scored.resolvedBracket?.id ?? null,
            bracket_name: scored.resolvedBracket?.name ?? null,
            bracket_level: scored.resolvedBracket?.level ?? null,
            hourly_rate: scored.resolvedBracket ? Number(scored.resolvedBracket.hourly_rate) : null,
            day_rate: scored.resolvedBracket?.day_rate ? Number(scored.resolvedBracket.day_rate) : null,
            resolved_skill: scored.resolvedSkill,
        };
    }

    private async findLowestBracket(jobRoleId: number) {
        return this.prisma.payment_brackets.findFirst({
            where: { job_role_id: jobRoleId, is_active: true },
            orderBy: { level: 'asc' },
        });
    }
}
