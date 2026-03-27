import { Injectable } from '@nestjs/common';
import { InquiryTaskLifecycleService } from './inquiry-task-lifecycle.service';
import { InquiryTaskGeneratorService } from './inquiry-task-generator.service';
import { InquiryTaskStatusService } from './inquiry-task-status.service';
import { UpdateInquiryTaskDto } from '../dto/update-inquiry-task.dto';
import { type InquiryTaskSubtaskKey } from '../constants/inquiry-task-subtasks.constants';

/**
 * Facade that preserves the original InquiryTasksService API surface.
 * Delegates to lifecycle, generator, and status services.
 * All 27 external consumers import this class by name — only the path changes.
 */
@Injectable()
export class InquiryTasksService {
    constructor(
        private lifecycleService: InquiryTaskLifecycleService,
        private generatorService: InquiryTaskGeneratorService,
        private statusService: InquiryTaskStatusService,
    ) {}

    // --- Lifecycle delegation ---

    findAllForInquiry(inquiryId: number, brandId: number) {
        return this.lifecycleService.findAllForInquiry(inquiryId, brandId);
    }

    update(inquiryId: number, taskId: number, dto: UpdateInquiryTaskDto, brandId: number) {
        return this.lifecycleService.update(inquiryId, taskId, dto, brandId);
    }

    toggle(inquiryId: number, taskId: number, brandId: number, completedById?: number) {
        return this.lifecycleService.toggle(inquiryId, taskId, brandId, completedById);
    }

    toggleTaskById(taskId: number, completedById?: number) {
        return this.lifecycleService.toggleTaskById(taskId, completedById);
    }

    toggleSubtask(inquiryId: number, subtaskId: number, brandId: number, completedById?: number) {
        return this.lifecycleService.toggleSubtask(inquiryId, subtaskId, brandId, completedById);
    }

    toggleSubtaskById(subtaskId: number, completedById?: number) {
        return this.lifecycleService.toggleSubtaskById(subtaskId, completedById);
    }

    getTaskEvents(taskId: number) {
        return this.lifecycleService.getTaskEvents(taskId);
    }

    autoCompleteByName(inquiryId: number, taskName: string, completedById?: number, force = false) {
        return this.lifecycleService.autoCompleteByName(inquiryId, taskName, completedById, force);
    }

    autoAssignByRole(inquiryId: number, jobRoleId: number, contributorId: number | null) {
        return this.lifecycleService.autoAssignByRole(inquiryId, jobRoleId, contributorId);
    }

    // --- Status delegation ---

    syncReviewInquiryAutoSubtasks(inquiryId: number) {
        return this.statusService.syncReviewInquiryAutoSubtasks(inquiryId);
    }

    setAutoSubtaskStatus(inquiryId: number, subtaskKey: InquiryTaskSubtaskKey, isComplete: boolean, completedById?: number) {
        return this.statusService.setAutoSubtaskStatus(inquiryId, subtaskKey, isComplete, completedById);
    }

    // --- Generator delegation ---

    generateForInquiry(inquiryId: number, brandId: number) {
        return this.generatorService.generateForInquiry(inquiryId, brandId);
    }
}
