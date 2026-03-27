import { Injectable } from '@nestjs/common';
import { TaskLibraryCrudService } from './services/task-library-crud.service';
import { TaskLibraryPreviewService, PreviewTaskRow } from './services/task-library-preview.service';
import { TaskLibraryExecuteService } from './services/task-library-execute.service';
import { CreateTaskLibraryDto, UpdateTaskLibraryDto, TaskLibraryQueryDto, ProjectPhase, BatchUpdateTaskOrderDto, ExecuteAutoGenerationDto } from './dto/task-library.dto';

export { PreviewTaskRow };

/**
 * Facade that delegates to the split CRUD / preview / execute services.
 * External modules (pricing, estimates, inquiry-wizard) inject this service.
 */
@Injectable()
export class TaskLibraryService {
    constructor(
        private readonly crud: TaskLibraryCrudService,
        private readonly preview: TaskLibraryPreviewService,
        private readonly execute: TaskLibraryExecuteService,
    ) {}

    /* ── CRUD ─────────────────────────────────────────── */
    create(dto: CreateTaskLibraryDto, userId: number) {
        return this.crud.create(dto, userId);
    }
    findAll(query: TaskLibraryQueryDto, userId: number) {
        return this.crud.findAll(query, userId);
    }
    findOne(id: number, userId: number) {
        return this.crud.findOne(id, userId);
    }
    update(id: number, dto: UpdateTaskLibraryDto, userId: number) {
        return this.crud.update(id, dto, userId);
    }
    remove(id: number, userId: number) {
        return this.crud.remove(id, userId);
    }
    getTasksByPhase(phase: ProjectPhase, brandId: number, userId: number) {
        return this.crud.getTasksByPhase(phase, brandId, userId);
    }
    batchUpdateOrder(dto: BatchUpdateTaskOrderDto, userId: number) {
        return this.crud.batchUpdateOrder(dto, userId);
    }
    syncContributorsToInquiryTasks(brandId: number) {
        return this.crud.syncContributorsToInquiryTasks(brandId);
    }

    /* ── Preview ──────────────────────────────────────── */
    previewAutoGeneration(packageId: number, brandId: number, userId: number, inquiryId?: number, projectId?: number) {
        return this.preview.previewAutoGeneration(packageId, brandId, userId, inquiryId, projectId);
    }
    previewAutoGenerationForSystem(packageId: number, brandId: number, inquiryId?: number, projectId?: number) {
        return this.preview.previewAutoGenerationForSystem(packageId, brandId, inquiryId, projectId);
    }

    /* ── Execute ──────────────────────────────────────── */
    executeAutoGeneration(dto: ExecuteAutoGenerationDto, userId: number) {
        return this.execute.executeAutoGeneration(dto, userId);
    }
}
