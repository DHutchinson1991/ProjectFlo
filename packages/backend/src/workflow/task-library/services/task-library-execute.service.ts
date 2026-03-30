import { Injectable, NotFoundException, ForbiddenException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { roundMoney } from '@finance/shared/pricing.utils';
import { SkillRoleMappingsResolverService } from '../../../catalog/skill-role-mappings/services/skill-role-mappings-resolver.service';
import { ResolvedRoleResult } from '../../../catalog/skill-role-mappings/types/resolver.types';
import { ExecuteAutoGenerationDto } from '../dto/task-library.dto';
import { buildBracketMap, buildExecRoleCrewMap, pickCrewForBracket, detectFilmsWithContent, ExecRoleCrewMap } from '../utils/task-library-gen.functions';
import { TaskLibraryAccessService } from './task-library-access.service';

type LibraryTask = Awaited<ReturnType<PrismaService['task_library']['findMany']>>[0];
type TaskRecord = { project_id: number; task_library_id: number; package_id: number; name: string; description: string | null; phase: LibraryTask['phase']; trigger_type: LibraryTask['trigger_type']; trigger_context: string | null; estimated_hours: number | LibraryTask['effort_hours']; assigned_to_id?: number | null; pricing_type: LibraryTask['pricing_type']; fixed_price: LibraryTask['fixed_price']; hourly_rate: number | LibraryTask['hourly_rate']; order_index: number; due_date?: Date | null; resolved_job_role_id?: number | null; resolved_bracket_id?: number | null; resolved_rate?: number | null; resolved_skill?: string | null; };

@Injectable()
export class TaskLibraryExecuteService {
    private readonly logger = new Logger(TaskLibraryExecuteService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly skillRoleMappings: SkillRoleMappingsResolverService,
        private readonly access: TaskLibraryAccessService,
    ) {}

    async executeAutoGeneration(dto: ExecuteAutoGenerationDto, userId: number) {
        const { projectId, packageId, brandId } = dto;
        await this.access.checkBrandAccess(brandId, userId);

        const [project, pkg] = await Promise.all([
            this.prisma.projects.findUnique({ where: { id: projectId }, select: { id: true, project_name: true, brand_id: true, wedding_date: true, booking_date: true, delivery_date: true } }),
            this.prisma.service_packages.findUnique({ where: { id: packageId }, select: { id: true, name: true, brand_id: true } }),
        ]);
        if (!project) throw new NotFoundException(`Project with ID ${projectId} not found`);
        if (project.brand_id !== brandId) throw new ForbiddenException('Project does not belong to this brand');
        if (!pkg) throw new NotFoundException(`Package with ID ${packageId} not found`);
        if (pkg.brand_id !== brandId) throw new ForbiddenException('Package does not belong to this brand');

        const existingCount = await this.prisma.project_tasks.count({ where: { project_id: projectId, package_id: packageId } });
        if (existingCount > 0) throw new ConflictException(`Tasks have already been generated for this project from this package (${existingCount} tasks exist). Delete them first to regenerate.`);

        const [films, eventDays, crewSlots, locations, activities, activityCrewAssignments, filmSceneSchedules] = await Promise.all([
            this.prisma.packageFilm.findMany({ where: { package_id: packageId }, include: { film: { select: { id: true, name: true } } }, orderBy: { order_index: 'asc' } }),
            this.prisma.packageEventDay.findMany({ where: { package_id: packageId }, include: { event_day: { select: { id: true, name: true } } }, orderBy: { order_index: 'asc' } }),
            this.prisma.packageCrewSlot.findMany({ where: { package_id: packageId }, include: { crew: { include: { contact: { select: { first_name: true, last_name: true } } } } }, orderBy: { order_index: 'asc' } }),
            this.prisma.packageEventDayLocation.findMany({ where: { package_id: packageId }, include: { location: { select: { id: true, name: true } } }, orderBy: { order_index: 'asc' } }),
            this.prisma.packageActivity.findMany({ where: { package_id: packageId }, select: { id: true, name: true }, orderBy: { order_index: 'asc' } }),
            this.prisma.packageCrewSlotActivity.findMany({ where: { package_activity: { package_id: packageId } }, include: { package_activity: { select: { name: true, duration_minutes: true } }, package_crew_slot: { select: { label: true, crew_id: true, job_role_id: true, crew: { include: { contact: { select: { first_name: true, last_name: true } } } } } } }, orderBy: [{ package_activity: { order_index: 'asc' } }, { package_crew_slot: { order_index: 'asc' } }] }),
            this.prisma.packageFilmSceneSchedule.findMany({ where: { package_film: { package_id: packageId } }, include: { package_film: { include: { film: { select: { name: true } } } }, scene: { select: { name: true, duration_seconds: true } } }, orderBy: [{ package_film: { order_index: 'asc' } }, { order_index: 'asc' }] }),
        ]);

        const opCrewIds = crewSlots.filter(o => o.crew_id).map(o => o.crew_id!);
        const cjrRows = opCrewIds.length > 0 ? await this.prisma.crewJobRole.findMany({ where: { crew_id: { in: opCrewIds } }, include: { payment_bracket: { select: { level: true } } } }) : [];
        const bracketMap = buildBracketMap(cjrRows);
        const validAssignments = new Set(cjrRows.map(r => `${r.crew_id}-${r.job_role_id}`));
        const roleCrewMap = buildExecRoleCrewMap(crewSlots, bracketMap, validAssignments);
        const hasValid = (cId: number | null | undefined, rId: number | null | undefined) => !cId || !rId || validAssignments.has(`${cId}-${rId}`);

        const libraryTasks = await this.prisma.task_library.findMany({ where: { brand_id: brandId, is_active: true }, orderBy: [{ phase: 'asc' }, { order_index: 'asc' }] });
        const tsWithSkills = libraryTasks.filter(t => t.skills_needed?.length).map(t => ({ id: t.id, skills_needed: t.skills_needed }));
        const resolvedRoles: Map<number, ResolvedRoleResult> = tsWithSkills.length > 0 ? await this.skillRoleMappings.batchResolve(tsWithSkills, brandId) : new Map();
        const overrides = await this.prisma.packageTaskOverride.findMany({ where: { package_id: packageId } });
        const overrideMap = new Map(overrides.filter(o => o.task_library_id).map(o => [o.task_library_id!, o]));

        const filmsForContent = await this._needsContentDetect(brandId) ? await this.prisma.packageFilm.findMany({ where: { package_id: packageId }, include: { film: { select: { id: true, name: true, scenes: { select: { scene_music: { select: { id: true } }, recording_setup: { select: { graphics_enabled: true } }, moments: { select: { moment_music: { select: { id: true } }, recording_setup: { select: { graphics_enabled: true } } } }, beats: { select: { recording_setup: { select: { graphics_enabled: true } } } } } } } } }, orderBy: { order_index: 'asc' } }) : [];
        const { withMusic: musicNames, withGraphics: graphicNames } = detectFilmsWithContent(filmsForContent.map(pf => ({ ...pf.film, name: pf.film.name })));
        const filmsWithMusicExec = films.filter(f => musicNames.includes(f.film?.name ?? ''));
        const filmsWithGraphicsExec = films.filter(f => graphicNames.includes(f.film?.name ?? ''));

        const contextLabels: Record<string, string[]> = {
            always: [''],
            per_film: films.map(f => `Film: ${f.film?.name || `Film #${f.film_id}`}`),
            per_event_day: eventDays.map(ed => `Event Day: ${ed.event_day?.name || `Day #${ed.event_day_template_id}`}`),
            per_crew: crewSlots.map(op => { const n = op.crew ? `${op.crew.contact?.first_name || ''} ${op.crew.contact?.last_name || ''}`.trim() : null; return `Crew: ${n || op.label || 'Unknown'}`; }),
            per_location: locations.map(loc => `Location: ${loc.location?.name || `Location #${loc.location_id}`}`),
            per_activity: activities.map(act => `Activity: ${act.name}`),
        };

        const eventDate = project.wedding_date ? new Date(project.wedding_date) : null;
        const bookingDate = project.booking_date ? new Date(project.booking_date) : null;
        const deliveryDate = project.delivery_date ? new Date(project.delivery_date) : null;
        const calcDueDate = (task: LibraryTask): Date | null => {
            if (task.due_date_offset_days == null) return null;
            let ref: Date | null;
            switch (task.due_date_offset_reference) {
                case 'booking_date':    ref = bookingDate ?? eventDate; break;
                case 'event_date':      ref = eventDate ?? bookingDate; break;
                case 'delivery_date':   ref = deliveryDate ?? eventDate ?? bookingDate; break;
                case 'inquiry_created':
                default:                ref = bookingDate ?? eventDate; break;
            }
            if (!ref) ref = new Date();
            const d = new Date(ref); d.setDate(d.getDate() + task.due_date_offset_days); return d;
        };
        const getResolved = (id: number) => { const r = resolvedRoles.get(id); if (!r) return {}; return { resolved_job_role_id: r.job_role_id, resolved_bracket_id: r.bracket_id, resolved_rate: r.hourly_rate, resolved_skill: r.resolved_skill }; };
        const getRate = (task: LibraryTask) => { const r = resolvedRoles.get(task.id); return r?.hourly_rate ?? task.hourly_rate; };

        const taskRecords: TaskRecord[] = [];
        let idx = 0;
        const base = (task: LibraryTask, ov: { phase?: unknown; override_name?: string | null } | undefined, name: string, context: string | null, hours: number | LibraryTask['effort_hours'], assigned?: number | null): TaskRecord => ({ project_id: projectId, task_library_id: task.id, package_id: packageId, name, description: task.description, phase: (ov?.phase ?? task.phase) as LibraryTask['phase'], trigger_type: task.trigger_type, trigger_context: context, estimated_hours: hours, assigned_to_id: assigned, pricing_type: task.pricing_type, fixed_price: task.fixed_price, hourly_rate: getRate(task), order_index: idx++, ...getResolved(task.id) });

        for (const task of libraryTasks) {
            const ov = overrideMap.get(task.id); if (ov?.action === 'exclude') continue;
            const effectiveName = ov?.override_name || task.name; const effectiveHours = ov?.override_hours ?? task.effort_hours;
            if (task.trigger_type === 'per_film_scene') { for (const s of filmSceneSchedules) { const fm = s.package_film.film.name; const sn = s.scene.name; const dur = s.scheduled_duration_minutes ?? (s.scene.duration_seconds ? s.scene.duration_seconds / 60 : null); const h = dur ? (dur / 60) * (task.effort_hours ? Number(task.effort_hours) : 1) : (task.effort_hours ? Number(task.effort_hours) : 1); taskRecords.push(base(task, ov, `${effectiveName} — ${sn} (${fm})`, `${sn} (${fm})`, roundMoney(h))); } continue; }
            if (task.trigger_type === 'per_activity_crew') { for (const a of activityCrewAssignments) { const op = a.package_crew_slot; if (!hasValid(op.crew_id, op.job_role_id)) continue; if (task.default_job_role_id && op.job_role_id !== task.default_job_role_id) continue; const n = op.crew ? `${op.crew.contact?.first_name || ''} ${op.crew.contact?.last_name || ''}`.trim() : (op.label || 'Unknown'); const h = a.package_activity.duration_minutes ? a.package_activity.duration_minutes / 60 : (task.effort_hours ? Number(task.effort_hours) : 0); taskRecords.push(base(task, ov, `${a.package_activity.name} — ${n}`, `${a.package_activity.name} — ${n}`, h, op.crew_id || null)); } continue; }
            if (task.trigger_type === 'per_film') { const e = effectiveHours ? Number(effectiveHours) : 0; for (const f of films) { const fn = f.film?.name || `Film #${f.film_id}`; taskRecords.push(base(task, ov, `${effectiveName} — ${fn}`, fn, e)); } continue; }
            if (task.trigger_type === 'per_film_with_music') { const e = effectiveHours ? Number(effectiveHours) : 0; for (const f of filmsWithMusicExec) { const fn = f.film?.name || `Film #${f.film_id}`; taskRecords.push(base(task, ov, `${effectiveName} — ${fn}`, fn, e)); } continue; }
            if (task.trigger_type === 'per_film_with_graphics') { const e = effectiveHours ? Number(effectiveHours) : 0; for (const f of filmsWithGraphicsExec) { const fn = f.film?.name || `Film #${f.film_id}`; taskRecords.push(base(task, ov, `${effectiveName} — ${fn}`, fn, e)); } continue; }
            if (task.trigger_type === 'per_activity') { const e = effectiveHours ? Number(effectiveHours) : 0; for (const act of activities) { taskRecords.push(base(task, ov, `${effectiveName} — ${act.name}`, act.name, e)); } continue; }
            if (task.trigger_type === 'per_event_day' && task.default_job_role_id) {
                const e = effectiveHours ? Number(effectiveHours) : 0; const crew = roleCrewMap.get(task.default_job_role_id);
                if (crew?.length) { for (const ed of eventDays) { const dn = ed.event_day?.name || `Day #${ed.event_day_template_id}`; for (const c of crew) { const op = crewSlots.find(o => o.crew_id === c.crewId); const cn = op?.crew ? `${op.crew.contact?.first_name || ''} ${op.crew.contact?.last_name || ''}`.trim() : `Crew #${c.crewId}`; const label = eventDays.length > 1 ? `${effectiveName} — ${cn} (${dn})` : `${effectiveName} — ${cn}`; taskRecords.push(base(task, ov, label, eventDays.length > 1 ? `${cn} (${dn})` : cn, e, c.crewId)); } } continue; }
            }
            if (task.trigger_type === 'per_crew') { const e = effectiveHours ? Number(effectiveHours) : 0; for (const op of crewSlots) { if (!hasValid(op.crew_id, op.job_role_id)) continue; const n = op.crew ? `${op.crew.contact?.first_name || ''} ${op.crew.contact?.last_name || ''}`.trim() : (op.label || 'Unknown'); taskRecords.push(base(task, ov, `${effectiveName} — ${n}`, `Crew: ${n}`, e, op.crew_id || null)); } continue; }
            const labels = contextLabels[task.trigger_type] || [''];
            for (const label of labels) { const sfx = label && task.trigger_type !== 'always' ? ` — ${label}` : ''; taskRecords.push(base(task, ov, `${effectiveName}${sfx}`, label || null, effectiveHours)); }
        }

        for (const r of taskRecords) { const lt = libraryTasks.find(t => t.id === r.task_library_id); if (lt) r.due_date = calcDueDate(lt); }
        this._autoAssign(taskRecords, libraryTasks, resolvedRoles, roleCrewMap);

        const created = await this.prisma.$transaction(taskRecords.map(r => this.prisma.project_tasks.create({ data: r, include: { assigned_to: { select: { id: true, contact: { select: { first_name: true, last_name: true } } } } } })));
        const totalHours = created.reduce((s, t) => s + (t.estimated_hours ? Number(t.estimated_hours) : 0), 0);
        const byPhase = created.reduce((acc, t) => { if (!acc[t.phase]) acc[t.phase] = []; acc[t.phase].push(t); return acc; }, {} as Record<string, typeof created>);
        this.logger.log(`Auto-generated ${created.length} tasks for project ${projectId} from package ${packageId}`);
        return { success: true, project: { id: project.id, name: project.project_name }, package: { id: pkg.id, name: pkg.name }, summary: { total_tasks_created: created.length, total_estimated_hours: roundMoney(totalHours), phases_covered: Object.keys(byPhase).length, tasks_with_resolved_roles: created.filter(t => t.resolved_job_role_id).length, tasks_with_resolved_brackets: created.filter(t => t.resolved_bracket_id).length, tasks_auto_assigned: created.filter(t => t.assigned_to_id).length }, byPhase, tasks: created };
    }

    private async _needsContentDetect(brandId: number) {
        const hit = await this.prisma.task_library.findFirst({ where: { brand_id: brandId, is_active: true, trigger_type: { in: ['per_film_with_music', 'per_film_with_graphics'] } } });
        return !!hit;
    }

    private _autoAssign(taskRecords: TaskRecord[], libraryTasks: LibraryTask[], resolvedRoles: Map<number, ResolvedRoleResult>, roleCrewMap: ExecRoleCrewMap) {
        for (const r of taskRecords) {
            if (r.assigned_to_id) continue;
            const lt = libraryTasks.find(t => t.id === r.task_library_id);
            const resolved = resolvedRoles.get(r.task_library_id);
            const tbl = resolved?.bracket_level ?? null;
            if (lt?.default_job_role_id) { const id = pickCrewForBracket(roleCrewMap, lt.default_job_role_id, tbl); if (id) { r.assigned_to_id = id; continue; } }
            if (r.resolved_job_role_id) { const id = pickCrewForBracket(roleCrewMap, r.resolved_job_role_id, tbl); if (id) r.assigned_to_id = id; }
        }
    }
}
