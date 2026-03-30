import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { OwnerFilter } from './project-snapshot.types';

@Injectable()
export class ProjectSnapshotSummaryService {
    constructor(private readonly prisma: PrismaService) {}

    private ownerWhere(filter: OwnerFilter) {
        return filter.projectId != null ? { project_id: filter.projectId } : { inquiry_id: filter.inquiryId };
    }

    private ownerLabel(filter: OwnerFilter) {
        return filter.projectId != null ? `Project ${filter.projectId}` : `Inquiry ${filter.inquiryId}`;
    }

    /**
     * Get the full package snapshot summary for a project OR inquiry.
     * Returns source package info, event days (with counts), and aggregate stats.
     */
    async getSnapshotSummary(filter: OwnerFilter) {
        const where = this.ownerWhere(filter);
        const label = this.ownerLabel(filter);

        let source_package_id: number | null = null;
        let package_contents_snapshot: unknown = null;
        let source_package: { id: number; name: string; description: string | null } | null = null;
        let owner_id: number;

        if (filter.projectId != null) {
            const project = await this.prisma.projects.findUnique({
                where: { id: filter.projectId },
                select: {
                    id: true,
                    source_package_id: true,
                    package_contents_snapshot: true,
                    source_package: { select: { id: true, name: true, description: true } },
                },
            });
            if (!project) throw new NotFoundException(`${label} not found`);
            owner_id = project.id;
            source_package_id = project.source_package_id;
            package_contents_snapshot = project.package_contents_snapshot;
            source_package = project.source_package;
        } else {
            const inquiry = await this.prisma.inquiries.findUnique({
                where: { id: filter.inquiryId },
                select: {
                    id: true,
                    source_package_id: true,
                    package_contents_snapshot: true,
                    source_package_for_inquiry: { select: { id: true, name: true, description: true } },
                },
            });
            if (!inquiry) throw new NotFoundException(`${label} not found`);
            owner_id = inquiry.id;
            source_package_id = inquiry.source_package_id;
            package_contents_snapshot = inquiry.package_contents_snapshot;
            source_package = inquiry.source_package_for_inquiry;
        }

        const [eventDayCount, activityCount, filmCount, crewSlotCount, subjectCount, locationSlotCount] =
            await Promise.all([
                this.prisma.projectEventDay.count({ where }),
                this.prisma.projectActivity.count({ where }),
                this.prisma.projectFilm.count({ where }),
                this.prisma.projectCrewSlot.count({ where }),
                this.prisma.projectDaySubject.count({ where }),
                this.prisma.projectLocationSlot.count({ where }),
            ]);

        return {
            owner_id,
            owner_type: filter.projectId != null ? 'project' : 'inquiry',
            source_package_id,
            source_package,
            package_contents_snapshot,
            has_package_data: eventDayCount > 0 || activityCount > 0 || filmCount > 0,
            counts: { event_days: eventDayCount, activities: activityCount, films: filmCount, crew_slots: crewSlotCount, subjects: subjectCount, location_slots: locationSlotCount },
        };
    }
}
