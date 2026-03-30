import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { roundMoney } from '@finance/shared/pricing.utils';
import { SkillRoleMappingsResolverService } from '../../../catalog/skill-role-mappings/services/skill-role-mappings-resolver.service';
import { ResolvedRoleResult } from '../../../catalog/skill-role-mappings/types/resolver.types';
import { buildBracketMap, buildExecRoleCrewMap, buildRateMaps, lookupRate, detectFilmsWithContent, PreviewRoleCrewMap, PreviewCrew } from '../utils/task-library-gen.functions';
import { TaskLibraryAccessService } from './task-library-access.service';

export interface PreviewTaskRow {
    task_library_id: number; name: string; phase: string; trigger_type: string;
    effort_hours_each: number; multiplier: number; total_instances: number; total_hours: number;
    role_name: string | null; assigned_to_name: string | null; hourly_rate: number | null;
    estimated_cost: number | null; film_name?: string | null; due_date_offset_days?: number | null;
    is_on_site?: boolean | null;
    /** Deduplication key for on-site billing (activityName for per_activity_crew tasks). */
    activity_key?: string | null;
    /** On-site billing band label (e.g. 'Half Day', 'Day', 'Day + OT'). */
    onsite_band?: string | null;
}

interface CrewSlotRow {
    crew_id: number | null;
    job_role_id: number | null;
    order_index: number | null;
    label: string | null;
    crew: { contact: { first_name: string | null; last_name: string | null } | null } | null;
    job_role: { id: number; name: string; display_name: string | null } | null;
}

interface ActivityAssignment {
    jobRoleId?: number | null;
    crewId?: number | null;
    activityName: string;
    durationMinutes: number | null;
    crewName: string;
    label: string;
    roleName: string | null;
}

@Injectable()
export class TaskLibraryPreviewService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly skillRoleMappings: SkillRoleMappingsResolverService,
        private readonly access: TaskLibraryAccessService,
    ) {}

    async previewAutoGeneration(packageId: number, brandId: number, userId: number, inquiryId?: number, projectId?: number) {
        await this.access.checkBrandAccess(brandId, userId);
        return this._core(packageId, brandId, inquiryId, projectId);
    }

    previewAutoGenerationForSystem(packageId: number, brandId: number, inquiryId?: number, projectId?: number) {
        return this._core(packageId, brandId, inquiryId, projectId);
    }

    private async _core(packageId: number, brandId: number, inquiryId?: number, projectId?: number) {
        const pkg = await this.prisma.service_packages.findUnique({ where: { id: packageId }, select: { id: true, name: true, brand_id: true, contents: true } });
        if (!pkg) throw new NotFoundException(`Package with ID ${packageId} not found`);
        if (pkg.brand_id !== brandId) throw new ForbiddenException('Package does not belong to this brand');

        let activePackageFilmIds: number[] | null = null;
        if (inquiryId) {
            const iFilms = await this.prisma.projectFilm.findMany({ where: { inquiry_id: inquiryId, package_film_id: { not: null } }, select: { package_film_id: true } });
            activePackageFilmIds = iFilms.map(f => f.package_film_id!);
        }
        const contentsItems: Array<{ type: string; config?: { package_film_id?: number } }> = (pkg.contents as { items?: Array<{ type: string; config?: { package_film_id?: number } }> })?.items ?? [];
        const contentsFilmIds = contentsItems.filter(i => i.type === 'film' && i.config?.package_film_id).map(i => i.config!.package_film_id as number);
        const filmWhere = activePackageFilmIds ? { package_id: packageId, id: { in: activePackageFilmIds } } : (contentsFilmIds.length > 0 ? { package_id: packageId, id: { in: contentsFilmIds } } : { package_id: packageId });

        const instWhere = projectId ? { project_id: projectId } : inquiryId ? { inquiry_id: inquiryId } : null;
        const [filmCount, eventDayCount, crewCount, locationCount, activityCount, activityCrewCount, filmSceneCount, financeSettings] = await Promise.all([
            this.prisma.packageFilm.count({ where: filmWhere }),
            this.prisma.packageEventDay.count({ where: { package_id: packageId } }),
            instWhere ? this.prisma.projectCrewSlot.count({ where: instWhere }) : this.prisma.packageCrewSlot.count({ where: { package_id: packageId } }),
            this.prisma.packageEventDayLocation.count({ where: { package_id: packageId } }),
            this.prisma.packageActivity.count({ where: { package_id: packageId } }),
            this.prisma.packageCrewSlotActivity.count({ where: { package_activity: { package_id: packageId } } }),
            this.prisma.packageFilmSceneSchedule.count({ where: { package_film: filmWhere } }),
            this.prisma.brand_finance_settings.findFirst({ where: { brand_id: brandId }, select: { onsite_half_day_max_hours: true, onsite_full_day_max_hours: true } }),
        ]);

        const tasks = await this.prisma.task_library.findMany({ where: { brand_id: brandId, is_active: true }, include: { default_job_role: { select: { id: true, name: true, display_name: true } } }, orderBy: [{ phase: 'asc' }, { order_index: 'asc' }] });
        const opInclude = { crew: { include: { contact: { select: { first_name: true, last_name: true } } } }, job_role: { select: { id: true, name: true, display_name: true } } } as const;
        let crewSlots: CrewSlotRow[];
        if (instWhere) {
            const inst = await this.prisma.projectCrewSlot.findMany({ where: instWhere, include: opInclude, orderBy: { order_index: 'asc' } });
            crewSlots = inst.length > 0 ? inst : await this.prisma.packageCrewSlot.findMany({ where: { package_id: packageId }, include: opInclude, orderBy: { order_index: 'asc' } });
        } else {
            crewSlots = await this.prisma.packageCrewSlot.findMany({ where: { package_id: packageId }, include: opInclude, orderBy: { order_index: 'asc' } });
        }

        const opCrewIds = crewSlots.filter(o => o.crew_id).map(o => o.crew_id!);
        const cjrRows = opCrewIds.length > 0 ? await this.prisma.crewJobRole.findMany({ where: { crew_id: { in: opCrewIds } }, include: { payment_bracket: { select: { level: true } } } }) : [];
        const bracketMap = buildBracketMap(cjrRows);
        const validAssignments = new Set(cjrRows.map(r => `${r.crew_id}-${r.job_role_id}`));
        const execMap = buildExecRoleCrewMap(crewSlots, bracketMap, validAssignments);
        const previewCrewMap: PreviewRoleCrewMap = new Map();
        for (const op of crewSlots) {
            if (!op.job_role_id || !op.crew || !validAssignments.has(`${op.crew_id}-${op.job_role_id}`)) continue;
            const name = `${op.crew.contact?.first_name || ''} ${op.crew.contact?.last_name || ''}`.trim(); if (!name) continue;
            const bl = bracketMap.get(`${op.crew_id}-${op.job_role_id}`) ?? 0;
            if (!previewCrewMap.has(op.job_role_id)) previewCrewMap.set(op.job_role_id, []);
            const list = previewCrewMap.get(op.job_role_id)!;
            if (!list.some(c => c.name === name)) list.push({ name, bracketLevel: bl });
        }
        for (const [, list] of previewCrewMap) list.sort((a, b) => a.bracketLevel - b.bracketLevel);

        const tsWithSkills = tasks.filter(t => t.skills_needed?.length).map(t => ({ id: t.id, skills_needed: t.skills_needed }));
        const resolvedRoles: Map<number, ResolvedRoleResult> = tsWithSkills.length > 0 ? await this.skillRoleMappings.batchResolve(tsWithSkills, brandId) : new Map();
        const allRoleIds = new Set<number>([...tasks.map(t => t.default_job_role_id).filter(Boolean) as number[], ...[...resolvedRoles.values()].map(r => r.job_role_id).filter(Boolean) as number[]]);
        const brackets = allRoleIds.size > 0 ? await this.prisma.payment_brackets.findMany({ where: { job_role_id: { in: [...allRoleIds] }, is_active: true }, select: { job_role_id: true, level: true, hourly_rate: true, day_rate: true, half_day_rate: true, overtime_rate: true }, orderBy: [{ job_role_id: 'asc' }, { level: 'asc' }] }) : [];
        const { bracketRateMap, roleFallbackRate } = buildRateMaps(brackets);
        const jobRoleNameMap = new Map<number, string>();
        for (const op of crewSlots) { if (op.job_role && !jobRoleNameMap.has(op.job_role.id)) jobRoleNameMap.set(op.job_role.id, op.job_role.display_name || op.job_role.name); }
        for (const t of tasks) { if (t.default_job_role && !jobRoleNameMap.has(t.default_job_role.id)) jobRoleNameMap.set(t.default_job_role.id, t.default_job_role.display_name || t.default_job_role.name); }

        const needsMusicGraphics = tasks.some(t => t.trigger_type === 'per_film_with_music' || t.trigger_type === 'per_film_with_graphics');
        const [filmSceneDetails, activityCrewDetails, filmDetails, activityDetails, eventDayDetails] = await Promise.all([
            tasks.some(t => t.trigger_type === 'per_film_scene') ? this.prisma.packageFilmSceneSchedule.findMany({ where: { package_film: filmWhere }, include: { package_film: { include: { film: { select: { name: true } } } }, scene: { select: { name: true, duration_seconds: true } } }, orderBy: [{ package_film: { order_index: 'asc' } }, { order_index: 'asc' }] }) : Promise.resolve([]),
            tasks.some(t => t.trigger_type === 'per_activity_crew') ? this.prisma.packageCrewSlotActivity.findMany({ where: { package_activity: { package_id: packageId } }, include: { package_activity: { select: { name: true, duration_minutes: true } }, package_crew_slot: { select: { label: true, crew_id: true, job_role_id: true, crew: { include: { contact: { select: { first_name: true, last_name: true } } } }, job_role: { select: { name: true, display_name: true } } } } }, orderBy: [{ package_activity: { order_index: 'asc' } }, { package_crew_slot: { order_index: 'asc' } }] }) : Promise.resolve([]),
            tasks.some(t => t.trigger_type === 'per_film') ? this.prisma.packageFilm.findMany({ where: filmWhere, include: { film: { select: { name: true } } }, orderBy: { order_index: 'asc' } }) : Promise.resolve([]),
            tasks.some(t => t.trigger_type === 'per_activity') ? this.prisma.packageActivity.findMany({ where: { package_id: packageId }, select: { name: true }, orderBy: { order_index: 'asc' } }) : Promise.resolve([]),
            tasks.some(t => t.trigger_type === 'per_event_day') ? this.prisma.packageEventDay.findMany({ where: { package_id: packageId }, include: { event_day: { select: { name: true } } }, orderBy: { order_index: 'asc' } }) : Promise.resolve([]),
        ]);
        const filmsContentRaw = needsMusicGraphics ? await this.prisma.packageFilm.findMany({ where: filmWhere, include: { film: { select: { name: true, scenes: { select: { scene_music: { select: { id: true } }, recording_setup: { select: { graphics_enabled: true } }, moments: { select: { moment_music: { select: { id: true } }, recording_setup: { select: { graphics_enabled: true } } } }, beats: { select: { recording_setup: { select: { graphics_enabled: true } } } } } } } } }, orderBy: { order_index: 'asc' } }) : [];

        const filmSceneDetailsM = filmSceneDetails.map(s => ({ filmName: s.package_film.film.name, sceneName: s.scene.name, durationMinutes: s.scheduled_duration_minutes ?? (s.scene.duration_seconds ? s.scene.duration_seconds / 60 : null) }));
        const filmsWithMusicPrev = filmsContentRaw.filter(pf => pf.film.scenes.some((sc: { scene_music: unknown; moments: Array<{ moment_music: unknown }> }) => sc.scene_music !== null || sc.moments.some((m: { moment_music: unknown }) => m.moment_music !== null))).map(pf => ({ filmName: pf.film.name }));
        const filmsWithGraphicsPrev = filmsContentRaw.filter(pf => { const f = detectFilmsWithContent([{ name: pf.film.name, scenes: pf.film.scenes as Parameters<typeof detectFilmsWithContent>[0][0]['scenes'] }]); return f.withGraphics.length > 0; }).map(pf => ({ filmName: pf.film.name }));
        const filmDetailsPrev = filmDetails.map(f => ({ filmName: f.film.name }));
        const activityDetailsPrev = activityDetails.map(a => ({ activityName: a.name }));
        const eventDayDetailsPrev = eventDayDetails.map((ed, i) => ({ dayName: ed.event_day?.name || `Day ${i + 1}` }));
        const activityCrewMapped: ActivityAssignment[] = activityCrewDetails.map(d => ({
            jobRoleId: d.package_crew_slot.job_role_id,
            crewId: d.package_crew_slot.crew_id,
            activityName: d.package_activity.name,
            durationMinutes: d.package_activity.duration_minutes,
            crewName: d.package_crew_slot.crew
                ? `${d.package_crew_slot.crew.contact?.first_name || ''} ${d.package_crew_slot.crew.contact?.last_name || ''}`.trim()
                : d.package_crew_slot.label ?? d.package_crew_slot.job_role?.display_name ?? d.package_crew_slot.job_role?.name ?? 'Unknown',
            label: d.package_crew_slot.label ?? d.package_crew_slot.job_role?.display_name ?? d.package_crew_slot.job_role?.name ?? 'Unknown',
            roleName: d.package_crew_slot.job_role?.display_name || d.package_crew_slot.job_role?.name || null,
        }));

        const pickPreviewCrew = (roleId: number, taskBracketLevel: number | null): { name: string | null; bracketLevel: number | null } => {
            const list = previewCrewMap.get(roleId); if (!list?.length) return { name: null, bracketLevel: null };
            if (list.length === 1) return { name: list[0].name, bracketLevel: list[0].bracketLevel };
            if (!taskBracketLevel || taskBracketLevel <= 0) return { name: list[0].name, bracketLevel: list[0].bracketLevel };
            let best: PreviewCrew = list[0], bestDist = Math.abs(list[0].bracketLevel - taskBracketLevel);
            for (const m of list) { const d = Math.abs(m.bracketLevel - taskBracketLevel); if (d < bestDist || (d === bestDist && m.bracketLevel < best.bracketLevel)) { best = m; bestDist = d; } }
            return { name: best.name, bracketLevel: best.bracketLevel };
        };
        const getAssignment = (task: typeof tasks[number]) => {
            const roleId = task.default_job_role_id; const resolved = resolvedRoles.get(task.id);
            const bl = resolved?.bracket_level ?? null;
            if (roleId) { const roleName = task.default_job_role?.display_name || task.default_job_role?.name || jobRoleNameMap.get(roleId) || null; const crew = pickPreviewCrew(roleId, bl); return { role_name: roleName, assigned_to_name: crew.name, hourly_rate: lookupRate(bracketRateMap, roleFallbackRate, roleId, crew.bracketLevel) ?? resolved?.hourly_rate ?? (task.hourly_rate ? Number(task.hourly_rate) : null) }; }
            if (resolved?.job_role_id) { const crew = pickPreviewCrew(resolved.job_role_id, bl); return { role_name: jobRoleNameMap.get(resolved.job_role_id) || null, assigned_to_name: crew.name, hourly_rate: lookupRate(bracketRateMap, roleFallbackRate, resolved.job_role_id, crew.bracketLevel) ?? resolved?.hourly_rate ?? (task.hourly_rate ? Number(task.hourly_rate) : null) }; }
            return { role_name: null, assigned_to_name: null, hourly_rate: task.hourly_rate ? Number(task.hourly_rate) : null };
        };

        const triggerCounts: Record<string, number> = { always: 1, per_film: filmCount, per_film_with_music: filmsWithMusicPrev.length, per_film_with_graphics: filmsWithGraphicsPrev.length, per_event_day: eventDayCount, per_crew: crewCount, per_location: locationCount, per_activity: activityCount, per_activity_crew: activityCrewCount, per_film_scene: filmSceneCount };
        const offsetDaysMap = new Map(tasks.map(t => [t.id, t.due_date_offset_days ?? null]));
        const generatedTasks = tasks.flatMap(task => {
            const multiplier = triggerCounts[task.trigger_type] ?? 1; const a = getAssignment(task);
            if (task.trigger_type === 'per_film_scene') return this._expandFilmScene(task, filmSceneDetailsM, a);
            if (task.trigger_type === 'per_activity_crew') return this._expandActivityCrew(task, activityCrewMapped, a, validAssignments, pickPreviewCrew, bracketRateMap, roleFallbackRate);
            if (task.trigger_type === 'per_crew') return crewSlots.filter(op => validAssignments.has(`${op.crew_id}-${op.job_role_id}`) || !op.crew_id).map(op => { const n = op.crew ? `${op.crew.contact?.first_name || ''} ${op.crew.contact?.last_name || ''}`.trim() : (op.label ?? op.job_role?.display_name ?? op.job_role?.name ?? 'Unknown'); return { task_library_id: task.id, name: `${task.name} — ${n}`, phase: task.phase, trigger_type: task.trigger_type, effort_hours_each: task.effort_hours ? Number(task.effort_hours) : 0, multiplier: 1, total_instances: 1, total_hours: task.effort_hours ? Number(task.effort_hours) : 0, role_name: op.job_role?.display_name || op.job_role?.name || a.role_name, assigned_to_name: n as string | null, hourly_rate: a.hourly_rate }; });
            if (task.trigger_type === 'per_film') return filmDetailsPrev.map(d => ({ task_library_id: task.id, name: `${task.name} — ${d.filmName}`, phase: task.phase, trigger_type: task.trigger_type, effort_hours_each: task.effort_hours ? Number(task.effort_hours) : 0, multiplier: 1, total_instances: 1, total_hours: task.effort_hours ? Number(task.effort_hours) : 0, film_name: d.filmName, ...a }));
            if (task.trigger_type === 'per_film_with_music') return filmsWithMusicPrev.map(d => ({ task_library_id: task.id, name: `${task.name} — ${d.filmName}`, phase: task.phase, trigger_type: task.trigger_type, effort_hours_each: task.effort_hours ? Number(task.effort_hours) : 0, multiplier: 1, total_instances: 1, total_hours: task.effort_hours ? Number(task.effort_hours) : 0, film_name: d.filmName, ...a }));
            if (task.trigger_type === 'per_film_with_graphics') return filmsWithGraphicsPrev.map(d => ({ task_library_id: task.id, name: `${task.name} — ${d.filmName}`, phase: task.phase, trigger_type: task.trigger_type, effort_hours_each: task.effort_hours ? Number(task.effort_hours) : 0, multiplier: 1, total_instances: 1, total_hours: task.effort_hours ? Number(task.effort_hours) : 0, film_name: d.filmName, ...a }));
            if (task.trigger_type === 'per_activity') return activityDetailsPrev.map(d => ({ task_library_id: task.id, name: `${task.name} — ${d.activityName}`, phase: task.phase, trigger_type: task.trigger_type, effort_hours_each: task.effort_hours ? Number(task.effort_hours) : 0, multiplier: 1, total_instances: 1, total_hours: task.effort_hours ? Number(task.effort_hours) : 0, ...a }));
            if (task.trigger_type === 'per_event_day') return this._expandEventDay(task, eventDayDetailsPrev, previewCrewMap, bracketRateMap, roleFallbackRate, a);
            return [{ task_library_id: task.id, name: task.name, phase: task.phase, trigger_type: task.trigger_type, effort_hours_each: task.effort_hours ? Number(task.effort_hours) : 0, multiplier, total_instances: multiplier, total_hours: multiplier * (task.effort_hours ? Number(task.effort_hours) : 0), ...a }];
        });

        const taskIsOnSiteMap = new Map(tasks.map(t => [t.id, t.is_on_site ?? false]));
        const tasksWithCost: PreviewTaskRow[] = generatedTasks.filter(t => t.total_instances > 0).map(t => {
            const isOnSite = taskIsOnSiteMap.get(t.task_library_id) ?? false;
            const activityKey = isOnSite && t.trigger_type === 'per_activity_crew'
                ? (t.name.split(' — ')[0] ?? null)
                : null;
            return {
                ...t,
                is_on_site: isOnSite,
                activity_key: activityKey,
                estimated_cost: (t.hourly_rate !== null && t.hourly_rate !== undefined && t.total_hours > 0) ? roundMoney(t.hourly_rate * t.total_hours) : null,
                due_date_offset_days: offsetDaysMap.get(t.task_library_id) ?? null,
            };
        });

        // ── On-site band-based cost override ─────────────────────────────
        // Aggregate on-site hours per person (deduped by activity_key) then
        // replace per-task hourly costs with the correct band rate (½ Day / Day / Day+OT).
        // Only the first on-site task for each person carries the cost; the rest are zeroed.
        const onsiteHalfMax = financeSettings?.onsite_half_day_max_hours ?? 6;
        const onsiteFullMax = financeSettings?.onsite_full_day_max_hours ?? 12;
        // Build day-rate lookup: "roleId-level" → { dayRate, halfDayRate, overtimeRate }
        const dayRateLookup = new Map<string, { dayRate: number; halfDayRate: number; overtimeRate: number }>();
        for (const b of brackets) {
            dayRateLookup.set(`${b.job_role_id}-${b.level}`, {
                dayRate: Number(b.day_rate || 0),
                halfDayRate: Number(b.half_day_rate || 0) || Number(b.day_rate || 0) / 2,
                overtimeRate: Number(b.overtime_rate || 0),
            });
        }
        // Build person→bracketLevel map from previewCrewMap
        const personBracketMap = new Map<string, { roleId: number; bracketLevel: number }>();
        for (const [roleId, list] of previewCrewMap) {
            for (const c of list) {
                if (c.name && !personBracketMap.has(c.name)) {
                    personBracketMap.set(c.name, { roleId, bracketLevel: c.bracketLevel });
                }
            }
        }
        // Aggregate on-site hours per person (same logic as frontend buildOnsiteHoursMap)
        const NON_DELIVERY_PHASES = new Set(['Lead', 'Inquiry', 'Booking']);
        const onsitePerPerson = new Map<string, Map<string, number>>();
        for (const t of tasksWithCost) {
            if (!t.is_on_site || !t.assigned_to_name || !t.role_name) continue;
            if (NON_DELIVERY_PHASES.has(t.phase)) continue;
            const personKey = t.assigned_to_name;
            if (!onsitePerPerson.has(personKey)) onsitePerPerson.set(personKey, new Map());
            const actMap = onsitePerPerson.get(personKey)!;
            const dedupeKey = t.activity_key ?? `__task_${t.role_name}_${t.name}`;
            if (!actMap.has(dedupeKey)) actMap.set(dedupeKey, t.total_hours);
        }
        const onsiteHoursMap = new Map<string, number>();
        for (const [person, actMap] of onsitePerPerson) {
            onsiteHoursMap.set(person, Array.from(actMap.values()).reduce((s, h) => s + h, 0));
        }
        // Apply band cost: first on-site task per person gets the full band cost; rest get 0
        const onsiteCostCharged = new Set<string>();
        for (const t of tasksWithCost) {
            if (!t.is_on_site || !t.assigned_to_name) continue;
            const person = t.assigned_to_name;
            const totalOnsiteHours = onsiteHoursMap.get(person) ?? 0;
            if (totalOnsiteHours <= 0) continue;
            if (onsiteCostCharged.has(person)) {
                t.estimated_cost = 0;
                continue;
            }
            const info = personBracketMap.get(person);
            if (!info) continue;
            const rates = dayRateLookup.get(`${info.roleId}-${info.bracketLevel}`);
            if (!rates || rates.dayRate === 0) continue;
            let bandCost: number;
            let bandLabel: string;
            if (totalOnsiteHours < onsiteHalfMax) {
                bandCost = rates.halfDayRate;
                bandLabel = 'Half Day';
            } else if (totalOnsiteHours < onsiteFullMax) {
                bandCost = rates.dayRate;
                bandLabel = 'Day';
            } else {
                const overage = totalOnsiteHours - onsiteFullMax;
                bandCost = rates.dayRate + rates.overtimeRate * overage;
                bandLabel = 'Day + OT';
            }
            t.estimated_cost = roundMoney(bandCost);
            t.onsite_band = bandLabel;
            onsiteCostCharged.add(person);
        }

        const byPhase = tasksWithCost.reduce((acc, t) => { if (!acc[t.phase]) acc[t.phase] = []; acc[t.phase].push(t); return acc; }, {} as Record<string, typeof tasksWithCost>);
        return { package: { id: pkg.id, name: pkg.name }, contentCounts: { films: filmCount, films_with_music: filmsWithMusicPrev.length, films_with_graphics: filmsWithGraphicsPrev.length, event_days: eventDayCount, crews: crewCount, locations: locationCount, activities: activityCount, activity_crew_assignments: activityCrewCount, film_scenes: filmSceneCount }, summary: { total_library_tasks: tasks.length, total_generated_tasks: tasksWithCost.reduce((s, t) => s + t.total_instances, 0), total_estimated_hours: roundMoney(tasksWithCost.reduce((s, t) => s + t.total_hours, 0)), total_estimated_cost: roundMoney(tasksWithCost.reduce((s, t) => s + (t.estimated_cost ?? 0), 0)) }, byPhase, tasks: tasksWithCost };
    }

    private _expandFilmScene(task: { id: number; name: string; phase: string; trigger_type: string; effort_hours: unknown }, scenes: Array<{ filmName: string; sceneName: string; durationMinutes: number | null }>, a: { role_name: string | null; assigned_to_name: string | null; hourly_rate: number | null }) {
        const em = task.effort_hours ? Number(task.effort_hours) : 1;
        return scenes.map(d => { const h = d.durationMinutes ? (d.durationMinutes / 60) * em : em; return { task_library_id: task.id, name: `${task.name} — ${d.sceneName} (${d.filmName})`, phase: task.phase, trigger_type: task.trigger_type, effort_hours_each: roundMoney(h), multiplier: 1, total_instances: 1, total_hours: roundMoney(h), film_name: d.filmName, ...a }; });
    }

     
    private _expandActivityCrew(task: { id: number; name: string; phase: string; trigger_type: string; effort_hours: unknown; default_job_role?: { id: number } | null }, assignments: ActivityAssignment[], a: { role_name: string | null; assigned_to_name: string | null; hourly_rate: number | null }, validAssignments: Set<string>, pickPreviewCrew: (roleId: number, bl: number | null) => { name: string | null; bracketLevel: number | null }, bracketRateMap: Map<string, number>, roleFallbackRate: Map<number, number>) {
        const relevant = task.default_job_role?.id ? assignments.filter((d) => d.jobRoleId === task.default_job_role!.id) : assignments;
        return relevant.filter((d) => !d.crewId || !d.jobRoleId || validAssignments.has(`${d.crewId}-${d.jobRoleId}`)).map((d) => {
            const h = d.durationMinutes ? d.durationMinutes / 60 : (task.effort_hours ? Number(task.effort_hours) : 0);
            const instCrew = d.jobRoleId ? pickPreviewCrew(d.jobRoleId, null) : null;
            const displayName = instCrew?.name ?? d.crewName;
            const rate = d.jobRoleId ? (lookupRate(bracketRateMap, roleFallbackRate, d.jobRoleId, instCrew?.bracketLevel ?? null) ?? a.hourly_rate) : a.hourly_rate;
            return { task_library_id: task.id, name: `${d.activityName} — ${displayName} (${d.label})`, phase: task.phase, trigger_type: task.trigger_type, effort_hours_each: roundMoney(h), multiplier: 1, total_instances: 1, total_hours: roundMoney(h), ...a, assigned_to_name: displayName as string | null, role_name: d.roleName ?? a.role_name, hourly_rate: rate };
        });
    }

    private _expandEventDay(task: { id: number; name: string; phase: string; trigger_type: string; effort_hours: unknown; default_job_role_id?: number | null }, days: Array<{ dayName: string }>, previewCrewMap: PreviewRoleCrewMap, bracketRateMap: Map<string, number>, roleFallbackRate: Map<number, number>, a: { role_name: string | null; assigned_to_name: string | null; hourly_rate: number | null }) {
        const e = task.effort_hours ? Number(task.effort_hours) : 0; const roleId = task.default_job_role_id;
        const crew = roleId ? previewCrewMap.get(roleId) : null;
        if (crew?.length) return days.flatMap(day => crew.map(c => { const rate = lookupRate(bracketRateMap, roleFallbackRate, roleId!, c.bracketLevel) ?? (task.effort_hours ? Number(task.effort_hours) : null); const label = days.length > 1 ? `${task.name} — ${c.name} (${day.dayName})` : `${task.name} — ${c.name}`; return { task_library_id: task.id, name: label, phase: task.phase, trigger_type: task.trigger_type, effort_hours_each: e, multiplier: 1, total_instances: 1, total_hours: e, role_name: a.role_name, assigned_to_name: c.name as string | null, hourly_rate: rate }; }));
        return days.map(day => ({ task_library_id: task.id, name: days.length > 1 ? `${task.name} — ${day.dayName}` : task.name, phase: task.phase, trigger_type: task.trigger_type, effort_hours_each: e, multiplier: 1, total_instances: 1, total_hours: e, ...a }));
    }
}
