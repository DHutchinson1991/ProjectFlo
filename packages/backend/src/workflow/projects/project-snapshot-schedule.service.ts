import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { OwnerFilter } from './project-snapshot.types';

@Injectable()
export class ProjectSnapshotScheduleService {
    constructor(private readonly prisma: PrismaService) {}

    private ownerWhere(filter: OwnerFilter) {
        return filter.projectId != null ? { project_id: filter.projectId } : { inquiry_id: filter.inquiryId };
    }

    private ownerLabel(filter: OwnerFilter) {
        return filter.projectId != null ? `Project ${filter.projectId}` : `Inquiry ${filter.inquiryId}`;
    }

    async getEventDays(filter: OwnerFilter) {
        return this.prisma.projectEventDay.findMany({
            where: this.ownerWhere(filter),
            include: {
                event_day_template: true,
                activities: {
                    orderBy: { order_index: 'asc' },
                    include: { moments: { orderBy: { order_index: 'asc' } } },
                },
                day_crew_slots: {
                    orderBy: { order_index: 'asc' },
                    include: {
                        crew: { include: { contact: { select: { id: true, first_name: true, last_name: true, email: true } } } },
                        job_role: { select: { id: true, name: true, display_name: true, category: true } },
                        equipment: { include: { equipment: { select: { id: true, item_name: true, category: true, type: true, model: true, is_unmanned: true } } } },
                        activity_assignments: { include: { project_activity: { select: { id: true, name: true } } } },
                    },
                },
                subjects: {
                    orderBy: { order_index: 'asc' },
                    include: { role_template: true, activity_assignments: { include: { project_activity: { select: { id: true, name: true } } } } },
                },
                location_slots: {
                    orderBy: { order_index: 'asc' },
                    include: {
                        location: true,
                        activity_assignments: { include: { project_activity: { select: { id: true, name: true } } } },
                    },
                },
            },
            orderBy: { order_index: 'asc' },
        });
    }

    async getActivities(filter: OwnerFilter) {
        return this.prisma.projectActivity.findMany({
            where: this.ownerWhere(filter),
            include: {
                project_event_day: { select: { id: true, name: true, date: true } },
                package_activity: { select: { id: true, name: true } },
                moments: { orderBy: { order_index: 'asc' } },
                scene_schedules: { include: { scene: true, project_film: { include: { film: true } } } },
                crew_slot_assignments: { include: { project_crew_slot: { select: { id: true, label: true, crew_id: true, job_role: { select: { name: true, display_name: true } } } } } },
                subject_assignments: { include: { project_day_subject: { select: { id: true, name: true, real_name: true } } } },
                location_assignments: { include: { project_location_slot: { select: { id: true, location_number: true, name: true } } } },
            },
            orderBy: [{ project_event_day_id: 'asc' }, { order_index: 'asc' }],
        });
    }

    async getFilms(filter: OwnerFilter) {
        return this.prisma.projectFilm.findMany({
            where: this.ownerWhere(filter),
            include: {
                film: { include: { scenes: { orderBy: { order_index: 'asc' }, include: { moments: { orderBy: { order_index: 'asc' } }, beats: { orderBy: { order_index: 'asc' } } } } } },
                package_film: { select: { id: true, package_id: true } },
                scene_schedules: {
                    include: { project_event_day: { select: { id: true, name: true } }, project_activity: { select: { id: true, name: true } }, scene: true },
                    orderBy: { order_index: 'asc' },
                },
            },
            orderBy: { order_index: 'asc' },
        });
    }

    async getLocationSlots(filter: OwnerFilter) {
        return this.prisma.projectLocationSlot.findMany({
            where: this.ownerWhere(filter),
            include: {
                project_event_day: { select: { id: true, name: true, date: true } },
                location: true,
                activity_assignments: { include: { project_activity: { select: { id: true, name: true } } } },
            },
            orderBy: [{ project_event_day_id: 'asc' }, { order_index: 'asc' }],
        });
    }

    async getActivityMoments(filter: OwnerFilter, activityId: number) {
        const where = this.ownerWhere(filter);
        const activity = await this.prisma.projectActivity.findFirst({ where: { id: activityId, ...where } });
        if (!activity) throw new NotFoundException(`Activity ${activityId} not found for ${this.ownerLabel(filter)}`);
        return this.prisma.projectActivityMoment.findMany({ where: { project_activity_id: activityId, ...where }, orderBy: { order_index: 'asc' } });
    }
}
