import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { DEFAULT_CURRENCY } from '@projectflo/shared';
import { ProjectPackageCloneService } from './project-package-clone.service';
import { ProjectTaskReassignService } from './project-task-reassign.service';

/**
 * ProjectPackageSyncService
 *
 * Handles "delete-then-reclone" operations for projects and inquiries.
 * Wipes all existing instance schedule data and re-clones from the source package.
 */
@Injectable()
export class ProjectPackageSyncService {
    private readonly logger = new Logger(ProjectPackageSyncService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly cloneService: ProjectPackageCloneService,
        private readonly taskReassign: ProjectTaskReassignService,
    ) {}

    async syncProjectScheduleFromPackage(projectId: number) {
        const project = await this.prisma.projects.findUnique({ where: { id: projectId }, select: { id: true, source_package_id: true } });
        if (!project) throw new NotFoundException(`Project ${projectId} not found`);
        if (!project.source_package_id) throw new NotFoundException(`Project ${projectId} has no source package`);

        return this.prisma.$transaction(async (tx) => {
            await this._deleteInstanceData(tx, { project_id: projectId });
            const result = await this.cloneService.clonePackageToOwner({ projectId, packageId: project.source_package_id! }, tx);
            await this.taskReassign.reassignProjectTasksFromCrew(tx, projectId);
            return result;
        });
    }

    async syncInquiryScheduleFromPackage(inquiryId: number) {
        const inquiry = await this.prisma.inquiries.findUnique({ where: { id: inquiryId }, select: { id: true, source_package_id: true, selected_package_id: true } });
        if (!inquiry) throw new NotFoundException(`Inquiry ${inquiryId} not found`);
        const packageId = inquiry.source_package_id ?? inquiry.selected_package_id;
        if (!packageId) throw new NotFoundException(`Inquiry ${inquiryId} has no source package`);

        if (!inquiry.source_package_id && inquiry.selected_package_id) {
            const pkg = await this.prisma.service_packages.findUnique({ where: { id: inquiry.selected_package_id }, select: { id: true, name: true, base_price: true, currency: true, contents: true } });
            await this.prisma.inquiries.update({
                where: { id: inquiryId },
                data: {
                    source_package_id: inquiry.selected_package_id,
                    package_contents_snapshot: pkg ? { snapshot_taken_at: new Date().toISOString(), package_id: pkg.id, package_name: pkg.name, base_price: pkg.base_price ? Number(pkg.base_price) : 0, currency: pkg.currency ?? DEFAULT_CURRENCY, contents: pkg.contents } : Prisma.JsonNull,
                },
            });
        }

        return this.prisma.$transaction(async (tx) => {
            await this._deleteInstanceData(tx, { inquiry_id: inquiryId });
            const result = await this.cloneService.clonePackageToOwner({ inquiryId, packageId }, tx);
            await this.taskReassign.reassignInquiryTasksFromCrew(tx, inquiryId);
            return result;
        });
    }

    async _deleteInstanceData(tx: Prisma.TransactionClient, owner: { project_id: number } | { inquiry_id: number }) {
        const where = owner as Record<string, unknown>;
        await tx.projectLocationActivityAssignment.deleteMany({ where: { project_location_slot: where } });
        await tx.projectDaySubjectActivity.deleteMany({ where: { project_day_subject: where } });
        await tx.projectOperatorActivityAssignment.deleteMany({ where: { project_crew_slot: where } });
        await tx.projectDayOperatorEquipment.deleteMany({ where: { project_crew_slot: where } });
        await tx.projectFilmSceneSchedule.deleteMany({ where: { project_film: where } });
        await tx.projectActivityMoment.deleteMany({ where });
        await tx.projectDaySubject.deleteMany({ where });
        await tx.projectLocationSlot.deleteMany({ where });
        await tx.projectDayOperator.deleteMany({ where });
        await tx.projectFilm.deleteMany({ where });
        await tx.projectActivity.deleteMany({ where });
        await tx.projectEventDay.deleteMany({ where });
        this.logger.debug(`Deleted all instance data for ${JSON.stringify(owner)}`);
    }
}
