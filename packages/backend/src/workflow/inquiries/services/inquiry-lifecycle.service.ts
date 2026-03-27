import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { DEFAULT_CURRENCY } from '@projectflo/shared';
import { ProjectPackageCloneService } from '../../projects/project-package-clone.service';
import { InquiryScheduleSnapshotService } from './inquiry-schedule-snapshot.service';

/**
 * InquiryLifecycleService
 *
 * Handles major lifecycle transitions for an inquiry, specifically converting
 * an inquiry to a project.
 */
@Injectable()
export class InquiryLifecycleService {
    private readonly logger = new Logger(InquiryLifecycleService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly packageCloneService: ProjectPackageCloneService,
        private readonly snapshotService: InquiryScheduleSnapshotService,
    ) {}

    async convertInquiryToProject(inquiryId: number, brandId: number) {
        return this.prisma.$transaction(async (prisma) => {
            const inquiry = await prisma.inquiries.findFirst({
                where: { id: inquiryId, archived_at: null, contact: { brand_id: brandId } },
                include: { contact: true },
            });
            if (!inquiry) throw new NotFoundException(`Inquiry with ID ${inquiryId} not found.`);
            if (inquiry.status === 'Booked') throw new BadRequestException('This inquiry has already been converted.');

            const client = await prisma.clients.create({ data: { contact_id: inquiry.contact_id, inquiry_id: inquiry.id } });

            let packageContentsSnapshot: Prisma.InputJsonValue | undefined =
                (inquiry.package_contents_snapshot as Prisma.InputJsonValue) ?? undefined;
            if (!packageContentsSnapshot && inquiry.selected_package_id) {
                const pkg = await prisma.service_packages.findUnique({
                    where: { id: inquiry.selected_package_id },
                    select: { id: true, name: true, base_price: true, currency: true, contents: true },
                });
                if (pkg) {
                    packageContentsSnapshot = { snapshot_taken_at: new Date().toISOString(), package_id: pkg.id, package_name: pkg.name, base_price: pkg.base_price ? Number(pkg.base_price) : 0, currency: pkg.currency ?? DEFAULT_CURRENCY, contents: pkg.contents };
                }
            }

            const project = await prisma.projects.create({
                data: {
                    client_id: client.id, brand_id: brandId,
                    project_name: `${inquiry.contact.first_name} & ${inquiry.contact.last_name}'s Wedding`,
                    wedding_date: inquiry.wedding_date || new Date(),
                    booking_date: new Date(), phase: 'PLANNING',
                    source_package_id: inquiry.source_package_id ?? inquiry.selected_package_id ?? null,
                    package_contents_snapshot: packageContentsSnapshot,
                },
            });

            const hasScheduleData = await prisma.projectEventDay.count({ where: { inquiry_id: inquiryId } });
            if (hasScheduleData > 0) {
                await this.snapshotService.transferScheduleOwnership(inquiryId, project.id, prisma);
                this.logger.log(`Transferred schedule ownership from inquiry ${inquiryId} → project ${project.id}`);
            } else if (inquiry.selected_package_id) {
                try {
                    const result = await this.packageCloneService.clonePackageToProject(project.id, inquiry.selected_package_id, prisma);
                    this.logger.log(`Package clone for project ${project.id}: ${result.event_days_created} days, ${result.activities_created} activities, ${result.films_created} films, ${result.operators_created} operators`);
                } catch (error) {
                    this.logger.error(`Failed to clone package ${inquiry.selected_package_id} for project ${project.id}`, error instanceof Error ? error.stack : error);
                    throw error;
                }
            }

            await prisma.proposals.updateMany({ where: { inquiry_id: inquiryId }, data: { project_id: project.id } });
            await prisma.inquiries.update({ where: { id: inquiryId }, data: { status: 'Booked', archived_at: new Date() } });
            await prisma.contacts.update({ where: { id: inquiry.contact_id }, data: { type: 'Client' } });

            return { projectId: project.id };
        });
    }
}
