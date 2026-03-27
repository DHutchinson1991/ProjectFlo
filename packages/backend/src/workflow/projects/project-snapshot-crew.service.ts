import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { OwnerFilter } from './project-snapshot.types';

@Injectable()
export class ProjectSnapshotCrewService {
    constructor(private readonly prisma: PrismaService) {}

    private ownerWhere(filter: OwnerFilter) {
        return filter.projectId != null ? { project_id: filter.projectId } : { inquiry_id: filter.inquiryId };
    }

    async getOperators(filter: OwnerFilter) {
        return this.prisma.projectCrewSlot.findMany({
            where: this.ownerWhere(filter),
            include: {
                project_event_day: { select: { id: true, name: true, date: true } },
                project_activity: { select: { id: true, name: true } },
                crew_member: {
                    include: {
                        contact: { select: { id: true, first_name: true, last_name: true, email: true } },
                        job_role_assignments: {
                            include: {
                                job_role: { select: { id: true, name: true, display_name: true } },
                                payment_bracket: { select: { id: true, name: true, display_name: true, level: true, hourly_rate: true, day_rate: true } },
                            },
                        },
                    },
                },
                job_role: { select: { id: true, name: true, display_name: true, category: true } },
                equipment: {
                    include: {
                        equipment: {
                            select: { id: true, item_name: true, category: true, type: true, model: true, is_unmanned: true, is_active: true, rental_price_per_day: true },
                        },
                    },
                },
                activity_assignments: { include: { project_activity: { select: { id: true, name: true } } } },
            },
            orderBy: [{ project_event_day_id: 'asc' }, { order_index: 'asc' }],
        });
    }

    async getSubjects(filter: OwnerFilter) {
        return this.prisma.projectDaySubject.findMany({
            where: this.ownerWhere(filter),
            include: {
                project_event_day: { select: { id: true, name: true, date: true } },
                role_template: true,
                activity_assignments: { include: { project_activity: { select: { id: true, name: true } } } },
            },
            orderBy: [{ project_event_day_id: 'asc' }, { order_index: 'asc' }],
        });
    }
}
