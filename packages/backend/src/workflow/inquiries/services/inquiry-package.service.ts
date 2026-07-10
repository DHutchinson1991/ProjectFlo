import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { ProjectPackageCloneService, parseGuestCountMidpoint } from '../../projects/project-package-clone.service';
import { buildPackageContentsSnapshot } from '../../projects/package-contents-snapshot.util';
import { InquiryScheduleSnapshotService } from './inquiry-schedule-snapshot.service';

/**
 * InquiryPackageService
 *
 * Manages package assignment and swapping for an inquiry.
 */
@Injectable()
export class InquiryPackageService {
    private readonly logger = new Logger(InquiryPackageService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly packageCloneService: ProjectPackageCloneService,
        private readonly snapshotService: InquiryScheduleSnapshotService,
    ) {}

    /**
     * Handle package selection change on an inquiry.
     * If swapping, stashes user-entered data and restores after re-cloning.
     */
    async handlePackageSelection(inquiryId: number, newPackageId: number | null, brandId: number) {
        const inquiry = await this.prisma.inquiries.findUnique({
            where: { id: inquiryId },
            select: { source_package_id: true },
        });
        const hadPrevious = !!inquiry?.source_package_id;

        if (newPackageId) {
            const pkg = await this.prisma.service_packages.findUnique({
                where: { id: newPackageId },
                select: { brand_id: true },
            });
            if (!pkg) throw new NotFoundException('Selected package not found');
            if (pkg.brand_id !== brandId) {
                throw new ForbiddenException('Selected package does not belong to this brand');
            }
        }

        if (newPackageId && hadPrevious) {
            const swapResult = await this.prisma.$transaction(async (tx) => {
                const stash = await this.snapshotService.stashUserData(inquiryId, tx);
                await this.snapshotService.deleteInquiryScheduleSnapshot(inquiryId, tx);
                await this._clonePackageToInquiry(inquiryId, newPackageId, tx);
                return this.snapshotService.restoreUserData(inquiryId, stash, tx);
            });
            this.logger.log(
                `Swapped package → ${newPackageId} for inquiry ${inquiryId}. ` +
                `Restored: ${swapResult.subjects.restored} subjects, ${swapResult.locations.restored} locations, ${swapResult.crew.restored} crew`,
            );
            await this._syncPrimaryEstimateTitle(inquiryId, newPackageId);
        } else if (newPackageId) {
            await this.prisma.$transaction(async (tx) => {
                await this.snapshotService.deleteInquiryScheduleSnapshot(inquiryId, tx);
                await this._clonePackageToInquiry(inquiryId, newPackageId, tx);
            });
            this.logger.log(`Cloned package ${newPackageId} → inquiry ${inquiryId}`);
            await this._syncPrimaryEstimateTitle(inquiryId, newPackageId);
        } else {
            await this.prisma.$transaction(async (tx) => {
                await this.snapshotService.deleteInquiryScheduleSnapshot(inquiryId, tx);
                await tx.inquiries.update({
                    where: { id: inquiryId },
                    data: { source_package_id: null, package_contents_snapshot: Prisma.JsonNull },
                });
            });
            this.logger.log(`Cleared schedule snapshot for inquiry ${inquiryId}`);
        }
    }

    private async _clonePackageToInquiry(inquiryId: number, newPackageId: number, tx: Prisma.TransactionClient) {
        const inquiry = await tx.inquiries.findUnique({ where: { id: inquiryId }, select: { guest_count: true } });
        const guestCount = parseGuestCountMidpoint(inquiry?.guest_count) ?? undefined;
        const pkg = await tx.service_packages.findUnique({
            where: { id: newPackageId },
            select: {
                id: true,
                name: true,
                currency: true,
                contents: true,
                source_day_blueprint_id: true,
                source_day_blueprint_version_id: true,
                source_day_blueprint: { select: { id: true, key: true, display_name: true } },
                source_day_blueprint_version: { select: { id: true, version_number: true } },
            },
        });
        const packageContentsSnapshot = buildPackageContentsSnapshot(pkg);
        await tx.inquiries.update({
            where: { id: inquiryId },
            data: { source_package_id: newPackageId, package_contents_snapshot: packageContentsSnapshot ?? Prisma.JsonNull },
        });
        await this.packageCloneService.clonePackageToInquiry(inquiryId, newPackageId, tx, guestCount ? { guestCount } : undefined);
    }

    private async _syncPrimaryEstimateTitle(inquiryId: number, packageId: number) {
        const pkg = await this.prisma.service_packages.findUnique({ where: { id: packageId }, select: { name: true } });
        if (!pkg?.name) return;
        const primaryEstimate = await this.prisma.estimates.findFirst({ where: { inquiry_id: inquiryId, is_primary: true }, select: { id: true, title: true } });
        if (!primaryEstimate || primaryEstimate.title === pkg.name) return;
        await this.prisma.estimates.update({ where: { id: primaryEstimate.id }, data: { title: pkg.name } });
        this.logger.log(`Updated primary estimate ${primaryEstimate.id} title → "${pkg.name}"`);
    }
}
