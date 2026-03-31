import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { InquiryTasksService } from '../../tasks/inquiry/services/inquiry-tasks.service';

@Injectable()
export class ProjectCrewSlotsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly inquiryTasksService: InquiryTasksService,
    ) {}

    async assignProjectCrewToSlot(slotId: number, dto: { crew_id?: number | null }, brandId?: number) {
        const existing = await this.prisma.projectCrewSlot.findFirst({ 
            where: { id: slotId },
            include: { project_event_day: { select: { id: true } } },
        });
        if (!existing) throw new NotFoundException('Project crew slot not found');

        if (dto.crew_id) {
            const crew = await this.prisma.crew.findUnique({ where: { id: dto.crew_id } });
            if (!crew) throw new NotFoundException('Crew not found');
        }

        // Detect duplicate: if the new crew already has a slot with the same
        // job_role_id on the same event day, swap the old crew onto that slot
        // instead of creating a duplicate assignment.
        if (dto.crew_id && existing.job_role_id && existing.crew_id && existing.crew_id !== dto.crew_id) {
            const duplicateSlot = await this.prisma.projectCrewSlot.findFirst({
                where: {
                    id: { not: slotId },
                    crew_id: dto.crew_id,
                    job_role_id: existing.job_role_id,
                    project_event_day_id: existing.project_event_day_id,
                    inquiry_id: existing.inquiry_id,
                    project_id: existing.project_id,
                },
            });
            if (duplicateSlot) {
                // True swap: move old crew to the duplicate slot
                await this.prisma.projectCrewSlot.update({
                    where: { id: duplicateSlot.id },
                    data: { crew_id: existing.crew_id },
                });
                await this._cascadeCrewChange(
                    { inquiry_id: duplicateSlot.inquiry_id, project_id: duplicateSlot.project_id, crew_id: dto.crew_id, job_role_id: duplicateSlot.job_role_id },
                    existing.crew_id,
                );
            }
        }

        const updated = await this.prisma.projectCrewSlot.update({
            where: { id: slotId },
            data: { crew_id: dto.crew_id },
            include: {
                job_role: { select: { id: true, name: true, display_name: true } },
                crew: { include: { contact: { select: { first_name: true, last_name: true, email: true } } } },
                project_event_day: { select: { id: true, name: true, date: true } },
            },
        });

        if (existing.inquiry_id) {
            await this.inquiryTasksService.setAutoSubtaskStatus(existing.inquiry_id, 'review_estimate', false);
        }

        await this._cascadeCrewChange(existing, dto.crew_id ?? null);
        return updated;
    }

    private async _cascadeCrewChange(
        existing: { inquiry_id: number | null; project_id: number | null; crew_id: number | null; job_role_id: number | null },
        newCrewId: number | null,
    ) {
        const oldCrewId = existing.crew_id;
        if (oldCrewId === null || oldCrewId === newCrewId || existing.job_role_id === null) return;

        const oldName = await this._getCrewName(oldCrewId);
        const newName = newCrewId ? await this._getCrewName(newCrewId) : null;

        if (existing.inquiry_id) {
            await this._cascadeInquiryTasks(existing.inquiry_id, existing.job_role_id, oldCrewId, newCrewId, oldName, newName);
        }
        if (existing.project_id) {
            await this._cascadeProjectTasks(existing.project_id, existing.job_role_id, oldCrewId, newCrewId, oldName, newName);
        }
    }

    private async _getCrewName(crewId: number): Promise<string | null> {
        const c = await this.prisma.crew.findUnique({
            where: { id: crewId },
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
