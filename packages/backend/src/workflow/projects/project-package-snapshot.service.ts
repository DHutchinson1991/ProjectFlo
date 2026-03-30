import { Injectable } from '@nestjs/common';
import { OwnerFilter } from './project-snapshot.types';
import { ProjectSnapshotSummaryService } from './project-snapshot-summary.service';
import { ProjectSnapshotScheduleService } from './project-snapshot-schedule.service';
import { ProjectSnapshotCrewService } from './project-snapshot-crew.service';

export type { OwnerFilter };

@Injectable()
export class ProjectPackageSnapshotService {
    constructor(
        private readonly summaryService: ProjectSnapshotSummaryService,
        private readonly scheduleService: ProjectSnapshotScheduleService,
        private readonly crewService: ProjectSnapshotCrewService,
    ) {}

    getSnapshotSummary(filter: OwnerFilter) { return this.summaryService.getSnapshotSummary(filter); }
    getEventDays(filter: OwnerFilter) { return this.scheduleService.getEventDays(filter); }
    getActivities(filter: OwnerFilter) { return this.scheduleService.getActivities(filter); }
    getFilms(filter: OwnerFilter) { return this.scheduleService.getFilms(filter); }
    getLocationSlots(filter: OwnerFilter) { return this.scheduleService.getLocationSlots(filter); }
    getActivityMoments(filter: OwnerFilter, activityId: number) { return this.scheduleService.getActivityMoments(filter, activityId); }
    getCrewSlots(filter: OwnerFilter) { return this.crewService.getCrewSlots(filter); }
    getSubjects(filter: OwnerFilter) { return this.crewService.getSubjects(filter); }
}
