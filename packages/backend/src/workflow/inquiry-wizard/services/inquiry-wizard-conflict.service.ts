import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';

@Injectable()
export class InquiryWizardConflictService {
    constructor(private readonly prisma: PrismaService) {}

    async checkDateConflicts(submissionId: number, brandId: number) {
        const submission = await this.prisma.inquiry_wizard_submissions.findFirst({
            where: { id: submissionId, brand_id: brandId },
            include: { inquiry: { select: { id: true, wedding_date: true } } },
        });

        if (!submission?.inquiry?.wedding_date) {
            return { wedding_date: null, booked_conflicts: [], soft_conflicts: [] };
        }

        const weddingDate = submission.inquiry.wedding_date;
        const dayStart = new Date(weddingDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(weddingDate);
        dayEnd.setHours(23, 59, 59, 999);

        const [conflictingInquiries, conflictingProjects] = await Promise.all([
            this.prisma.inquiries.findMany({
                where: {
                    id: { not: submission.inquiry.id },
                    wedding_date: { gte: dayStart, lte: dayEnd },
                },
                include: { contact: { select: { first_name: true, last_name: true } } },
            }),
            this.prisma.projects.findMany({
                where: {
                    wedding_date: { gte: dayStart, lte: dayEnd },
                    brand_id: brandId,
                    archived_at: null,
                },
                select: { id: true, project_name: true },
            }),
        ]);

        const booked_conflicts: { type: string; id: number; name: string; status: string }[] = [
            ...conflictingInquiries
                .filter((i) => i.status === 'Booked')
                .map((i) => ({
                    type: 'inquiry',
                    id: i.id,
                    name: `${i.contact.first_name} ${i.contact.last_name}`.trim(),
                    status: 'Booked',
                })),
            ...conflictingProjects.map((p) => ({
                type: 'project',
                id: p.id,
                name: p.project_name ?? `Project #${p.id}`,
                status: 'Confirmed',
            })),
        ];

        const soft_conflicts = conflictingInquiries
            .filter((i) => i.status !== 'Booked')
            .map((i) => ({
                type: 'inquiry',
                id: i.id,
                name: `${i.contact.first_name} ${i.contact.last_name}`.trim(),
                status: String(i.status),
            }));

        return { wedding_date: weddingDate, booked_conflicts, soft_conflicts };
    }

    async checkCrewConflicts(submissionId: number, brandId: number) {
        const submission = await this.prisma.inquiry_wizard_submissions.findFirst({
            where: { id: submissionId, brand_id: brandId },
            include: { inquiry: { select: { id: true, wedding_date: true } } },
        });

        if (!submission?.inquiry?.wedding_date) {
            return { conflicts: [] };
        }

        const weddingDate = submission.inquiry.wedding_date;
        const dayStart = new Date(weddingDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(weddingDate);
        dayEnd.setHours(23, 59, 59, 999);

        const events = await this.prisma.calendar_events.findMany({
            where: {
                event_type: { in: ['WEDDING_DAY', 'PROJECT_ASSIGNMENT'] },
                start_time: { lte: dayEnd },
                end_time: { gte: dayStart },
            },
            include: {
                crew_member: {
                    include: {
                        contact: { select: { first_name: true, last_name: true } },
                        crew_member_job_roles: {
                            include: { job_role: { select: { name: true, display_name: true } } },
                        },
                    },
                },
            },
        });

        const ON_SET_KEYWORDS = ['videographer', 'operator', 'cinematographer', 'photographer', 'drone'];
        const seen = new Set<number>();
        const conflicts: { crew_member_id: number; name: string; role: string; event_type: string; event_title: string }[] = [];

        for (const ev of events) {
            const cid = ev.crew_member_id;
            if (seen.has(cid)) continue;

            const matchingRole = ev.crew_member.crew_member_job_roles.find((r) =>
                ON_SET_KEYWORDS.some((kw) => r.job_role.name.toLowerCase().includes(kw)),
            );
            if (!matchingRole) continue;

            seen.add(cid);
            conflicts.push({
                crew_member_id: cid,
                name: `${ev.crew_member.contact.first_name} ${ev.crew_member.contact.last_name}`.trim(),
                role: matchingRole.job_role.display_name ?? matchingRole.job_role.name,
                event_type: ev.event_type,
                event_title: ev.title,
            });
        }

        return { conflicts };
    }
}
