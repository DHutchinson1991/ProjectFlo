import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { InquiryTasksService } from '../../tasks/inquiry/services/inquiry-tasks.service';

@Injectable()
export class ProjectCrewSlotsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly inquiryTasksService: InquiryTasksService,
    ) {}

    async assignProjectCrewToSlot(slotId: number, dto: { crew_member_id?: number | null }, brandId?: number) {
        const existing = await this.prisma.projectCrewSlot.findFirst({ 
            where: { id: slotId }
        });
        if (!existing) throw new NotFoundException('Project crew slot not found');

        if (dto.crew_member_id) {
            const contributor = await this.prisma.crewMember.findUnique({ where: { id: dto.crew_member_id } });
            if (!contributor) throw new NotFoundException('Crew member not found');
        }

        const updated = await this.prisma.projectCrewSlot.update({
            where: { id: slotId },
            data: { crew_member_id: dto.crew_member_id },
            include: {
                job_role: { select: { id: true, name: true, display_name: true } },
                crew_member: { include: { contact: { select: { first_name: true, last_name: true, email: true } } } },
                project_event_day: { select: { id: true, name: true, date: true } },
            },
        });

        if (existing.inquiry_id) {
            await this.inquiryTasksService.setAutoSubtaskStatus(existing.inquiry_id, 'review_estimate', false);
        }

        await this._cascadeContributorChange(existing, dto.crew_member_id ?? null);
        return updated;
    }

    private async _cascadeContributorChange(
        existing: { inquiry_id: number | null; project_id: number | null; crew_member_id: number | null; job_role_id: number | null },
        newContributorId: number | null,
    ) {
        const oldContributorId = existing.crew_member_id;
        if (oldContributorId === null || oldContributorId === newContributorId || existing.job_role_id === null) return;

        const oldName = await this._getContributorName(oldContributorId);
        const newName = newContributorId ? await this._getContributorName(newContributorId) : null;

        if (existing.inquiry_id) {
            await this._cascadeInquiryTasks(existing.inquiry_id, existing.job_role_id, oldContributorId, newContributorId, oldName, newName);
        }
        if (existing.project_id) {
            await this._cascadeProjectTasks(existing.project_id, existing.job_role_id, oldContributorId, newContributorId, oldName, newName);
        }
    }

    private async _getContributorName(contributorId: number): Promise<string | null> {
        const c = await this.prisma.crewMember.findUnique({
            where: { id: contributorId },
            select: { contact: { select: { first_name: true, last_name: true } } },
        });
        return c?.contact ? `${c.contact.first_name} ${c.contact.last_name}`.trim() : null;
    }

    private async _cascadeInquiryTasks(inquiryId: number, jobRoleId: number, oldId: number, newId: number | null, oldName: string | null, newName: string | null) {
        const tasks = await this.prisma.inquiry_tasks.findMany({
            where: { inquiry_id: inquiryId, assigned_to_id: oldId, job_role_id: jobRoleId },
            select: { id: true, name: true },
        });
        await Promise.all(tasks.map((t) => this.prisma.inquiry_tasks.update({
            where: { id: t.id },
            data: { assigned_to_id: newId, name: this._replaceName(t.name, oldName, newName) },
        })));
    }

    private async _cascadeProjectTasks(projectId: number, jobRoleId: number, oldId: number, newId: number | null, oldName: string | null, newName: string | null) {
        const tasks = await this.prisma.project_tasks.findMany({
            where: { project_id: projectId, assigned_to_id: oldId, resolved_job_role_id: jobRoleId },
            select: { id: true, name: true, trigger_context: true },
        });
        await Promise.all(tasks.map((t) => this.prisma.project_tasks.update({
            where: { id: t.id },
            data: {
                assigned_to_id: newId,
                name: this._replaceName(t.name, oldName, newName),
                trigger_context: t.trigger_context ? this._replaceName(t.trigger_context, oldName, newName) : t.trigger_context,
            },
        })));
    }

    private _replaceName(text: string, oldName: string | null, newName: string | null): string {
        if (!oldName) return text;
        return newName ? text.replace(oldName, newName) : text.replace(oldName, '');
    }
}
