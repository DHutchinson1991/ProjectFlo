import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { Prisma } from '@prisma/client';

/**
 * ProjectTaskReassignService
 *
 * After cloning a package's crew (day operators) into a project or inquiry,
 * re-assigns the workflow tasks to the cloned crew members by matching job roles.
 */
@Injectable()
export class ProjectTaskReassignService {
    private readonly logger = new Logger(ProjectTaskReassignService.name);

    constructor(private readonly prisma: PrismaService) {}

    async reassignProjectTasksFromCrew(tx: Prisma.TransactionClient, projectId: number) {
        const operators = await tx.projectDayOperator.findMany({
            where: { project_id: projectId, crew_member_id: { not: null }, job_role_id: { not: null } },
            select: { crew_member_id: true, job_role_id: true },
        });

        if (operators.length === 0) {
            await tx.project_tasks.updateMany({ where: { project_id: projectId, is_active: true }, data: { assigned_to_id: null } });
            return;
        }

        const { roleToCrew, contributorRoleRows } = await this._buildRoleMap(tx, operators as Array<{ crew_member_id: number; job_role_id: number }>);

        const tasks = await tx.project_tasks.findMany({
            where: { project_id: projectId, is_active: true },
            select: { id: true, resolved_job_role_id: true, task_library: { select: { default_job_role_id: true } }, resolved_bracket: { select: { level: true } } },
        });

        await Promise.all(tasks.map((task) => {
            const roleId = task.task_library?.default_job_role_id ?? task.resolved_job_role_id;
            if (!roleId) return null;
            const assignedToId = this._pickBestCrewForBracket(roleToCrew, roleId, task.resolved_bracket?.level ?? null);
            return tx.project_tasks.update({ where: { id: task.id }, data: { assigned_to_id: assignedToId } });
        }));
        void contributorRoleRows; // used only for building the map
    }

    async reassignInquiryTasksFromCrew(tx: Prisma.TransactionClient, inquiryId: number) {
        const operators = await tx.projectDayOperator.findMany({
            where: { inquiry_id: inquiryId, crew_member_id: { not: null }, job_role_id: { not: null } },
            select: { crew_member_id: true, job_role_id: true },
        });

        if (operators.length === 0) {
            await tx.inquiry_tasks.updateMany({ where: { inquiry_id: inquiryId, is_active: true, is_task_group: false }, data: { assigned_to_id: null } });
            return;
        }

        const { roleToCrew } = await this._buildRoleMap(tx, operators as Array<{ crew_member_id: number; job_role_id: number }>);

        const tasks = await tx.inquiry_tasks.findMany({
            where: { inquiry_id: inquiryId, is_active: true, is_task_group: false },
            select: { id: true, job_role_id: true },
        });

        await Promise.all(tasks.map((task) => {
            if (!task.job_role_id) return null;
            const list = roleToCrew.get(task.job_role_id);
            const assignedToId = list?.[0]?.contributorId ?? null;
            return tx.inquiry_tasks.update({ where: { id: task.id }, data: { assigned_to_id: assignedToId } });
        }));
    }

    private async _buildRoleMap(
        tx: Prisma.TransactionClient,
        operators: Array<{ crew_member_id: number; job_role_id: number }>,
    ) {
        const contributorRoleRows = await tx.crewMemberJobRole.findMany({
            where: { crew_member_id: { in: operators.map((o) => o.crew_member_id) } },
            include: { payment_bracket: { select: { level: true } } },
        });

        const validAssignments = new Set(contributorRoleRows.map((r) => `${r.crew_member_id}-${r.job_role_id}`));
        const roleToCrew = new Map<number, Array<{ contributorId: number; bracketLevel: number }>>();

        for (const op of operators) {
            if (!validAssignments.has(`${op.crew_member_id}-${op.job_role_id}`)) continue;
            const bracketLevel = contributorRoleRows.find((r) => r.crew_member_id === op.crew_member_id && r.job_role_id === op.job_role_id)?.payment_bracket?.level ?? 0;
            if (!roleToCrew.has(op.job_role_id)) roleToCrew.set(op.job_role_id, []);
            const list = roleToCrew.get(op.job_role_id)!;
            if (!list.some((e) => e.contributorId === op.crew_member_id)) list.push({ contributorId: op.crew_member_id, bracketLevel });
        }

        for (const [, list] of roleToCrew) list.sort((a, b) => a.bracketLevel - b.bracketLevel);
        return { roleToCrew, contributorRoleRows };
    }

    private _pickBestCrewForBracket(
        roleToCrew: Map<number, Array<{ contributorId: number; bracketLevel: number }>>,
        roleId: number,
        taskBracketLevel: number | null,
    ): number | null {
        const list = roleToCrew.get(roleId);
        if (!list || list.length === 0) return null;
        if (list.length === 1 || taskBracketLevel === null || taskBracketLevel <= 0) return list[0].contributorId;
        let best = list[0];
        let bestDist = Math.abs(best.bracketLevel - taskBracketLevel);
        for (const c of list) {
            const dist = Math.abs(c.bracketLevel - taskBracketLevel);
            if (dist < bestDist || (dist === bestDist && c.bracketLevel < best.bracketLevel)) { best = c; bestDist = dist; }
        }
        return best.contributorId;
    }
}
