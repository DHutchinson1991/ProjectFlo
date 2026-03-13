import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTaskLibraryDto, UpdateTaskLibraryDto, TaskLibraryQueryDto, ProjectPhase, BatchUpdateTaskOrderDto, ExecuteAutoGenerationDto } from './dto/task-library.dto';
import { SkillRoleMappingsService, ResolvedRoleResult } from '../skill-role-mappings/skill-role-mappings.service';

export interface PreviewTaskRow {
    task_library_id: number;
    name: string;
    phase: string;
    trigger_type: string;
    effort_hours_each: number;
    multiplier: number;
    total_instances: number;
    total_hours: number;
    role_name: string | null;
    assigned_to_name: string | null;
    hourly_rate: number | null;
    estimated_cost: number | null;
}

@Injectable()
export class TaskLibraryService {
    constructor(
        private prisma: PrismaService,
        private skillRoleMappings: SkillRoleMappingsService,
    ) { }

    async create(createTaskLibraryDto: CreateTaskLibraryDto, userId: number) {
        // Check if user has access to the brand
        await this.checkBrandAccess(createTaskLibraryDto.brand_id, userId);

        return this.prisma.task_library.create({
            data: {
                ...createTaskLibraryDto,
                skills_needed: createTaskLibraryDto.skills_needed || [],
            },
            include: {
                brand: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                default_job_role: {
                    select: {
                        id: true,
                        name: true,
                        display_name: true,
                        category: true,
                    },
                },
            },
        });
    }

    async findAll(query: TaskLibraryQueryDto, userId: number) {
        const { phase, brandId, is_active, search } = query;

        // Get user's accessible brands
        const userBrands = await this.getUserBrands(userId);
        const accessibleBrandIds = userBrands.map(ub => ub.brand_id);

        // Filter by brandId if provided and user has access
        let brandFilter: { id: number } | { id: { in: number[] } } = { id: { in: accessibleBrandIds } };
        if (brandId) {
            // Ensure brandId is a number (query params come as strings)
            const brandIdNum = typeof brandId === 'string' ? parseInt(brandId, 10) : brandId;

            if (!accessibleBrandIds.includes(brandIdNum)) {
                throw new ForbiddenException('Access denied to this brand');
            }
            brandFilter = { id: brandIdNum };
        }

        const where: {
            brand: typeof brandFilter;
            phase?: ProjectPhase;
            is_active?: boolean;
            OR?: Array<{ name?: { contains: string; mode: 'insensitive' }; description?: { contains: string; mode: 'insensitive' } }>;
        } = {
            brand: brandFilter,
        };

        // Apply filters
        if (phase) {
            where.phase = phase;
        }

        if (is_active !== undefined) {
            where.is_active = is_active;
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }

        const tasks = await this.prisma.task_library.findMany({
            where,
            include: {
                brand: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                default_job_role: {
                    select: {
                        id: true,
                        name: true,
                        display_name: true,
                        category: true,
                    },
                },
                task_library_benchmarks: {
                    include: {
                        contributor: {
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
                },
                task_library_skill_rates: true,
            },
            orderBy: [
                { phase: 'asc' },
                { order_index: 'asc' },
                { name: 'asc' },
            ],
        });

        // Group by project phase
        const groupedTasks = tasks.reduce((acc, task) => {
            const phase = task.phase;
            if (!acc[phase]) {
                acc[phase] = [];
            }
            acc[phase].push(task);
            return acc;
        }, {} as Record<string, typeof tasks>);

        return {
            tasks,
            groupedByPhase: groupedTasks,
            phases: Object.values(ProjectPhase),
        };
    }

    async findOne(id: number, userId: number) {
        const task = await this.prisma.task_library.findUnique({
            where: { id },
            include: {
                brand: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                default_job_role: {
                    select: {
                        id: true,
                        name: true,
                        display_name: true,
                        category: true,
                    },
                },
                task_library_benchmarks: {
                    include: {
                        contributor: {
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
                },
                task_library_skill_rates: true,
            },
        });

        if (!task) {
            throw new NotFoundException(`Task with ID ${id} not found`);
        }

        // Check if user has access to this task's brand
        await this.checkBrandAccess(task.brand_id, userId);

        return task;
    }

    async update(id: number, updateTaskLibraryDto: UpdateTaskLibraryDto, userId: number) {
        // Verify user has access to this task
        await this.findOne(id, userId);

        return this.prisma.task_library.update({
            where: { id },
            data: updateTaskLibraryDto,
            include: {
                brand: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                default_job_role: {
                    select: {
                        id: true,
                        name: true,
                        display_name: true,
                        category: true,
                    },
                },
                task_library_benchmarks: {
                    include: {
                        contributor: {
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
                },
                task_library_skill_rates: true,
            },
        });
    }

    async remove(id: number, userId: number) {
        // Verify user has access to this task
        await this.findOne(id, userId);

        return this.prisma.task_library.delete({
            where: { id },
        });
    }

    async batchUpdateTaskOrder(batchUpdateDto: BatchUpdateTaskOrderDto, userId: number) {
        // Check if user has access to the brand
        await this.checkBrandAccess(batchUpdateDto.brand_id, userId);

        // Validate that all tasks belong to the specified phase and brand
        const taskIds = batchUpdateDto.tasks.map(t => t.id);
        const existingTasks = await this.prisma.task_library.findMany({
            where: {
                id: { in: taskIds },
                phase: batchUpdateDto.phase,
                brand_id: batchUpdateDto.brand_id,
            },
            select: { id: true },
        });

        if (existingTasks.length !== taskIds.length) {
            throw new ForbiddenException('Some tasks do not belong to the specified phase and brand');
        }

        // Perform batch update using transaction
        const updates = batchUpdateDto.tasks.map(task =>
            this.prisma.task_library.update({
                where: { id: task.id },
                data: { order_index: task.order_index },
            })
        );

        const updatedTasks = await this.prisma.$transaction(updates);

        return {
            message: 'Task order updated successfully',
            updatedCount: updatedTasks.length,
            tasks: updatedTasks,
        };
    }

    async getTasksByPhase(phase: ProjectPhase, brandId: number, userId: number) {
        // Check if user has access to the brand
        await this.checkBrandAccess(brandId, userId);

        return this.prisma.task_library.findMany({
            where: {
                phase,
                brand_id: brandId,
                is_active: true,
            },
            include: {
                brand: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                task_library_benchmarks: {
                    include: {
                        contributor: {
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
                },
                task_library_skill_rates: true,
            },
            orderBy: [
                { order_index: 'asc' },
                { name: 'asc' },
            ],
        });
    }

    async batchUpdateOrder(batchUpdateDto: BatchUpdateTaskOrderDto, userId: number) {
        console.log('🔍 BatchUpdateOrder Debug - Received DTO:', JSON.stringify(batchUpdateDto, null, 2));
        console.log('🔍 BatchUpdateOrder Debug - User ID:', userId);

        const { tasks, phase, brand_id } = batchUpdateDto;

        // Check if user has access to the brand
        await this.checkBrandAccess(brand_id, userId);

        // Validate that all tasks belong to the specified phase and brand
        const existingTasks = await this.prisma.task_library.findMany({
            where: {
                id: { in: tasks.map(t => t.id) },
                phase: phase,
                brand_id: brand_id,
            },
        });

        if (existingTasks.length !== tasks.length) {
            throw new NotFoundException('One or more tasks not found or do not belong to the specified phase and brand');
        }

        // Update the order_index for each task
        const updatePromises = tasks.map(task =>
            this.prisma.task_library.update({
                where: { id: task.id },
                data: { order_index: task.order_index },
            })
        );

        await Promise.all(updatePromises);

        return { success: true, message: 'Task order updated successfully' };
    }

    private async checkBrandAccess(brandId: number, userId: number) {
        // Check if user is a global admin first
        const contributor = await this.prisma.contributors.findUnique({
            where: { id: userId },
            include: {
                role: true,
            },
        });

        if (contributor?.role?.name === 'Global Admin') {
            return true; // Global admins have access to all brands
        }

        // For non-global admins, check user_brands table
        const userBrand = await this.prisma.user_brands.findFirst({
            where: {
                user_id: userId,
                brand_id: brandId,
                is_active: true,
            },
        });

        if (!userBrand) {
            throw new ForbiddenException('Access denied to this brand');
        }

        return userBrand;
    }

    private async getUserBrands(userId: number) {
        // Check if user is a global admin first
        const contributor = await this.prisma.contributors.findUnique({
            where: { id: userId },
            include: {
                role: true,
            },
        });

        if (contributor?.role?.name === 'Global Admin') {
            // Global admins have access to all brands
            const allBrands = await this.prisma.brands.findMany({
                where: { is_active: true },
                select: {
                    id: true,
                    name: true,
                },
            });
            return allBrands.map(brand => ({
                user_id: userId,
                brand_id: brand.id,
                brand: brand,
            }));
        }

        // For non-global admins, get from user_brands table
        return this.prisma.user_brands.findMany({
            where: {
                user_id: userId,
                is_active: true,
            },
            include: {
                brand: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
    }

    /**
     * Preview what tasks would be auto-generated for a given package.
     * Reads the brand's task library (with trigger types) and the package's
     * contents (films, event days, crew, locations, activities) to calculate
     * how many tasks of each type would be created.
     */
    async previewAutoGeneration(packageId: number, brandId: number, userId: number, inquiryId?: number) {
        await this.checkBrandAccess(brandId, userId);

        // When an inquiryId is provided, restrict film-related queries to only those
        // PackageFilm records that are still present on the inquiry (via ProjectFilm).
        let activePackageFilmIds: number[] | null = null;
        if (inquiryId) {
            const inquiryFilms = await this.prisma.projectFilm.findMany({
                where: { inquiry_id: inquiryId, package_film_id: { not: null } },
                select: { package_film_id: true },
            });
            activePackageFilmIds = inquiryFilms.map(f => f.package_film_id!);
        }

        const packageFilmWhere = activePackageFilmIds
            ? { package_id: packageId, id: { in: activePackageFilmIds } }
            : { package_id: packageId };

        // 1. Fetch package contents counts
        const [
            pkg,
            filmCount,
            eventDayCount,
            crewCount,
            locationCount,
            activityCount,
            activityCrewCount,
            filmSceneCount,
        ] = await Promise.all([
            this.prisma.service_packages.findUnique({
                where: { id: packageId },
                select: { id: true, name: true, brand_id: true },
            }),
            this.prisma.packageFilm.count({ where: packageFilmWhere }),
            this.prisma.packageEventDay.count({ where: { package_id: packageId } }),
            this.prisma.packageDayOperator.count({ where: { package_id: packageId } }),
            this.prisma.packageEventDayLocation.count({ where: { package_id: packageId } }),
            this.prisma.packageActivity.count({ where: { package_id: packageId } }),
            // Count activity×crew assignments for per_activity_crew trigger
            this.prisma.operatorActivityAssignment.count({
                where: {
                    package_activity: { package_id: packageId },
                },
            }),
            // Count film scenes across all films in this package for per_film_scene trigger
            this.prisma.packageFilmSceneSchedule.count({
                where: { package_film: packageFilmWhere },
            }),
        ]);

        if (!pkg) {
            throw new NotFoundException(`Package with ID ${packageId} not found`);
        }
        if (pkg.brand_id !== brandId) {
            throw new ForbiddenException('Package does not belong to this brand');
        }

        // 2. Fetch active task library entries for this brand (include role relation)
        const tasks = await this.prisma.task_library.findMany({
            where: {
                brand_id: brandId,
                is_active: true,
            },
            include: {
                default_job_role: { select: { id: true, name: true, display_name: true } },
            },
            orderBy: [
                { phase: 'asc' },
                { order_index: 'asc' },
            ],
        });

        // 2-role. Fetch crew operators for role→crew matching in preview
        const operators = await this.prisma.packageDayOperator.findMany({
            where: { package_id: packageId },
            include: {
                contributor: { include: { contact: { select: { first_name: true, last_name: true } } } },
                job_role: { select: { id: true, name: true, display_name: true } },
            },
            orderBy: { order_index: 'asc' },
        });

        // 2-role. Fetch contributor bracket levels for tier-aware assignment
        const opContributorIds = operators
            .filter(op => op.contributor_id)
            .map(op => op.contributor_id!);
        const contributorJobRolesPreview = opContributorIds.length > 0
            ? await this.prisma.contributor_job_roles.findMany({
                where: { contributor_id: { in: opContributorIds } },
                include: { payment_bracket: { select: { level: true } } },
            })
            : [];
        // Map "contributorId-roleId" → bracket level
        const contributorBracketMap = new Map<string, number>();
        for (const cjr of contributorJobRolesPreview) {
            if (cjr.payment_bracket_id && cjr.payment_bracket) {
                contributorBracketMap.set(`${cjr.contributor_id}-${cjr.job_role_id}`, cjr.payment_bracket.level);
            }
        }

        // 2-role. Build role→crew list (ALL operators per role, with bracket levels)
        interface PreviewCrewMember { name: string; bracketLevel: number; }
        const roleToCrewList = new Map<number, PreviewCrewMember[]>();
        for (const op of operators) {
            if (!op.job_role_id || !op.contributor) continue;
            const name = `${op.contributor.contact?.first_name || ''} ${op.contributor.contact?.last_name || ''}`.trim();
            if (!name) continue;
            const bracketLevel = contributorBracketMap.get(`${op.contributor_id}-${op.job_role_id}`) ?? 0;
            if (!roleToCrewList.has(op.job_role_id)) roleToCrewList.set(op.job_role_id, []);
            const list = roleToCrewList.get(op.job_role_id)!;
            // Avoid duplicates (same contributor on multiple event days)
            if (!list.some(c => c.name === name)) {
                list.push({ name, bracketLevel });
            }
        }
        // Sort each list by bracket level ascending (lowest tier first)
        for (const [, list] of roleToCrewList) {
            list.sort((a, b) => a.bracketLevel - b.bracketLevel);
        }

        // 2-role. Helper: pick crew member whose bracket level best matches the task's bracket
        // Lower-bracket tasks → lower-tier crew, higher-bracket tasks → higher-tier crew
        const pickPreviewCrew = (roleId: number, taskBracketLevel: number | null): { name: string | null; bracketLevel: number | null } => {
            const list = roleToCrewList.get(roleId);
            if (!list || list.length === 0) return { name: null, bracketLevel: null };
            if (list.length === 1) return { name: list[0].name, bracketLevel: list[0].bracketLevel };
            if (taskBracketLevel === null || taskBracketLevel <= 0) {
                return { name: list[0].name, bracketLevel: list[0].bracketLevel }; // No bracket info → assign to lowest-tier member
            }
            // Find closest bracket level match (prefer lower in ties)
            let best = list[0];
            let bestDist = Math.abs(list[0].bracketLevel - taskBracketLevel);
            for (const member of list) {
                const dist = Math.abs(member.bracketLevel - taskBracketLevel);
                if (dist < bestDist || (dist === bestDist && member.bracketLevel < best.bracketLevel)) {
                    best = member;
                    bestDist = dist;
                }
            }
            return { name: best.name, bracketLevel: best.bracketLevel };
        };

        // 2-role. Skill-to-role batch resolution for role inference
        const tasksWithSkills = tasks
            .filter(t => t.skills_needed && t.skills_needed.length > 0)
            .map(t => ({ id: t.id, skills_needed: t.skills_needed }));
        const resolvedRoles: Map<number, ResolvedRoleResult> =
            tasksWithSkills.length > 0
                ? await this.skillRoleMappings.batchResolve(tasksWithSkills, brandId)
                : new Map();

        // 2-rate. Fetch all payment brackets for hourly rate lookup
        const allRoleIds = new Set<number>();
        for (const t of tasks) { if (t.default_job_role_id) allRoleIds.add(t.default_job_role_id); }
        for (const [, r] of resolvedRoles) { if (r.job_role_id) allRoleIds.add(r.job_role_id); }
        const paymentBrackets = allRoleIds.size > 0
            ? await this.prisma.payment_brackets.findMany({
                where: { job_role_id: { in: Array.from(allRoleIds) }, is_active: true },
                select: { job_role_id: true, level: true, hourly_rate: true },
                orderBy: [{ job_role_id: 'asc' }, { level: 'asc' }],
            })
            : [];
        // Map "roleId-level" → hourly_rate  &  roleId → lowest-level fallback rate
        const bracketRateMap = new Map<string, number>();
        const roleFallbackRate = new Map<number, number>();
        for (const pb of paymentBrackets) {
            bracketRateMap.set(`${pb.job_role_id}-${pb.level}`, Number(pb.hourly_rate));
            if (!roleFallbackRate.has(pb.job_role_id)) {
                roleFallbackRate.set(pb.job_role_id, Number(pb.hourly_rate)); // first = lowest level
            }
        }

        // 2-role. Build job role name map for resolved roles
        const jobRoleNameMap = new Map<number, string>();
        for (const op of operators) {
            if (op.job_role && !jobRoleNameMap.has(op.job_role.id)) {
                jobRoleNameMap.set(op.job_role.id, op.job_role.display_name || op.job_role.name);
            }
        }
        for (const t of tasks) {
            if (t.default_job_role && !jobRoleNameMap.has(t.default_job_role.id)) {
                jobRoleNameMap.set(t.default_job_role.id, t.default_job_role.display_name || t.default_job_role.name);
            }
        }

        // Helper: resolve role_name, assigned_to_name, and hourly_rate for a task (tier-aware)
        const getPreviewAssignment = (task: typeof tasks[number]) => {
            const lookupRate = (roleId: number, bracketLevel: number | null): number | null => {
                if (bracketLevel !== null && bracketLevel > 0) {
                    const exact = bracketRateMap.get(`${roleId}-${bracketLevel}`);
                    if (exact !== undefined) return exact;
                }
                return roleFallbackRate.get(roleId) ?? null;
            };

            // Priority 1: explicit default_job_role_id
            const defaultRoleId = task.default_job_role_id;
            if (defaultRoleId) {
                const roleName = task.default_job_role?.display_name || task.default_job_role?.name
                    || jobRoleNameMap.get(defaultRoleId) || null;
                // Use resolved bracket level if available; tasks without bracket info go to lowest-tier
                const resolved = resolvedRoles.get(task.id);
                const taskBracketLevel = resolved?.bracket_level ?? null;
                const crew = pickPreviewCrew(defaultRoleId, taskBracketLevel);
                // Rate priority: assigned crew's bracket rate → skill-mapping resolved rate → role fallback → task's own rate
                // The crew member's actual bracket rate must take precedence so the preview
                // matches the crew-card cost calculation on the frontend.
                const hourly_rate = lookupRate(defaultRoleId, crew.bracketLevel)
                    ?? resolved?.hourly_rate
                    ?? (task.hourly_rate ? Number(task.hourly_rate) : null);
                return { role_name: roleName, assigned_to_name: crew.name, hourly_rate };
            }
            // Priority 2: resolved role from skill mappings (includes bracket level)
            const resolved = resolvedRoles.get(task.id);
            if (resolved?.job_role_id) {
                const roleName = jobRoleNameMap.get(resolved.job_role_id) || null;
                const crew = pickPreviewCrew(resolved.job_role_id, resolved.bracket_level);
                const hourly_rate = lookupRate(resolved.job_role_id, crew.bracketLevel)
                    ?? resolved?.hourly_rate
                    ?? (task.hourly_rate ? Number(task.hourly_rate) : null);
                return { role_name: roleName, assigned_to_name: crew.name, hourly_rate };
            }
            // Fallback: task's own hourly_rate if set
            const hourly_rate = task.hourly_rate ? Number(task.hourly_rate) : null;
            return { role_name: null, assigned_to_name: null, hourly_rate };
        };

        // 2b. For per_film_scene preview, fetch scene details with durations
        let filmSceneDetails: Array<{
            filmName: string;
            sceneName: string;
            durationMinutes: number | null;
        }> = [];

        if (tasks.some(t => t.trigger_type === 'per_film_scene')) {
            const schedules = await this.prisma.packageFilmSceneSchedule.findMany({
                where: { package_film: packageFilmWhere },
                include: {
                    package_film: { include: { film: { select: { name: true } } } },
                    scene: { select: { name: true, duration_seconds: true } },
                },
                orderBy: [
                    { package_film: { order_index: 'asc' } },
                    { order_index: 'asc' },
                ],
            });
            filmSceneDetails = schedules.map(s => ({
                filmName: s.package_film.film.name,
                sceneName: s.scene.name,
                durationMinutes: s.scheduled_duration_minutes
                    ?? (s.scene.duration_seconds ? s.scene.duration_seconds / 60 : null),
            }));
        }

        // 2c. For per_activity_crew preview, fetch actual assignment details
        //     so we can show realistic task names and per-activity durations
        let activityCrewDetails: Array<{
            activityName: string;
            durationMinutes: number | null;
            crewName: string;
            positionName: string;
        }> = [];

        if (tasks.some(t => t.trigger_type === 'per_activity_crew')) {
            const assignments = await this.prisma.operatorActivityAssignment.findMany({
                where: { package_activity: { package_id: packageId } },
                include: {
                    package_activity: { select: { name: true, duration_minutes: true } },
                    package_day_operator: {
                        select: {
                            position_name: true,
                            contributor: {
                                include: { contact: { select: { first_name: true, last_name: true } } },
                            },
                        },
                    },
                },
                orderBy: [
                    { package_activity: { order_index: 'asc' } },
                    { package_day_operator: { order_index: 'asc' } },
                ],
            });
            activityCrewDetails = assignments.map(a => {
                const op = a.package_day_operator;
                const crewName = op.contributor
                    ? `${op.contributor.contact?.first_name || ''} ${op.contributor.contact?.last_name || ''}`.trim()
                    : op.position_name;
                return {
                    activityName: a.package_activity.name,
                    durationMinutes: a.package_activity.duration_minutes,
                    crewName,
                    positionName: op.position_name,
                };
            });
        }

        // 2d. For per_film preview, fetch film names so we can expand into per-film rows
        let filmDetails: Array<{ filmName: string }> = [];

        if (tasks.some(t => t.trigger_type === 'per_film')) {
            const packageFilms = await this.prisma.packageFilm.findMany({
                where: packageFilmWhere,
                include: { film: { select: { name: true } } },
                orderBy: { order_index: 'asc' },
            });
            filmDetails = packageFilms.map(pf => ({
                filmName: pf.film.name,
            }));
        }

        // 2d-ii. For per_film_with_music / per_film_with_graphics, fetch film content details
        //        to filter films that actually have music or graphics in their scenes
        const filmsWithMusic: Array<{ filmName: string }> = [];
        const filmsWithGraphics: Array<{ filmName: string }> = [];

        if (tasks.some(t => t.trigger_type === 'per_film_with_music' || t.trigger_type === 'per_film_with_graphics')) {
            const packageFilms = await this.prisma.packageFilm.findMany({
                where: packageFilmWhere,
                include: {
                    film: {
                        select: {
                            id: true,
                            name: true,
                            scenes: {
                                select: {
                                    id: true,
                                    scene_music: { select: { id: true } },
                                    recording_setup: { select: { graphics_enabled: true } },
                                    moments: {
                                        select: {
                                            moment_music: { select: { id: true } },
                                            recording_setup: { select: { graphics_enabled: true } },
                                        },
                                    },
                                    beats: {
                                        select: {
                                            recording_setup: { select: { graphics_enabled: true } },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                orderBy: { order_index: 'asc' },
            });

            for (const pf of packageFilms) {
                const film = pf.film;
                // Check if any scene has music (SceneMusic or MomentMusic)
                const hasMusic = film.scenes.some(scene =>
                    scene.scene_music !== null ||
                    scene.moments.some(m => m.moment_music !== null)
                );
                if (hasMusic) {
                    filmsWithMusic.push({ filmName: film.name });
                }

                // Check if any scene/moment/beat has graphics enabled
                const hasGraphics = film.scenes.some(scene =>
                    scene.recording_setup?.graphics_enabled === true ||
                    scene.moments.some(m => m.recording_setup?.graphics_enabled === true) ||
                    scene.beats.some(b => b.recording_setup?.graphics_enabled === true)
                );
                if (hasGraphics) {
                    filmsWithGraphics.push({ filmName: film.name });
                }
            }
        }

        // 2e. For per_activity preview, fetch activity names
        let activityDetails: Array<{ activityName: string }> = [];

        if (tasks.some(t => t.trigger_type === 'per_activity')) {
            const packageActivities = await this.prisma.packageActivity.findMany({
                where: { package_id: packageId },
                select: { name: true },
                orderBy: { order_index: 'asc' },
            });
            activityDetails = packageActivities.map(a => ({
                activityName: a.name,
            }));
        }

        // 2f. For per_event_day preview, fetch event day names
        let eventDayDetails: Array<{ dayName: string }> = [];

        if (tasks.some(t => t.trigger_type === 'per_event_day')) {
            const packageEventDays = await this.prisma.packageEventDay.findMany({
                where: { package_id: packageId },
                include: { event_day: { select: { name: true } } },
                orderBy: { order_index: 'asc' },
            });
            eventDayDetails = packageEventDays.map((ed, i) => ({
                dayName: ed.event_day?.name || `Day ${i + 1}`,
            }));
        }

        // 3. Map trigger type → content count
        const triggerCounts: Record<string, number> = {
            always: 1,
            per_film: filmCount,
            per_film_with_music: filmsWithMusic.length,
            per_film_with_graphics: filmsWithGraphics.length,
            per_event_day: eventDayCount,
            per_crew_member: crewCount,
            per_location: locationCount,
            per_activity: activityCount,
            per_activity_crew: activityCrewCount,
            per_film_scene: filmSceneCount,
        };

        // 4. Build preview: for each task, calculate how many instances
        const generatedTasks = tasks.flatMap(task => {
            const multiplier = triggerCounts[task.trigger_type] ?? 1;
            const assignment = getPreviewAssignment(task);

            // Special handling for per_film_scene: expand into scene-level preview rows
            if (task.trigger_type === 'per_film_scene' && filmSceneDetails.length > 0) {
                const effortMultiplier = task.effort_hours ? Number(task.effort_hours) : 1;
                return filmSceneDetails.map(detail => {
                    const hours = detail.durationMinutes
                        ? (detail.durationMinutes / 60) * effortMultiplier
                        : effortMultiplier;
                    return {
                        task_library_id: task.id,
                        name: `${task.name} — ${detail.sceneName} (${detail.filmName})`,
                        phase: task.phase,
                        trigger_type: task.trigger_type,
                        effort_hours_each: Math.round(hours * 100) / 100,
                        multiplier: 1,
                        total_instances: 1,
                        total_hours: Math.round(hours * 100) / 100,
                        ...assignment,
                    };
                });
            }

            // Special handling for per_activity_crew: expand into individual preview rows
            if (task.trigger_type === 'per_activity_crew' && activityCrewDetails.length > 0) {
                return activityCrewDetails.map(detail => {
                    const hours = detail.durationMinutes
                        ? detail.durationMinutes / 60
                        : (task.effort_hours ? Number(task.effort_hours) : 0);
                    return {
                        task_library_id: task.id,
                        name: `${detail.activityName} — ${detail.crewName} (${detail.positionName})`,
                        phase: task.phase,
                        trigger_type: task.trigger_type,
                        effort_hours_each: Math.round(hours * 100) / 100,
                        multiplier: 1,
                        total_instances: 1,
                        total_hours: Math.round(hours * 100) / 100,
                        ...assignment,
                        assigned_to_name: detail.crewName as string | null,
                    };
                });
            }

            // Special handling for per_crew_member: expand into per-crew preview rows
            if (task.trigger_type === 'per_crew_member' && operators.length > 0) {
                const effortEach = task.effort_hours ? Number(task.effort_hours) : 0;
                return operators.map(op => {
                    const crewName = op.contributor
                        ? `${op.contributor.contact?.first_name || ''} ${op.contributor.contact?.last_name || ''}`.trim()
                        : op.position_name;
                    const opRoleName = op.job_role?.display_name || op.job_role?.name || null;
                    return {
                        task_library_id: task.id,
                        name: `${task.name} — ${crewName}`,
                        phase: task.phase,
                        trigger_type: task.trigger_type,
                        effort_hours_each: effortEach,
                        multiplier: 1,
                        total_instances: 1,
                        total_hours: effortEach,
                        role_name: opRoleName || assignment.role_name,
                        assigned_to_name: crewName as string | null,
                        hourly_rate: assignment.hourly_rate,
                    };
                });
            }

            // Special handling for per_film: expand into per-film preview rows
            if (task.trigger_type === 'per_film' && filmDetails.length > 0) {
                const effortEach = task.effort_hours ? Number(task.effort_hours) : 0;
                return filmDetails.map(detail => ({
                    task_library_id: task.id,
                    name: `${task.name} — ${detail.filmName}`,
                    phase: task.phase,
                    trigger_type: task.trigger_type,
                    effort_hours_each: effortEach,
                    multiplier: 1,
                    total_instances: 1,
                    total_hours: effortEach,
                    ...assignment,
                }));
            }

            // Special handling for per_film_with_music: expand into per-film rows
            // but ONLY for films that actually have music content (SceneMusic or MomentMusic)
            if (task.trigger_type === 'per_film_with_music' && filmsWithMusic.length > 0) {
                const effortEach = task.effort_hours ? Number(task.effort_hours) : 0;
                return filmsWithMusic.map(detail => ({
                    task_library_id: task.id,
                    name: `${task.name} — ${detail.filmName}`,
                    phase: task.phase,
                    trigger_type: task.trigger_type,
                    effort_hours_each: effortEach,
                    multiplier: 1,
                    total_instances: 1,
                    total_hours: effortEach,
                    ...assignment,
                }));
            }

            // Special handling for per_film_with_graphics: expand into per-film rows
            // but ONLY for films that have graphics enabled on any scene/moment/beat
            if (task.trigger_type === 'per_film_with_graphics' && filmsWithGraphics.length > 0) {
                const effortEach = task.effort_hours ? Number(task.effort_hours) : 0;
                return filmsWithGraphics.map(detail => ({
                    task_library_id: task.id,
                    name: `${task.name} — ${detail.filmName}`,
                    phase: task.phase,
                    trigger_type: task.trigger_type,
                    effort_hours_each: effortEach,
                    multiplier: 1,
                    total_instances: 1,
                    total_hours: effortEach,
                    ...assignment,
                }));
            }

            // Special handling for per_activity: expand into per-activity preview rows
            if (task.trigger_type === 'per_activity' && activityDetails.length > 0) {
                const effortEach = task.effort_hours ? Number(task.effort_hours) : 0;
                return activityDetails.map(detail => ({
                    task_library_id: task.id,
                    name: `${task.name} — ${detail.activityName}`,
                    phase: task.phase,
                    trigger_type: task.trigger_type,
                    effort_hours_each: effortEach,
                    multiplier: 1,
                    total_instances: 1,
                    total_hours: effortEach,
                    ...assignment,
                }));
            }

            // Special handling for per_event_day: expand per day × per crew member matching the role
            if (task.trigger_type === 'per_event_day' && eventDayDetails.length > 0) {
                const effortEach = task.effort_hours ? Number(task.effort_hours) : 0;
                const roleId = task.default_job_role_id;
                const crewForRole = roleId ? roleToCrewList.get(roleId) : null;

                if (crewForRole && crewForRole.length > 0) {
                    // Role-specific: one instance per event day × per crew member with that role
                    const lookupRate = (rId: number, bracketLevel: number | null): number | null => {
                        if (bracketLevel !== null && bracketLevel > 0) {
                            const exact = bracketRateMap.get(`${rId}-${bracketLevel}`);
                            if (exact !== undefined) return exact;
                        }
                        return roleFallbackRate.get(rId) ?? null;
                    };
                    return eventDayDetails.flatMap(day =>
                        crewForRole.map(crew => {
                            const rate = lookupRate(roleId!, crew.bracketLevel)
                                ?? (task.hourly_rate ? Number(task.hourly_rate) : null);
                            const label = eventDayDetails.length > 1
                                ? `${task.name} — ${crew.name} (${day.dayName})`
                                : `${task.name} — ${crew.name}`;
                            return {
                                task_library_id: task.id,
                                name: label,
                                phase: task.phase,
                                trigger_type: task.trigger_type,
                                effort_hours_each: effortEach,
                                multiplier: 1,
                                total_instances: 1,
                                total_hours: effortEach,
                                role_name: assignment.role_name,
                                assigned_to_name: crew.name as string | null,
                                hourly_rate: rate,
                            };
                        }),
                    );
                }

                // No role or no matching crew: simple per-day expansion
                return eventDayDetails.map(day => ({
                    task_library_id: task.id,
                    name: eventDayDetails.length > 1 ? `${task.name} — ${day.dayName}` : task.name,
                    phase: task.phase,
                    trigger_type: task.trigger_type,
                    effort_hours_each: effortEach,
                    multiplier: 1,
                    total_instances: 1,
                    total_hours: effortEach,
                    ...assignment,
                }));
            }

            return [{
                task_library_id: task.id,
                name: task.name,
                phase: task.phase,
                trigger_type: task.trigger_type,
                effort_hours_each: task.effort_hours ? Number(task.effort_hours) : 0,
                multiplier,
                total_instances: multiplier,
                total_hours: multiplier * (task.effort_hours ? Number(task.effort_hours) : 0),
                ...assignment,
            }];
        });

        // 5. Compute estimated_cost per task and group by phase (hourly_rate × total_hours)
        const tasksWithCost: PreviewTaskRow[] = generatedTasks.map(t => {
            const estimated_cost = (t.hourly_rate !== null && t.hourly_rate !== undefined && t.total_hours > 0)
                ? Math.round(t.hourly_rate * t.total_hours * 100) / 100
                : null;
            return { ...t, estimated_cost };
        });

        // Re-group with cost
        const byPhaseWithCost = tasksWithCost.reduce((acc, t) => {
            if (!acc[t.phase]) acc[t.phase] = [];
            acc[t.phase].push(t);
            return acc;
        }, {} as Record<string, typeof tasksWithCost>);

        const totalTasks = tasksWithCost.reduce((sum, t) => sum + t.total_instances, 0);
        const totalHours = tasksWithCost.reduce((sum, t) => sum + t.total_hours, 0);
        const totalCost = tasksWithCost.reduce((sum, t) => sum + (t.estimated_cost ?? 0), 0);

        return {
            package: { id: pkg.id, name: pkg.name },
            contentCounts: {
                films: filmCount,
                films_with_music: filmsWithMusic.length,
                films_with_graphics: filmsWithGraphics.length,
                event_days: eventDayCount,
                crew_members: crewCount,
                locations: locationCount,
                activities: activityCount,
                activity_crew_assignments: activityCrewCount,
                film_scenes: filmSceneCount,
            },
            summary: {
                total_library_tasks: tasks.length,
                total_generated_tasks: totalTasks,
                total_estimated_hours: Math.round(totalHours * 100) / 100,
                total_estimated_cost: Math.round(totalCost * 100) / 100,
            },
            byPhase: byPhaseWithCost,
            tasks: tasksWithCost,
        };
    }

    /**
     * Execute auto-generation: actually create project_tasks records
     * based on the package's content and the brand's task library.
     */
    async executeAutoGeneration(dto: ExecuteAutoGenerationDto, userId: number) {
        const { projectId, packageId, brandId } = dto;
        await this.checkBrandAccess(brandId, userId);

        // Verify project exists and belongs to this brand
        const project = await this.prisma.projects.findUnique({
            where: { id: projectId },
            select: { id: true, project_name: true, brand_id: true, wedding_date: true, booking_date: true },
        });
        if (!project) {
            throw new NotFoundException(`Project with ID ${projectId} not found`);
        }
        if (project.brand_id !== brandId) {
            throw new ForbiddenException('Project does not belong to this brand');
        }

        // Check if tasks have already been generated for this project+package
        const existingCount = await this.prisma.project_tasks.count({
            where: { project_id: projectId, package_id: packageId },
        });
        if (existingCount > 0) {
            throw new ConflictException(
                `Tasks have already been generated for this project from this package (${existingCount} tasks exist). Delete them first to regenerate.`,
            );
        }

        // Fetch package + verify
        const pkg = await this.prisma.service_packages.findUnique({
            where: { id: packageId },
            select: { id: true, name: true, brand_id: true },
        });
        if (!pkg) {
            throw new NotFoundException(`Package with ID ${packageId} not found`);
        }
        if (pkg.brand_id !== brandId) {
            throw new ForbiddenException('Package does not belong to this brand');
        }

        // Fetch package content with names for context labels
        const [films, eventDays, operators, locations, activities, activityCrewAssignments, filmSceneSchedules] = await Promise.all([
            this.prisma.packageFilm.findMany({
                where: { package_id: packageId },
                include: { film: { select: { id: true, name: true } } },
                orderBy: { order_index: 'asc' },
            }),
            this.prisma.packageEventDay.findMany({
                where: { package_id: packageId },
                include: { event_day: { select: { id: true, name: true } } },
                orderBy: { order_index: 'asc' },
            }),
            this.prisma.packageDayOperator.findMany({
                where: { package_id: packageId },
                include: {
                    contributor: { include: { contact: { select: { first_name: true, last_name: true } } } },
                },
                orderBy: { order_index: 'asc' },
            }),
            this.prisma.packageEventDayLocation.findMany({
                where: { package_id: packageId },
                include: { location: { select: { id: true, name: true } } },
                orderBy: { order_index: 'asc' },
            }),
            this.prisma.packageActivity.findMany({
                where: { package_id: packageId },
                select: { id: true, name: true },
                orderBy: { order_index: 'asc' },
            }),
            // Fetch activity×crew assignments with full details for per_activity_crew
            this.prisma.operatorActivityAssignment.findMany({
                where: { package_activity: { package_id: packageId } },
                include: {
                    package_activity: { select: { name: true, duration_minutes: true } },
                    package_day_operator: {
                        select: {
                            position_name: true,
                            contributor_id: true,
                            contributor: {
                                include: { contact: { select: { first_name: true, last_name: true } } },
                            },
                        },
                    },
                },
                orderBy: [
                    { package_activity: { order_index: 'asc' } },
                    { package_day_operator: { order_index: 'asc' } },
                ],
            }),
            // Fetch film scene schedules for per_film_scene trigger
            this.prisma.packageFilmSceneSchedule.findMany({
                where: { package_film: { package_id: packageId } },
                include: {
                    package_film: { include: { film: { select: { name: true } } } },
                    scene: { select: { name: true, duration_seconds: true } },
                },
                orderBy: [
                    { package_film: { order_index: 'asc' } },
                    { order_index: 'asc' },
                ],
            }),
        ]);

        // Build context label arrays per trigger type
        const contextLabels: Record<string, string[]> = {
            always: [''],
            per_film: films.map(f => `Film: ${f.film?.name || `Film #${f.film_id}`}`),
            per_event_day: eventDays.map(ed => `Event Day: ${ed.event_day?.name || `Day #${ed.event_day_template_id}`}`),
            per_crew_member: operators.map(op => {
                const name = op.contributor
                    ? `${op.contributor.contact?.first_name || ''} ${op.contributor.contact?.last_name || ''}`.trim()
                    : null;
                return `Crew: ${name || op.position_name}`;
            }),
            per_location: locations.map(loc => `Location: ${loc.location?.name || `Location #${loc.location_id}`}`),
            per_activity: activities.map(act => `Activity: ${act.name}`),
        };

        // For per_film_with_music / per_film_with_graphics, detect which films have content
        const filmsWithMusicExec: typeof films = [];
        const filmsWithGraphicsExec: typeof films = [];

        const needsContentDetection = await this.prisma.task_library.findFirst({
            where: {
                brand_id: brandId,
                is_active: true,
                trigger_type: { in: ['per_film_with_music', 'per_film_with_graphics'] },
            },
        });

        if (needsContentDetection && films.length > 0) {
            // Fetch scene content data for all package films
            const filmsWithContent = await this.prisma.packageFilm.findMany({
                where: { package_id: packageId },
                include: {
                    film: {
                        select: {
                            id: true,
                            name: true,
                            scenes: {
                                select: {
                                    id: true,
                                    scene_music: { select: { id: true } },
                                    recording_setup: { select: { graphics_enabled: true } },
                                    moments: {
                                        select: {
                                            moment_music: { select: { id: true } },
                                            recording_setup: { select: { graphics_enabled: true } },
                                        },
                                    },
                                    beats: {
                                        select: {
                                            recording_setup: { select: { graphics_enabled: true } },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                orderBy: { order_index: 'asc' },
            });

            for (const pf of filmsWithContent) {
                const film = pf.film;
                const hasMusic = film.scenes.some(scene =>
                    scene.scene_music !== null ||
                    scene.moments.some(m => m.moment_music !== null)
                );
                if (hasMusic) {
                    // Find matching entry from original films array to keep same structure
                    const original = films.find(f => f.film_id === film.id);
                    if (original) filmsWithMusicExec.push(original);
                }

                const hasGraphics = film.scenes.some(scene =>
                    scene.recording_setup?.graphics_enabled === true ||
                    scene.moments.some(m => m.recording_setup?.graphics_enabled === true) ||
                    scene.beats.some(b => b.recording_setup?.graphics_enabled === true)
                );
                if (hasGraphics) {
                    const original = films.find(f => f.film_id === film.id);
                    if (original) filmsWithGraphicsExec.push(original);
                }
            }
        }

        // Fetch active task library entries for this brand
        const libraryTasks = await this.prisma.task_library.findMany({
            where: { brand_id: brandId, is_active: true },
            orderBy: [{ phase: 'asc' }, { order_index: 'asc' }],
        });

        // ── Skill-to-Role batch resolution ──────────────────────────
        const tasksWithSkills = libraryTasks
            .filter(t => t.skills_needed && t.skills_needed.length > 0)
            .map(t => ({
                id: t.id,
                skills_needed: t.skills_needed,
            }));

        const resolvedRoles: Map<number, ResolvedRoleResult> =
            tasksWithSkills.length > 0
                ? await this.skillRoleMappings.batchResolve(tasksWithSkills, brandId)
                : new Map();

        // Fetch package task overrides
        const overrides = await this.prisma.packageTaskOverride.findMany({
            where: { package_id: packageId },
        });
        const overrideMap = new Map(
            overrides.filter(o => o.task_library_id).map(o => [o.task_library_id!, o]),
        );

        // ── Build role-to-crew list for tier-aware auto-assignment ────
        // Fetch each operator's bracket level from contributor_job_roles
        const execContributorIds = operators
            .filter(op => op.contributor_id)
            .map(op => op.contributor_id!);
        const contributorJobRolesExec = execContributorIds.length > 0
            ? await this.prisma.contributor_job_roles.findMany({
                where: { contributor_id: { in: execContributorIds } },
                include: { payment_bracket: { select: { level: true } } },
            })
            : [];
        const execBracketMap = new Map<string, number>(); // "contributorId-roleId" → level
        for (const cjr of contributorJobRolesExec) {
            if (cjr.payment_bracket_id && cjr.payment_bracket) {
                execBracketMap.set(`${cjr.contributor_id}-${cjr.job_role_id}`, cjr.payment_bracket.level);
            }
        }

        interface ExecCrewEntry { contributorId: number; bracketLevel: number; }
        const roleToCrewList = new Map<number, ExecCrewEntry[]>();
        for (const op of operators) {
            if (!op.job_role_id || !op.contributor_id) continue;
            const bracketLevel = execBracketMap.get(`${op.contributor_id}-${op.job_role_id}`) ?? 0;
            if (!roleToCrewList.has(op.job_role_id)) roleToCrewList.set(op.job_role_id, []);
            const list = roleToCrewList.get(op.job_role_id)!;
            if (!list.some(c => c.contributorId === op.contributor_id)) {
                list.push({ contributorId: op.contributor_id, bracketLevel });
            }
        }
        for (const [, list] of roleToCrewList) {
            list.sort((a, b) => a.bracketLevel - b.bracketLevel);
        }

        // Helper: pick the best crew member for a task's bracket level
        const pickCrewForBracket = (roleId: number, taskBracketLevel: number | null): number | null => {
            const list = roleToCrewList.get(roleId);
            if (!list || list.length === 0) return null;
            if (list.length === 1) return list[0].contributorId;
            if (taskBracketLevel === null || taskBracketLevel <= 0) {
                return list[0].contributorId; // No bracket info → lowest-tier
            }
            let best = list[0];
            let bestDist = Math.abs(list[0].bracketLevel - taskBracketLevel);
            for (const entry of list) {
                const dist = Math.abs(entry.bracketLevel - taskBracketLevel);
                if (dist < bestDist || (dist === bestDist && entry.bracketLevel < best.bracketLevel)) {
                    best = entry;
                    bestDist = dist;
                }
            }
            return best.contributorId;
        };

        // Build project task records
        const taskRecords: Array<{
            project_id: number;
            task_library_id: number;
            package_id: number;
            name: string;
            description: string | null;
            phase: typeof libraryTasks[number]['phase'];
            trigger_type: typeof libraryTasks[number]['trigger_type'];
            trigger_context: string | null;
            estimated_hours: typeof libraryTasks[number]['effort_hours'] | number;
            assigned_to_id?: number | null;
            pricing_type: typeof libraryTasks[number]['pricing_type'];
            fixed_price: typeof libraryTasks[number]['fixed_price'];
            hourly_rate: typeof libraryTasks[number]['hourly_rate'] | number;
            order_index: number;
            due_date?: Date | null;
            resolved_job_role_id?: number | null;
            resolved_bracket_id?: number | null;
            resolved_rate?: number | null;
            resolved_skill?: string | null;
        }> = [];

        // Helper: calculate due_date from task library offset
        const eventDate = project.wedding_date ? new Date(project.wedding_date) : null;
        const bookingDate = project.booking_date ? new Date(project.booking_date) : null;
        const calcDueDate = (task: typeof libraryTasks[number]): Date | null => {
            if (task.due_date_offset_days == null) return null;
            // Pre-event phases: offset from booking date or now
            // Production + later phases: offset from event date
            const productionPhases = ['Production', 'Post_Production', 'Delivery'];
            const refDate = productionPhases.includes(task.phase)
                ? (eventDate || bookingDate || new Date())
                : (bookingDate || new Date());
            const d = new Date(refDate);
            d.setDate(d.getDate() + task.due_date_offset_days);
            return d;
        };

        // Helper: get resolved role fields for a task library entry
        const getResolvedFields = (taskId: number) => {
            const r = resolvedRoles.get(taskId);
            if (!r) return {};
            return {
                resolved_job_role_id: r.job_role_id,
                resolved_bracket_id: r.bracket_id,
                resolved_rate: r.hourly_rate,
                resolved_skill: r.resolved_skill,
            };
        };

        // Helper: get effective hourly rate — bracket rate takes precedence if available
        const getEffectiveRate = (task: typeof libraryTasks[number]) => {
            const r = resolvedRoles.get(task.id);
            if (r?.hourly_rate) return r.hourly_rate;
            return task.hourly_rate;
        };

        let globalOrderIndex = 0;

        for (const task of libraryTasks) {
            // Check for package override
            const override = overrideMap.get(task.id);
            if (override?.action === 'exclude') {
                continue; // Skip excluded tasks
            }

            // Apply override name/hours early so special handlers can use them
            const effectiveName = override?.override_name || task.name;
            const effectiveHours = override?.override_hours ?? task.effort_hours;

            // Special handling for per_film_scene:
            // Generate one editing task per film scene using scene duration × effort multiplier
            if (task.trigger_type === 'per_film_scene') {
                const effortMultiplier = task.effort_hours ? Number(task.effort_hours) : 1;
                for (const schedule of filmSceneSchedules) {
                    const filmName = schedule.package_film.film.name;
                    const sceneName = schedule.scene.name;
                    const durationMinutes = schedule.scheduled_duration_minutes
                        ?? (schedule.scene.duration_seconds ? schedule.scene.duration_seconds / 60 : null);
                    const hours = durationMinutes
                        ? (durationMinutes / 60) * effortMultiplier
                        : effortMultiplier;

                    taskRecords.push({
                        project_id: projectId,
                        task_library_id: task.id,
                        package_id: packageId,
                        name: `${effectiveName} — ${sceneName} (${filmName})`,
                        description: task.description,
                        phase: override?.phase || task.phase,
                        trigger_type: task.trigger_type,
                        trigger_context: `${sceneName} (${filmName})`,
                        estimated_hours: Math.round(hours * 100) / 100,
                        pricing_type: task.pricing_type,
                        fixed_price: task.fixed_price,
                        hourly_rate: getEffectiveRate(task),
                        order_index: globalOrderIndex++,
                        ...getResolvedFields(task.id),
                    });
                }
                continue;
            }

            // Special handling for per_activity_crew:
            // Generate one task per activity×crew assignment using real names & durations
            if (task.trigger_type === 'per_activity_crew') {
                for (const assignment of activityCrewAssignments) {
                    const op = assignment.package_day_operator;
                    const crewName = op.contributor
                        ? `${op.contributor.contact?.first_name || ''} ${op.contributor.contact?.last_name || ''}`.trim()
                        : op.position_name;
                    const activityName = assignment.package_activity.name;
                    const durationHours = assignment.package_activity.duration_minutes
                        ? assignment.package_activity.duration_minutes / 60
                        : (task.effort_hours ? Number(task.effort_hours) : 0);

                    taskRecords.push({
                        project_id: projectId,
                        task_library_id: task.id,
                        package_id: packageId,
                        name: `${activityName} — ${crewName} (${op.position_name})`,
                        description: task.description,
                        phase: override?.phase || task.phase,
                        trigger_type: task.trigger_type,
                        trigger_context: `${activityName} — ${crewName} (${op.position_name})`,
                        estimated_hours: durationHours,
                        assigned_to_id: op.contributor_id || null,
                        pricing_type: task.pricing_type,
                        fixed_price: task.fixed_price,
                        hourly_rate: getEffectiveRate(task),
                        order_index: globalOrderIndex++,
                        ...getResolvedFields(task.id),
                    });
                }
                continue;
            }

            // Special handling for per_film:
            // Generate one task per film with clean naming (e.g. "Title Cards — Wedding Film")
            if (task.trigger_type === 'per_film') {
                const effortEach = effectiveHours ? Number(effectiveHours) : 0;
                for (const f of films) {
                    const filmName = f.film?.name || `Film #${f.film_id}`;
                    taskRecords.push({
                        project_id: projectId,
                        task_library_id: task.id,
                        package_id: packageId,
                        name: `${effectiveName} — ${filmName}`,
                        description: task.description,
                        phase: override?.phase || task.phase,
                        trigger_type: task.trigger_type,
                        trigger_context: filmName,
                        estimated_hours: effortEach,
                        pricing_type: task.pricing_type,
                        fixed_price: task.fixed_price,
                        hourly_rate: getEffectiveRate(task),
                        order_index: globalOrderIndex++,
                        ...getResolvedFields(task.id),
                    });
                }
                continue;
            }

            // Special handling for per_film_with_music:
            // Only generate tasks for films that actually have scene or moment music
            if (task.trigger_type === 'per_film_with_music') {
                const effortEach = effectiveHours ? Number(effectiveHours) : 0;
                for (const f of filmsWithMusicExec) {
                    const filmName = f.film?.name || `Film #${f.film_id}`;
                    taskRecords.push({
                        project_id: projectId,
                        task_library_id: task.id,
                        package_id: packageId,
                        name: `${effectiveName} — ${filmName}`,
                        description: task.description,
                        phase: override?.phase || task.phase,
                        trigger_type: task.trigger_type,
                        trigger_context: filmName,
                        estimated_hours: effortEach,
                        pricing_type: task.pricing_type,
                        fixed_price: task.fixed_price,
                        hourly_rate: getEffectiveRate(task),
                        order_index: globalOrderIndex++,
                        ...getResolvedFields(task.id),
                    });
                }
                continue;
            }

            // Special handling for per_film_with_graphics:
            // Only generate tasks for films that have graphics enabled on any scene/moment/beat
            if (task.trigger_type === 'per_film_with_graphics') {
                const effortEach = effectiveHours ? Number(effectiveHours) : 0;
                for (const f of filmsWithGraphicsExec) {
                    const filmName = f.film?.name || `Film #${f.film_id}`;
                    taskRecords.push({
                        project_id: projectId,
                        task_library_id: task.id,
                        package_id: packageId,
                        name: `${effectiveName} — ${filmName}`,
                        description: task.description,
                        phase: override?.phase || task.phase,
                        trigger_type: task.trigger_type,
                        trigger_context: filmName,
                        estimated_hours: effortEach,
                        pricing_type: task.pricing_type,
                        fixed_price: task.fixed_price,
                        hourly_rate: getEffectiveRate(task),
                        order_index: globalOrderIndex++,
                        ...getResolvedFields(task.id),
                    });
                }
                continue;
            }

            // Special handling for per_activity:
            // Generate one task per activity with clean naming (e.g. "Footage Review — Ceremony")
            if (task.trigger_type === 'per_activity') {
                const effortEach = effectiveHours ? Number(effectiveHours) : 0;
                for (const act of activities) {
                    taskRecords.push({
                        project_id: projectId,
                        task_library_id: task.id,
                        package_id: packageId,
                        name: `${effectiveName} — ${act.name}`,
                        description: task.description,
                        phase: override?.phase || task.phase,
                        trigger_type: task.trigger_type,
                        trigger_context: act.name,
                        estimated_hours: effortEach,
                        pricing_type: task.pricing_type,
                        fixed_price: task.fixed_price,
                        hourly_rate: getEffectiveRate(task),
                        order_index: globalOrderIndex++,
                        ...getResolvedFields(task.id),
                    });
                }
                continue;
            }

            // Special handling for per_event_day with a role:
            // Expand per event day × per crew member matching the task's role
            if (task.trigger_type === 'per_event_day' && task.default_job_role_id) {
                const effortEach = effectiveHours ? Number(effectiveHours) : 0;
                const crewForRole = roleToCrewList.get(task.default_job_role_id);

                if (crewForRole && crewForRole.length > 0) {
                    for (const ed of eventDays) {
                        const dayName = ed.event_day?.name || `Day #${ed.event_day_template_id}`;
                        for (const crew of crewForRole) {
                            // Find the operator record to get crew name
                            const op = operators.find(o => o.contributor_id === crew.contributorId);
                            const crewName = op?.contributor
                                ? `${op.contributor.contact?.first_name || ''} ${op.contributor.contact?.last_name || ''}`.trim()
                                : `Crew #${crew.contributorId}`;
                            const label = eventDays.length > 1
                                ? `${effectiveName} — ${crewName} (${dayName})`
                                : `${effectiveName} — ${crewName}`;
                            taskRecords.push({
                                project_id: projectId,
                                task_library_id: task.id,
                                package_id: packageId,
                                name: label,
                                description: task.description,
                                phase: override?.phase || task.phase,
                                trigger_type: task.trigger_type,
                                trigger_context: eventDays.length > 1
                                    ? `${crewName} (${dayName})`
                                    : crewName,
                                estimated_hours: effortEach,
                                assigned_to_id: crew.contributorId,
                                pricing_type: task.pricing_type,
                                fixed_price: task.fixed_price,
                                hourly_rate: getEffectiveRate(task),
                                order_index: globalOrderIndex++,
                                ...getResolvedFields(task.id),
                            });
                        }
                    }
                    continue;
                }
                // Fall through to default handling if no crew matches the role
            }

            // Special handling for per_crew_member:
            // Generate one task per crew member, auto-assigned to each
            if (task.trigger_type === 'per_crew_member') {
                const effortEach = effectiveHours ? Number(effectiveHours) : 0;
                for (const op of operators) {
                    const crewName = op.contributor
                        ? `${op.contributor.contact?.first_name || ''} ${op.contributor.contact?.last_name || ''}`.trim()
                        : op.position_name;
                    taskRecords.push({
                        project_id: projectId,
                        task_library_id: task.id,
                        package_id: packageId,
                        name: `${effectiveName} — ${crewName}`,
                        description: task.description,
                        phase: override?.phase || task.phase,
                        trigger_type: task.trigger_type,
                        trigger_context: `Crew: ${crewName}`,
                        estimated_hours: effortEach,
                        assigned_to_id: op.contributor_id || null,
                        pricing_type: task.pricing_type,
                        fixed_price: task.fixed_price,
                        hourly_rate: getEffectiveRate(task),
                        order_index: globalOrderIndex++,
                        ...getResolvedFields(task.id),
                    });
                }
                continue;
            }

            const labels = contextLabels[task.trigger_type] || [''];

            for (const label of labels) {
                const contextSuffix = label && task.trigger_type !== 'always'
                    ? ` — ${label}`
                    : '';

                taskRecords.push({
                    project_id: projectId,
                    task_library_id: task.id,
                    package_id: packageId,
                    name: `${effectiveName}${contextSuffix}`,
                    description: task.description,
                    phase: override?.phase || task.phase,
                    trigger_type: task.trigger_type,
                    trigger_context: label || null,
                    estimated_hours: effectiveHours,
                    pricing_type: task.pricing_type,
                    fixed_price: task.fixed_price,
                    hourly_rate: getEffectiveRate(task),
                    order_index: globalOrderIndex++,
                    ...getResolvedFields(task.id),
                });
            }
        }

        // ── Calculate due dates for all records from task library offsets ──
        for (const record of taskRecords) {
            const libraryTask = libraryTasks.find(t => t.id === record.task_library_id);
            if (libraryTask) {
                record.due_date = calcDueDate(libraryTask);
            }
        }

        // ── Auto-assign tasks to crew based on role + bracket tier matching ──
        // Lower-bracket tasks → lower-tier crew, higher-bracket tasks → higher-tier crew
        for (const record of taskRecords) {
            if (record.assigned_to_id) continue; // Already assigned (e.g., per_activity_crew, per_crew_member)

            const libraryTask = libraryTasks.find(t => t.id === record.task_library_id);
            // Get bracket level from resolved roles (available for both default_job_role and skill-resolved)
            const resolved = resolvedRoles.get(record.task_library_id);
            const taskBracketLevel = resolved?.bracket_level ?? null;

            // Priority 1: task's explicit default_job_role_id
            const defaultRoleId = libraryTask?.default_job_role_id;
            if (defaultRoleId) {
                const crewId = pickCrewForBracket(defaultRoleId, taskBracketLevel);
                if (crewId) {
                    record.assigned_to_id = crewId;
                    continue;
                }
            }
            // Priority 2: resolved role from skill-to-role mappings
            if (record.resolved_job_role_id) {
                const crewId = pickCrewForBracket(record.resolved_job_role_id, taskBracketLevel);
                if (crewId) {
                    record.assigned_to_id = crewId;
                }
            }
        }

        // Bulk create in a transaction
        const created = await this.prisma.$transaction(
            taskRecords.map(record =>
                this.prisma.project_tasks.create({
                    data: record,
                    include: {
                        assigned_to: {
                            select: {
                                id: true,
                                contact: { select: { first_name: true, last_name: true } },
                            },
                        },
                    },
                }),
            ),
        );

        // Summarize
        const totalHours = created.reduce(
            (sum, t) => sum + (t.estimated_hours ? Number(t.estimated_hours) : 0),
            0,
        );

        // Group created tasks by phase for the response
        const byPhase = created.reduce((acc, t) => {
            const phase = t.phase;
            if (!acc[phase]) acc[phase] = [];
            acc[phase].push(t);
            return acc;
        }, {} as Record<string, typeof created>);

        return {
            success: true,
            project: { id: project.id, name: project.project_name },
            package: { id: pkg.id, name: pkg.name },
            summary: {
                total_tasks_created: created.length,
                total_estimated_hours: Math.round(totalHours * 100) / 100,
                phases_covered: Object.keys(byPhase).length,
                tasks_with_resolved_roles: created.filter(t => t.resolved_job_role_id).length,
                tasks_with_resolved_brackets: created.filter(t => t.resolved_bracket_id).length,
                tasks_auto_assigned: created.filter(t => t.assigned_to_id).length,
            },
            byPhase,
            tasks: created,
        };
    }
}
