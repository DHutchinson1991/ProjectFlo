import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
    CreateSkillRoleMappingDto,
    UpdateSkillRoleMappingDto,
    BulkCreateSkillRoleMappingDto,
    SkillRoleMappingQueryDto,
} from './dto/skill-role-mapping.dto';

export interface ResolvedRoleResult {
    job_role_id: number;
    job_role_name: string;
    job_role_display_name: string | null;
    bracket_id: number | null;
    bracket_name: string | null;
    bracket_level: number | null;
    hourly_rate: number | null;
    day_rate: number | null;
    resolved_skill: string;
}

@Injectable()
export class SkillRoleMappingsService {
    private readonly logger = new Logger(SkillRoleMappingsService.name);

    constructor(private prisma: PrismaService) { }

    // ─── CRUD ──────────────────────────────────────────────────

    async findAll(query: SkillRoleMappingQueryDto) {
        const where: Record<string, unknown> = {};

        if (!query.include_inactive) {
            where.is_active = true;
        }
        if (query.brandId) {
            where.OR = [{ brand_id: query.brandId }, { brand_id: null }];
        }
        if (query.jobRoleId) {
            where.job_role_id = query.jobRoleId;
        }
        if ((query as { paymentBracketId?: number }).paymentBracketId) {
            where.payment_bracket_id = (query as { paymentBracketId?: number }).paymentBracketId;
        }
        if (query.skill) {
            where.skill_name = { contains: query.skill, mode: 'insensitive' };
        }

        return this.prisma.skill_role_mappings.findMany({
            where,
            include: {
                job_role: {
                    select: { id: true, name: true, display_name: true, category: true },
                },
                payment_bracket: {
                    select: { id: true, name: true, level: true, hourly_rate: true, day_rate: true },
                },
                brand: {
                    select: { id: true, name: true },
                },
            },
            orderBy: [
                { skill_name: 'asc' },
                { priority: 'desc' },
            ],
        });
    }

    async findById(id: number) {
        const mapping = await this.prisma.skill_role_mappings.findUnique({
            where: { id },
            include: {
                job_role: {
                    select: { id: true, name: true, display_name: true, category: true },
                },
                payment_bracket: {
                    select: { id: true, name: true, level: true, hourly_rate: true, day_rate: true },
                },
                brand: {
                    select: { id: true, name: true },
                },
            },
        });
        if (!mapping) {
            throw new NotFoundException(`Skill-role mapping #${id} not found`);
        }
        return mapping;
    }

    async create(dto: CreateSkillRoleMappingDto) {
        // Normalize skill name to Title Case for consistency
        const normalizedSkill = this.normalizeSkillName(dto.skill_name);

        // Verify job role exists
        const jobRole = await this.prisma.job_roles.findUnique({ where: { id: dto.job_role_id } });
        if (!jobRole) {
            throw new NotFoundException(`Job role #${dto.job_role_id} not found`);
        }

        // Verify bracket belongs to this role if specified
        if (dto.payment_bracket_id) {
            const bracket = await this.prisma.payment_brackets.findUnique({
                where: { id: dto.payment_bracket_id },
            });
            if (!bracket || bracket.job_role_id !== dto.job_role_id) {
                throw new NotFoundException(
                    `Payment bracket #${dto.payment_bracket_id} not found or doesn't belong to role #${dto.job_role_id}`,
                );
            }
        }

        try {
            return await this.prisma.skill_role_mappings.create({
                data: {
                    skill_name: normalizedSkill,
                    job_role_id: dto.job_role_id,
                    payment_bracket_id: dto.payment_bracket_id ?? null,
                    brand_id: dto.brand_id ?? null,
                    priority: dto.priority ?? 1,
                },
                include: {
                    job_role: {
                        select: { id: true, name: true, display_name: true, category: true },
                    },
                    payment_bracket: {
                        select: { id: true, name: true, level: true, hourly_rate: true, day_rate: true },
                    },
                },
            });
        } catch (err: unknown) {
            if (err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'P2002') {
                throw new ConflictException(
                    `Mapping already exists: "${normalizedSkill}" → ${jobRole.display_name || jobRole.name}`,
                );
            }
            throw err;
        }
    }

    async bulkCreate(dto: BulkCreateSkillRoleMappingDto) {
        const results = { created: 0, skipped: 0, errors: [] as string[] };

        for (const mapping of dto.mappings) {
            try {
                await this.create(mapping);
                results.created++;
            } catch (err: unknown) {
                if (err instanceof ConflictException) {
                    results.skipped++;
                } else {
                    results.errors.push(
                        `Failed: "${mapping.skill_name}" → role #${mapping.job_role_id}: ${err instanceof Error ? err.message : String(err)}`,
                    );
                }
            }
        }

        return results;
    }

    async update(id: number, dto: UpdateSkillRoleMappingDto) {
        await this.findById(id); // throws if not found

        const data: Record<string, unknown> = {};
        if (dto.skill_name !== undefined) data.skill_name = this.normalizeSkillName(dto.skill_name);
        if (dto.job_role_id !== undefined) data.job_role_id = dto.job_role_id;
        if (dto.payment_bracket_id !== undefined) data.payment_bracket_id = dto.payment_bracket_id;
        if (dto.priority !== undefined) data.priority = dto.priority;
        if (dto.is_active !== undefined) data.is_active = dto.is_active;

        return this.prisma.skill_role_mappings.update({
            where: { id },
            data,
            include: {
                job_role: {
                    select: { id: true, name: true, display_name: true, category: true },
                },
                payment_bracket: {
                    select: { id: true, name: true, level: true, hourly_rate: true, day_rate: true },
                },
            },
        });
    }

    async remove(id: number) {
        await this.findById(id);
        return this.prisma.skill_role_mappings.delete({ where: { id } });
    }

    // ─── Resolution Logic ──────────────────────────────────────

    /**
     * Core resolution: given a list of skills, find the best-matching
     * job_role and payment_bracket.
     *
     * Algorithm (tier-aware):
     * 1. Look up all active skill_role_mappings for the given skills
     * 2. Prefer brand-specific mappings over global (brand_id = null)
     * 3. Group matches by role, then by bracket within each role
     * 4. For each role+bracket combo, count how many of the task's skills match
     * 5. Pick the role with the most skill matches overall
     * 6. Within that role, pick the highest bracket level that has matching skills
     *    → This ensures higher-tier brackets are selected when their skills apply
     * 7. If no bracket-specific mappings exist, picks the lowest bracket for the role
     */
    async resolveRoleAndBracket(
        skillsNeeded: string[],
        brandId?: number,
    ): Promise<ResolvedRoleResult | null> {
        if (!skillsNeeded || skillsNeeded.length === 0) {
            return null;
        }

        // Normalize skill names for matching
        const normalizedSkills = skillsNeeded.map(s => s.toLowerCase().trim());

        // Fetch all matching mappings (including bracket-specific ones)
        const mappings = await this.prisma.skill_role_mappings.findMany({
            where: {
                is_active: true,
                skill_name: { in: normalizedSkills, mode: 'insensitive' },
                OR: brandId
                    ? [{ brand_id: brandId }, { brand_id: null }]
                    : [{ brand_id: null }],
            },
            include: {
                job_role: {
                    select: { id: true, name: true, display_name: true, category: true },
                },
                payment_bracket: {
                    select: { id: true, name: true, level: true, hourly_rate: true, day_rate: true },
                },
            },
            orderBy: { priority: 'desc' },
        });

        if (mappings.length === 0) {
            this.logger.debug(`No skill-role mappings found for skills: ${skillsNeeded.join(', ')}`);
            return null;
        }

        return this.resolveFromMappings(mappings);
    }

    /**
     * Given pre-fetched mappings and the task's skills, pick the best role + bracket.
     */
    private async resolveFromMappings(
        mappings: Array<{
            job_role_id: number;
            skill_name: string;
            priority: number;
            brand_id: number | null;
            payment_bracket_id: number | null;
            job_role: { id: number; name: string; display_name: string | null; category: string | null };
            payment_bracket: { id: number; name: string; level: number; hourly_rate: unknown; day_rate: unknown } | null;
        }>,
    ): Promise<ResolvedRoleResult | null> {
        // Group by role, tracking both bracket-specific and general matches
        const roleData = new Map<number, {
            role: typeof mappings[0]['job_role'];
            totalScore: number;
            bestSkill: string;
            bracketMatches: Map<number, { bracket: NonNullable<typeof mappings[0]['payment_bracket']>; matchCount: number; score: number; bestSkill: string }>;
            hasAnyBracketMapping: boolean;
            generalMatchCount: number;
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
                    generalMatchCount: 0,
                });
            }
            const rd = roleData.get(m.job_role_id)!;
            rd.totalScore += m.priority + bonus;

            if (m.payment_bracket_id && m.payment_bracket) {
                // Bracket-specific mapping
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
                // General (non-bracket-specific) mapping
                rd.generalMatchCount++;
                rd.bestSkill = m.skill_name;
            }
        }

        // Pick the highest-scoring role
        let bestRoleId = 0;
        let bestScore = -1;
        let bestRoleData: typeof roleData extends Map<number, infer V> ? V : never = undefined as never;

        for (const [roleId, data] of roleData.entries()) {
            if (data.totalScore > bestScore) {
                bestScore = data.totalScore;
                bestRoleId = roleId;
                bestRoleData = data;
            }
        }

        if (!bestRoleData) return null;

        // Determine bracket:
        // If this role has bracket-specific skill mappings, pick the highest-level
        // bracket that has at least one matching skill
        let resolvedBracket: { id: number; name: string; level: number; hourly_rate: unknown; day_rate: unknown } | null = null;
        let resolvedSkill = bestRoleData.bestSkill;

        if (bestRoleData.hasAnyBracketMapping && bestRoleData.bracketMatches.size > 0) {
            // Pick highest-level bracket with matching skills
            let highestLevel = -1;
            for (const [, bm] of bestRoleData.bracketMatches.entries()) {
                if (bm.bracket.level > highestLevel) {
                    highestLevel = bm.bracket.level;
                    resolvedBracket = bm.bracket;
                    resolvedSkill = bm.bestSkill;
                }
            }
        } else {
            // Fallback: pick lowest bracket for this role
            resolvedBracket = await this.findLowestBracket(bestRoleId);
        }

        return {
            job_role_id: bestRoleId,
            job_role_name: bestRoleData.role.name,
            job_role_display_name: bestRoleData.role.display_name,
            bracket_id: resolvedBracket?.id ?? null,
            bracket_name: resolvedBracket?.name ?? null,
            bracket_level: resolvedBracket?.level ?? null,
            hourly_rate: resolvedBracket ? Number(resolvedBracket.hourly_rate) : null,
            day_rate: resolvedBracket?.day_rate ? Number(resolvedBracket.day_rate) : null,
            resolved_skill: resolvedSkill,
        };
    }

    /**
     * Resolve roles for multiple tasks at once (batch operation for auto-generation).
     * Returns a Map of task_library_id → ResolvedRoleResult.
     * Uses tier-aware resolution: bracket-specific skill mappings determine the bracket.
     */
    async batchResolve(
        tasks: Array<{ id: number; skills_needed: string[] }>,
        brandId?: number,
    ): Promise<Map<number, ResolvedRoleResult>> {
        const results = new Map<number, ResolvedRoleResult>();

        // Collect all unique skills across all tasks
        const allSkills = new Set<string>();
        for (const task of tasks) {
            for (const skill of task.skills_needed) {
                allSkills.add(skill.toLowerCase().trim());
            }
        }

        if (allSkills.size === 0) return results;

        // Fetch all matching mappings in one query (including bracket relations)
        const mappings = await this.prisma.skill_role_mappings.findMany({
            where: {
                is_active: true,
                skill_name: { in: Array.from(allSkills), mode: 'insensitive' },
                OR: brandId
                    ? [{ brand_id: brandId }, { brand_id: null }]
                    : [{ brand_id: null }],
            },
            include: {
                job_role: {
                    select: { id: true, name: true, display_name: true, category: true },
                },
                payment_bracket: {
                    select: { id: true, name: true, level: true, hourly_rate: true, day_rate: true },
                },
            },
            orderBy: { priority: 'desc' },
        });

        // Build a skill→mappings lookup
        const skillMap = new Map<string, typeof mappings>();
        for (const m of mappings) {
            const key = m.skill_name.toLowerCase();
            if (!skillMap.has(key)) skillMap.set(key, []);
            skillMap.get(key)!.push(m);
        }

        // Pre-fetch brackets for fallback (lowest bracket when no tier-specific match)
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

        // Resolve each task using tier-aware logic
        for (const task of tasks) {
            if (!task.skills_needed || task.skills_needed.length === 0) continue;

            // Collect all mappings that match this task's skills
            const taskMappings: typeof mappings = [];
            for (const skill of task.skills_needed) {
                const normalized = skill.toLowerCase().trim();
                const matches = skillMap.get(normalized) || [];
                taskMappings.push(...matches);
            }

            if (taskMappings.length === 0) continue;

            // Group by role → bracket matches
            const roleData = new Map<number, {
                role: typeof mappings[0]['job_role'];
                totalScore: number;
                bestSkill: string;
                bracketMatches: Map<number, { bracket: NonNullable<typeof mappings[0]['payment_bracket']>; matchCount: number; score: number; bestSkill: string }>;
                hasAnyBracketMapping: boolean;
                generalMatchCount: number;
            }>();

            for (const m of taskMappings) {
                const bonus = m.brand_id ? 100 : 0;
                if (!roleData.has(m.job_role_id)) {
                    roleData.set(m.job_role_id, {
                        role: m.job_role,
                        totalScore: 0,
                        bestSkill: m.skill_name,
                        bracketMatches: new Map(),
                        hasAnyBracketMapping: false,
                        generalMatchCount: 0,
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
                    rd.generalMatchCount++;
                    rd.bestSkill = m.skill_name;
                }
            }

            // Pick highest scoring role
            let bestRoleId = 0;
            let bestScore = -1;
            let bestRd: typeof roleData extends Map<number, infer V> ? V : never = undefined as never;

            for (const [roleId, data] of roleData.entries()) {
                if (data.totalScore > bestScore) {
                    bestScore = data.totalScore;
                    bestRoleId = roleId;
                    bestRd = data;
                }
            }

            if (!bestRd) continue;

            // Determine bracket
            let resolvedBracket: { id: number; name: string; level: number; hourly_rate: unknown; day_rate: unknown } | null = null;
            let resolvedSkill = bestRd.bestSkill;

            if (bestRd.hasAnyBracketMapping && bestRd.bracketMatches.size > 0) {
                // Pick highest-level bracket with matching skills
                let highestLevel = -1;
                for (const [, bm] of bestRd.bracketMatches.entries()) {
                    if (bm.bracket.level > highestLevel) {
                        highestLevel = bm.bracket.level;
                        resolvedBracket = bm.bracket;
                        resolvedSkill = bm.bestSkill;
                    }
                }
            } else {
                // Fallback: pick lowest bracket for this role
                const brackets = roleBrackets.get(bestRoleId) || [];
                resolvedBracket = brackets.length > 0 ? brackets[0] : null;
            }

            results.set(task.id, {
                job_role_id: bestRoleId,
                job_role_name: bestRd.role.name,
                job_role_display_name: bestRd.role.display_name,
                bracket_id: resolvedBracket?.id ?? null,
                bracket_name: resolvedBracket?.name ?? null,
                bracket_level: resolvedBracket?.level ?? null,
                hourly_rate: resolvedBracket ? Number(resolvedBracket.hourly_rate) : null,
                day_rate: resolvedBracket?.day_rate ? Number(resolvedBracket.day_rate) : null,
                resolved_skill: resolvedSkill,
            });
        }

        return results;
    }

    /**
     * Get all unique skill names currently in use across task_library + mappings
     */
    async getAvailableSkills(brandId?: number) {
        // Skills from task library
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

        // Skills from existing mappings
        const mappings = await this.prisma.skill_role_mappings.findMany({
            where: brandId
                ? { OR: [{ brand_id: brandId }, { brand_id: null }], is_active: true }
                : { is_active: true },
            select: { skill_name: true },
        });

        const mappedSkills = new Set(mappings.map(m => m.skill_name));

        // Merge and annotate
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

    // Get a summary view: which skills map to which roles, with bracket ranges
    async getMappingSummary(brandId?: number) {
        const mappings = await this.findAll({
            brandId,
            include_inactive: false,
        });

        // Group by skill
        const bySkill = new Map<string, Array<{ role: string; priority: number }>>();
        for (const m of mappings) {
            const skill = m.skill_name;
            if (!bySkill.has(skill)) bySkill.set(skill, []);
            bySkill.get(skill)!.push({
                role: m.job_role.display_name || m.job_role.name,
                priority: m.priority,
            });
        }

        // Group by role
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

    // ─── Helpers ───────────────────────────────────────────────

    /**
     * Find the lowest (entry-level) bracket for a role.
     * Used as fallback when no bracket-specific skill mappings match.
     */
    private async findLowestBracket(jobRoleId: number) {
        return this.prisma.payment_brackets.findFirst({
            where: { job_role_id: jobRoleId, is_active: true },
            orderBy: { level: 'asc' },
        });
    }

    private normalizeSkillName(name: string): string {
        // Normalize to consistent casing: "video editing" → "Video Editing"
        return name
            .trim()
            .split(/\s+/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }
}
