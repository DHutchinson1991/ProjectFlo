import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { ProjectPackageCloneService, parseGuestCountMidpoint } from '../../projects/project-package-clone.service';
import { buildPackageContentsSnapshot } from '../../projects/package-contents-snapshot.util';
import { InquiryScheduleSnapshotService } from './inquiry-schedule-snapshot.service';
import { buildInquiryProjectName } from '../utils/build-inquiry-project-name';

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

            const packageIdForSnapshot = inquiry.source_package_id ?? inquiry.selected_package_id ?? null;
            let packageContentsSnapshot: Prisma.InputJsonValue | undefined =
                (inquiry.package_contents_snapshot as Prisma.InputJsonValue) ?? undefined;
            if (!packageContentsSnapshot && packageIdForSnapshot) {
                const pkg = await prisma.service_packages.findUnique({
                    where: { id: packageIdForSnapshot },
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
                if (pkg) {
                    packageContentsSnapshot = buildPackageContentsSnapshot(pkg) as Prisma.InputJsonValue;
                }
            }

            const project = await prisma.projects.create({
                data: {
                    client_id: client.id, brand_id: brandId,
                    inquiry_id: inquiry.id,
                    contact_id: inquiry.contact_id,
                    event_category: inquiry.event_category ?? null,
                    project_name: buildInquiryProjectName(inquiry.contact.first_name, inquiry.contact.last_name, inquiry.event_category),
                    wedding_date: inquiry.wedding_date || new Date(),
                    booking_date: new Date(), phase: 'Booking',
                    status: 'Active',
                    source_package_id: inquiry.source_package_id ?? inquiry.selected_package_id ?? null,
                    package_contents_snapshot: packageContentsSnapshot,
                    notes: inquiry.notes,
                    guest_count: inquiry.guest_count,
                    portal_token: inquiry.portal_token,
                },
            });

            // Transfer schedule data
            const hasScheduleData = await prisma.projectEventDay.count({ where: { inquiry_id: inquiryId } });
            if (hasScheduleData > 0) {
                await this.snapshotService.transferScheduleOwnership(inquiryId, project.id, prisma);
                this.logger.log(`Transferred schedule ownership from inquiry ${inquiryId} → project ${project.id}`);
            } else if (inquiry.selected_package_id) {
                try {
                    const guestCount = parseGuestCountMidpoint(inquiry.guest_count) ?? undefined;
                    const result = await this.packageCloneService.clonePackageToProject(
                        project.id,
                        inquiry.selected_package_id,
                        prisma,
                        guestCount ? { guestCount } : undefined,
                    );
                    this.logger.log(`Package clone for project ${project.id}: ${result.event_days_created} days, ${result.activities_created} activities, ${result.films_created} films, ${result.crew_slots_created} crew slots`);
                } catch (error) {
                    this.logger.error(`Failed to clone package ${inquiry.selected_package_id} for project ${project.id}`, error instanceof Error ? error.stack : error);
                    throw error;
                }
            }

            // Transfer all financial and workflow records to the project
            await prisma.proposals.updateMany({ where: { inquiry_id: inquiryId }, data: { project_id: project.id } });
            await prisma.estimates.updateMany({ where: { inquiry_id: inquiryId }, data: { project_id: project.id } });
            await prisma.quotes.updateMany({ where: { inquiry_id: inquiryId }, data: { project_id: project.id } });
            await prisma.invoices.updateMany({ where: { inquiry_id: inquiryId }, data: { project_id: project.id } });
            await prisma.contracts.updateMany({ where: { inquiry_id: inquiryId }, data: { project_id: project.id } });

            // Link inquiry tasks to the project so they remain accessible
            await prisma.inquiry_tasks.updateMany({ where: { inquiry_id: inquiryId }, data: { project_id: project.id } });

            // Archive the inquiry and upgrade contact type
            await prisma.inquiries.update({ where: { id: inquiryId }, data: { status: 'Booked', archived_at: new Date(), portal_token: null } });
            await prisma.contacts.update({ where: { id: inquiry.contact_id }, data: { type: 'Client' } });

            this.logger.log(`Converted inquiry ${inquiryId} → project ${project.id} (client ${client.id})`);
            return { projectId: project.id };
        });
    }
}
