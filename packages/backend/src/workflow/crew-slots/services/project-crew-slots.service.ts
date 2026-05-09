import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { InquiryTasksService } from '../../tasks/inquiry/services/inquiry-tasks.service';
import { LeadTaskService } from '../../tasks/inquiry/services/lead-task.service';

@Injectable()
export class ProjectCrewSlotsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly inquiryTasksService: InquiryTasksService,
        private readonly leadTaskService: LeadTaskService,
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
        // job_role_id on the same event day, merge by deleting the current slot
        // (the target crew already owns the role).
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
                // Merge: cascade tasks from old crew to new crew, then delete the redundant slot
                await this._cascadeCrewChange(existing, dto.crew_id);

                // If the deleted slot held a lead_type, preserve it on the surviving slot
                if (existing.lead_type && !duplicateSlot.lead_type) {
                    await this.prisma.projectCrewSlot.update({
                        where: { id: duplicateSlot.id },
                        data: { lead_type: existing.lead_type },
                    });
                }

                await this.prisma.projectCrewSlot.delete({ where: { id: slotId } });

                // No review_estimate reset here — merging removes a duplicate
                // slot, it doesn't change the crew lineup in a way that
                // invalidates the estimate.

                // Return the surviving slot with full includes
                return this.prisma.projectCrewSlot.findUnique({
                    where: { id: duplicateSlot.id },
                    include: {
                        job_role: { select: { id: true, name: true, display_name: true } },
                        crew: { include: { contact: { select: { first_name: true, last_name: true, email: true } } } },
                        project_event_day: { select: { id: true, name: true, date: true } },
                    },
                });
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

    async toggleLead(slotId: number, leadType: string | null) {
        const slot = await this.prisma.projectCrewSlot.findUnique({
            where: { id: slotId },
            include: { job_role: { select: { name: true } } },
        });
        if (!slot) throw new NotFoundException('Crew slot not found');

        const ALLOWED_LEAD_TYPES: Record<string, string> = { producer: 'producer', videographer: 'videographer', editor: 'editor' };
        const ROLE_TO_LEAD: Record<string, string> = { producer: 'producer', videographer: 'videographer', editor: 'editor', 'video-editor': 'editor' };

        // Find the previous lead for this type (if any) before making changes
        let previousLeadCrewId: number | null = null;
        const resolvedLeadType = leadType ?? slot.lead_type;
        if (resolvedLeadType && slot.inquiry_id) {
            const previousLead = await this.prisma.projectCrewSlot.findFirst({
                where: {
                    inquiry_id: slot.inquiry_id,
                    lead_type: resolvedLeadType,
                },
                select: { crew_id: true },
            });
            previousLeadCrewId = previousLead?.crew_id ?? null;
        }

        if (leadType) {
            if (!ALLOWED_LEAD_TYPES[leadType]) {
                throw new NotFoundException(`Invalid lead type: ${leadType}`);
            }
            const roleName = slot.job_role?.name ?? '';
            if (ROLE_TO_LEAD[roleName] !== leadType) {
                throw new NotFoundException(`Only a ${leadType} role can be set as lead ${leadType}`);
            }

            // ── Skill validation: crew must have all skills_needed for lead tasks ──
            if (slot.crew_id && slot.inquiry_id) {
                const missingSkills = await this.getCrewMissingLeadSkills(
                    slot.crew_id,
                    leadType,
                    slot.inquiry_id,
                );
                if (missingSkills.length > 0) {
                    throw new BadRequestException(
                        `Crew member is missing required skills for lead ${leadType} tasks: ${missingSkills.join(', ')}`,
                    );
                }
            }

            // Clear lead_type on all other slots of the same type for this inquiry/project
            await this.prisma.projectCrewSlot.updateMany({
                where: {
                    id: { not: slotId },
                    ...(slot.inquiry_id ? { inquiry_id: slot.inquiry_id } : {}),
                    ...(slot.project_id ? { project_id: slot.project_id } : {}),
                    lead_type: leadType,
                },
                data: { lead_type: null },
            });
        }

        const updated = await this.prisma.projectCrewSlot.update({
            where: { id: slotId },
            data: { lead_type: leadType },
        });

        // Auto-generate / reassign / unassign lead-specific tasks
        if (slot.inquiry_id && resolvedLeadType) {
            const newCrewId = leadType ? slot.crew_id : null;
            await this.leadTaskService.onLeadChanged(
                slot.inquiry_id,
                resolvedLeadType,
                newCrewId,
                previousLeadCrewId,
            );
        }

        return updated;
    }

    /**
     * Check if a crew member has all the skills_needed for lead tasks of a given type.
     * Skills are resolved via the crew's roles → skill_role_mappings.
     * Returns an array of missing skill names (empty = all skills present).
     */
    private async getCrewMissingLeadSkills(
        crewId: number,
        leadType: string,
        inquiryId: number,
    ): Promise<string[]> {
        // Get brand_id from the inquiry
        const inquiry = await this.prisma.inquiries.findUnique({
            where: { id: inquiryId },
            select: { contact: { select: { brand_id: true } } },
        });
        if (!inquiry?.contact?.brand_id) return [];

        // Get all skills_needed for lead tasks of this type
        const ROLE_TO_LEAD: Record<string, string> = { producer: 'producer', videographer: 'videographer', editor: 'editor', 'video-editor': 'editor' };
        const roleNames = Object.entries(ROLE_TO_LEAD)
            .filter(([, lt]) => lt === leadType)
            .map(([name]) => name);

        const roles = await this.prisma.job_roles.findMany({
            where: { name: { in: roleNames } },
            select: { id: true },
        });
        if (roles.length === 0) return [];

        const leadTasks = await this.prisma.task_library.findMany({
            where: {
                brand_id: inquiry.contact.brand_id,
                is_active: true,
                is_task_group: false,
                is_lead_task: true,
                default_job_role_id: { in: roles.map((r) => r.id) },
            },
            select: { skills_needed: true },
        });

        // Collect all unique required skills
        const requiredSkills = new Set<string>();
        for (const t of leadTasks) {
            for (const skill of t.skills_needed) {
                requiredSkills.add(skill.toLowerCase());
            }
        }
        if (requiredSkills.size === 0) return [];

        // Get crew's skills from their roles via skill_role_mappings
        const crewRoles = await this.prisma.crewJobRole.findMany({
            where: { crew_id: crewId },
            select: { job_role_id: true },
        });
        const crewRoleIds = crewRoles.map((r) => r.job_role_id);

        const crewSkillMappings = await this.prisma.skill_role_mappings.findMany({
            where: {
                job_role_id: { in: crewRoleIds },
                is_active: true,
            },
            select: { skill_name: true },
        });
        const crewSkills = new Set(crewSkillMappings.map((m) => m.skill_name.toLowerCase()));

        // Find missing skills
        const missing: string[] = [];
        for (const skill of requiredSkills) {
            if (!crewSkills.has(skill)) {
                missing.push(skill);
            }
        }
        return missing;
    }
}
