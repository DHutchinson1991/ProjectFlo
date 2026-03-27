import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { CreateSkillRoleMappingDto } from './dto/create-skill-role-mapping.dto';
import { UpdateSkillRoleMappingDto } from './dto/update-skill-role-mapping.dto';
import { BulkCreateSkillRoleMappingDto } from './dto/bulk-create-skill-role-mapping.dto';
import { SkillRoleMappingQueryDto } from './dto/skill-role-mapping-query.dto';

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

    private normalizeSkillName(name: string): string {
        return name
            .trim()
            .split(/\s+/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }
}
