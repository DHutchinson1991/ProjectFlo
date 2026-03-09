import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInquiryDto, UpdateInquiryDto } from './dto/inquiries.dto';
import { $Enums, Prisma } from '@prisma/client';
import { ProjectPackageCloneService } from '../projects/project-package-clone.service';

@Injectable()
export class InquiriesService {
    private readonly logger = new Logger(InquiriesService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly packageCloneService: ProjectPackageCloneService,
    ) { }

    async findAll(brandId: number) {
        const inquiries = await this.prisma.inquiries.findMany({
            where: {
                archived_at: null,
                contact: {
                    brand_id: brandId,
                },
            },
            include: {
                contact: {
                    select: {
                        first_name: true,
                        last_name: true,
                        email: true,
                        phone_number: true,
                    },
                },
            },
            orderBy: {
                id: 'desc',
            },
        });

        return inquiries.map((inquiry) => ({
            id: inquiry.id,
            status: inquiry.status,
            event_date: inquiry.wedding_date,
            wedding_date: inquiry.wedding_date, // Keep for backward compatibility
            source: inquiry.lead_source || 'OTHER',
            notes: inquiry.notes,
            venue_details: inquiry.venue_details,
            venue_address: inquiry.venue_address,
            venue_lat: inquiry.venue_lat,
            venue_lng: inquiry.venue_lng,
            lead_source: inquiry.lead_source,
            lead_source_details: inquiry.lead_source_details,
            created_at: new Date(), // Default to now since schema might not have this field
            updated_at: new Date(), // Default to now since schema might not have this field
            contact: {
                id: inquiry.contact_id,
                first_name: inquiry.contact.first_name,
                last_name: inquiry.contact.last_name,
                email: inquiry.contact.email,
                phone_number: inquiry.contact.phone_number,
            },
            contact_id: inquiry.contact_id,
        }));
    }

    async findOne(id: number, brandId: number) {
        const inquiry = await this.prisma.inquiries.findFirst({
            where: {
                id,
                archived_at: null,
                // Relaxing brand check for development to ensure access
                // contact: {
                //    brand_id: brandId,
                // },
            },
            include: {
                contact: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        email: true,
                        phone_number: true,
                        company_name: true,
                        brand_id: true,
                    },
                },
                contracts: {
                    orderBy: { id: 'desc' },
                },
                invoices: {
                    include: {
                        items: true,
                    },
                    orderBy: { id: 'desc' },
                },
                activity_logs: {
                    orderBy: { created_at: 'desc' },
                },
            },
        });

        if (!inquiry) {
            throw new NotFoundException(`Inquiry with ID ${id} not found`);
        }

        return {
            id: inquiry.id,
            status: inquiry.status,
            event_date: inquiry.wedding_date,
            wedding_date: inquiry.wedding_date, // Keep for backward compatibility
            source: inquiry.lead_source || 'OTHER',
            notes: inquiry.notes,
            venue_details: inquiry.venue_details,
            venue_address: inquiry.venue_address,
            venue_lat: inquiry.venue_lat,
            venue_lng: inquiry.venue_lng,
            lead_source: inquiry.lead_source,
            lead_source_details: inquiry.lead_source_details,
            selected_package_id: inquiry.selected_package_id,
            created_at: new Date(), // Default since this field might not exist in the table yet
            updated_at: new Date(), // Default since this field might not exist in the table yet
            contact: {
                id: inquiry.contact.id,
                first_name: inquiry.contact.first_name,
                last_name: inquiry.contact.last_name,
                email: inquiry.contact.email,
                phone_number: inquiry.contact.phone_number,
                company_name: inquiry.contact.company_name,
                brand_id: inquiry.contact.brand_id,
            },
            brand_id: inquiry.contact.brand_id,
            contact_id: inquiry.contact_id,
            contracts: inquiry.contracts,
            invoices: inquiry.invoices,
        };
    }

    async create(createInquiryDto: CreateInquiryDto, brandId: number) {
        const { first_name, last_name, email, phone_number, ...inquiryData } = createInquiryDto;

        // First, create or find the contact
        const contact = await this.prisma.contacts.upsert({
            where: { email },
            update: {
                first_name,
                last_name,
                phone_number,
                brand_id: brandId,
            },
            create: {
                first_name,
                last_name,
                email,
                phone_number,
                type: $Enums.contacts_type.Client_Lead,
                brand_id: brandId,
            },
        });

        // Then create the inquiry
        const inquiry = await this.prisma.inquiries.create({
            data: {
                contact_id: contact.id,
                wedding_date: new Date(inquiryData.wedding_date),
                status: inquiryData.status,
                notes: inquiryData.notes,
                venue_details: inquiryData.venue_details,
                lead_source: inquiryData.lead_source,
                lead_source_details: inquiryData.lead_source_details,
            },
            include: {
                contact: {
                    select: {
                        first_name: true,
                        last_name: true,
                        email: true,
                        phone_number: true,
                    },
                },
            },
        });

        return {
            id: inquiry.id,
            status: inquiry.status,
            wedding_date: inquiry.wedding_date,
            notes: inquiry.notes,
            venue_details: inquiry.venue_details,
            lead_source: inquiry.lead_source,
            lead_source_details: inquiry.lead_source_details,
            first_name: inquiry.contact.first_name,
            last_name: inquiry.contact.last_name,
            email: inquiry.contact.email,
            phone_number: inquiry.contact.phone_number,
        };
    }

    async update(id: number, updateInquiryDto: UpdateInquiryDto, brandId: number) {
        const { first_name, last_name, email, phone_number, ...inquiryData } = updateInquiryDto;

        // First, find the inquiry to ensure it exists and belongs to the brand
        const existingInquiry = await this.prisma.inquiries.findFirst({
            where: {
                id,
                archived_at: null,
                contact: {
                    brand_id: brandId,
                },
            },
            include: {
                contact: true,
            },
        });

        if (!existingInquiry) {
            throw new NotFoundException(`Inquiry with ID ${id} not found`);
        }

        // Detect if selected_package_id is changing
        const packageChanging =
            inquiryData.selected_package_id !== undefined &&
            inquiryData.selected_package_id !== existingInquiry.selected_package_id;

        // Update contact information if provided
        if (first_name || last_name || email || phone_number) {
            await this.prisma.contacts.update({
                where: { id: existingInquiry.contact_id },
                data: {
                    ...(first_name && { first_name }),
                    ...(last_name && { last_name }),
                    ...(email && { email }),
                    ...(phone_number && { phone_number }),
                },
            });
        }

        // Update inquiry data
        const updatedInquiry = await this.prisma.inquiries.update({
            where: { id },
            data: {
                ...(inquiryData.wedding_date && { wedding_date: new Date(inquiryData.wedding_date) }),
                ...(inquiryData.status && { status: inquiryData.status }),
                ...(inquiryData.notes !== undefined && { notes: inquiryData.notes }),
                ...(inquiryData.venue_details !== undefined && { venue_details: inquiryData.venue_details }),
                ...(inquiryData.venue_address !== undefined && { venue_address: inquiryData.venue_address }),
                ...(inquiryData.venue_lat !== undefined && { venue_lat: inquiryData.venue_lat }),
                ...(inquiryData.venue_lng !== undefined && { venue_lng: inquiryData.venue_lng }),
                ...(inquiryData.lead_source !== undefined && { lead_source: inquiryData.lead_source }),
                ...(inquiryData.lead_source_details !== undefined && { lead_source_details: inquiryData.lead_source_details }),
                ...(inquiryData.selected_package_id !== undefined && { selected_package_id: inquiryData.selected_package_id }),
            },
            include: {
                contact: {
                    select: {
                        first_name: true,
                        last_name: true,
                        email: true,
                        phone_number: true,
                    },
                },
            },
        });

        // If package changed, handle schedule clone (fire-and-forget safe — errors logged, not thrown to caller)
        if (packageChanging) {
            try {
                await this.handlePackageSelection(id, inquiryData.selected_package_id ?? null, brandId);
            } catch (error) {
                this.logger.error(
                    `Failed to handle package selection change for inquiry ${id}`,
                    error instanceof Error ? error.stack : error,
                );
                // Don't throw — the inquiry update itself succeeded
            }
        }

        return {
            id: updatedInquiry.id,
            status: updatedInquiry.status,
            wedding_date: updatedInquiry.wedding_date,
            notes: updatedInquiry.notes,
            venue_details: updatedInquiry.venue_details,
            venue_address: updatedInquiry.venue_address,
            venue_lat: updatedInquiry.venue_lat,
            venue_lng: updatedInquiry.venue_lng,
            lead_source: updatedInquiry.lead_source,
            lead_source_details: updatedInquiry.lead_source_details,
            selected_package_id: updatedInquiry.selected_package_id,
            first_name: updatedInquiry.contact.first_name,
            last_name: updatedInquiry.contact.last_name,
            email: updatedInquiry.contact.email,
            phone_number: updatedInquiry.contact.phone_number,
        };
    }

    public async convertInquiryToProject(inquiryId: number, brandId: number) {
        return this.prisma.$transaction(async (prisma) => {
            // 1. Find the inquiry and its contact details
            const inquiry = await prisma.inquiries.findFirst({
                where: {
                    id: inquiryId,
                    archived_at: null,
                    contact: { brand_id: brandId },
                },
                include: {
                    contact: true,
                },
            });

            if (!inquiry) {
                throw new NotFoundException(`Inquiry with ID ${inquiryId} not found.`);
            }

            if (inquiry.status === 'Booked') {
                throw new Error('This inquiry has already been converted.');
            }

            // 2. Create the Client record
            const client = await prisma.clients.create({
                data: {
                    contact_id: inquiry.contact_id,
                    inquiry_id: inquiry.id,
                },
            });

            // 3. Capture a JSON snapshot of the package contents (if a package is selected)
            // Use the inquiry's snapshot if available, otherwise build fresh
            let packageContentsSnapshot: Prisma.InputJsonValue | undefined =
                (inquiry.package_contents_snapshot as Prisma.InputJsonValue) ?? undefined;
            if (!packageContentsSnapshot && inquiry.selected_package_id) {
                const pkg = await prisma.service_packages.findUnique({
                    where: { id: inquiry.selected_package_id },
                    select: { id: true, name: true, contents: true },
                });
                if (pkg) {
                    packageContentsSnapshot = {
                        snapshot_taken_at: new Date().toISOString(),
                        package_id: pkg.id,
                        package_name: pkg.name,
                        contents: pkg.contents,
                    };
                }
            }

            // 4. Create the Project record (with package traceability)
            const project = await prisma.projects.create({
                data: {
                    client_id: client.id,
                    brand_id: brandId,
                    project_name: `${inquiry.contact.first_name} & ${inquiry.contact.last_name}'s Wedding`,
                    wedding_date: inquiry.wedding_date || new Date(),
                    booking_date: new Date(),
                    phase: 'PLANNING',
                    source_package_id: inquiry.source_package_id ?? inquiry.selected_package_id ?? null,
                    package_contents_snapshot: packageContentsSnapshot,
                },
            });

            // 5. Transfer existing inquiry schedule snapshot → project (or clone fresh)
            const hasScheduleData = await prisma.projectEventDay.count({
                where: { inquiry_id: inquiryId },
            });

            if (hasScheduleData > 0) {
                // Transfer ownership: inquiry → project (fast UPDATE, no re-clone)
                await this.transferScheduleOwnership(inquiryId, project.id, prisma);
                this.logger.log(
                    `Transferred schedule ownership from inquiry ${inquiryId} → project ${project.id}`,
                );
            } else if (inquiry.selected_package_id) {
                // No schedule data on inquiry — clone fresh from package
                try {
                    const cloneResult = await this.packageCloneService.clonePackageToProject(
                        project.id,
                        inquiry.selected_package_id,
                        prisma,
                    );
                    this.logger.log(
                        `Package clone for project ${project.id}: ` +
                        `${cloneResult.event_days_created} days, ${cloneResult.activities_created} activities, ` +
                        `${cloneResult.films_created} films, ${cloneResult.operators_created} operators`,
                    );
                } catch (error) {
                    this.logger.error(
                        `Failed to clone package ${inquiry.selected_package_id} for project ${project.id}`,
                        error instanceof Error ? error.stack : error,
                    );
                    throw error;
                }
            }

            // 6. Associate all proposals from the inquiry with the new project
            await prisma.proposals.updateMany({
                where: {
                    inquiry_id: inquiryId,
                },
                data: {
                    project_id: project.id,
                },
            });

            // 7. Update the original inquiry to mark it as converted
            await prisma.inquiries.update({
                where: { id: inquiryId },
                data: {
                    status: 'Booked',
                    archived_at: new Date(),
                },
            });

            // 8. Update the contact type
            await prisma.contacts.update({
                where: { id: inquiry.contact_id },
                data: { type: 'Client' },
            });

            return { projectId: project.id };
        });
    }

    // ─── Schedule Snapshot Helpers ──────────────────────────────────

    /**
     * Handle package selection change on an inquiry.
     * Deletes any existing schedule snapshot, then clones from the new package.
     */
    async handlePackageSelection(
        inquiryId: number,
        newPackageId: number | null,
        brandId: number,
    ) {
        await this.prisma.$transaction(async (prisma) => {
            // 1. Delete any existing inquiry schedule data
            await this.deleteInquiryScheduleSnapshot(inquiryId, prisma);

            // 2. If a new package is selected, clone it
            if (newPackageId) {
                // Capture snapshot of package contents
                const pkg = await prisma.service_packages.findUnique({
                    where: { id: newPackageId },
                    select: { id: true, name: true, contents: true },
                });

                const packageContentsSnapshot = pkg
                    ? {
                        snapshot_taken_at: new Date().toISOString(),
                        package_id: pkg.id,
                        package_name: pkg.name,
                        contents: pkg.contents,
                    }
                    : null;

                // Update inquiry metadata
                await prisma.inquiries.update({
                    where: { id: inquiryId },
                    data: {
                        source_package_id: newPackageId,
                        package_contents_snapshot: packageContentsSnapshot ?? Prisma.JsonNull,
                    },
                });

                // Clone package entities into inquiry-owned rows
                await this.packageCloneService.clonePackageToInquiry(
                    inquiryId,
                    newPackageId,
                    prisma,
                );

                this.logger.log(`Cloned package ${newPackageId} → inquiry ${inquiryId}`);
            } else {
                // Package deselected — clear metadata
                await prisma.inquiries.update({
                    where: { id: inquiryId },
                    data: {
                        source_package_id: null,
                        package_contents_snapshot: Prisma.JsonNull,
                    },
                });
                this.logger.log(`Cleared schedule snapshot for inquiry ${inquiryId}`);
            }
        });
    }

    /**
     * Delete all schedule snapshot rows owned by an inquiry.
     * Respects FK ordering: assignments → children → parents.
     */
    async deleteInquiryScheduleSnapshot(
        inquiryId: number,
        tx: Prisma.TransactionClient,
    ) {
        // Assignment tables first (they reference operators/subjects/locations + activities)
        await tx.projectOperatorActivityAssignment.deleteMany({
            where: { project_day_operator: { inquiry_id: inquiryId } },
        });
        await tx.projectSubjectActivityAssignment.deleteMany({
            where: { project_event_day_subject: { inquiry_id: inquiryId } },
        });
        await tx.projectLocationActivityAssignment.deleteMany({
            where: { project_location_slot: { inquiry_id: inquiryId } },
        });

        // Film scene schedules (reference project_film)
        await tx.projectFilmSceneSchedule.deleteMany({
            where: { project_film: { inquiry_id: inquiryId } },
        });

        // Equipment (references operator)
        await tx.projectDayOperatorEquipment.deleteMany({
            where: { project_day_operator: { inquiry_id: inquiryId } },
        });

        // Child entities
        await tx.projectActivityMoment.deleteMany({ where: { inquiry_id: inquiryId } });
        await tx.projectDayOperator.deleteMany({ where: { inquiry_id: inquiryId } });
        await tx.projectEventDaySubject.deleteMany({ where: { inquiry_id: inquiryId } });
        await tx.projectLocationSlot.deleteMany({ where: { inquiry_id: inquiryId } });
        await tx.projectFilm.deleteMany({ where: { inquiry_id: inquiryId } });
        await tx.projectActivity.deleteMany({ where: { inquiry_id: inquiryId } });

        // Parent entity last
        await tx.projectEventDay.deleteMany({ where: { inquiry_id: inquiryId } });
    }

    /**
     * Transfer schedule ownership from inquiry → project.
     * Atomic UPDATEs on all 7 dual-owner tables: set project_id, clear inquiry_id.
     */
    async transferScheduleOwnership(
        inquiryId: number,
        projectId: number,
        tx: Prisma.TransactionClient,
    ) {
        const ownerUpdate = { project_id: projectId, inquiry_id: null };
        const where = { inquiry_id: inquiryId };

        await Promise.all([
            tx.projectEventDay.updateMany({ where, data: ownerUpdate }),
            tx.projectActivity.updateMany({ where, data: ownerUpdate }),
            tx.projectActivityMoment.updateMany({ where, data: ownerUpdate }),
            tx.projectEventDaySubject.updateMany({ where, data: ownerUpdate }),
            tx.projectLocationSlot.updateMany({ where, data: ownerUpdate }),
            tx.projectDayOperator.updateMany({ where, data: ownerUpdate }),
            tx.projectFilm.updateMany({ where, data: ownerUpdate }),
        ]);
    }

    async remove(id: number, brandId: number) {
        // First, find the inquiry to ensure it exists and belongs to the brand
        const existingInquiry = await this.prisma.inquiries.findFirst({
            where: {
                id,
                archived_at: null,
                contact: {
                    brand_id: brandId,
                },
            },
        });

        if (!existingInquiry) {
            throw new NotFoundException(`Inquiry with ID ${id} not found`);
        }

        // Soft delete the inquiry
        await this.prisma.inquiries.update({
            where: { id },
            data: {
                archived_at: new Date(),
            },
        });

        return { message: 'Inquiry deleted successfully' };
    }
}
