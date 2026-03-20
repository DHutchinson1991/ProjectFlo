import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInquiryDto, UpdateInquiryDto } from './dto/inquiries.dto';
import { $Enums, Prisma } from '@prisma/client';
import { ProjectPackageCloneService, parseGuestCountMidpoint } from '../projects/project-package-clone.service';
import { InquiryTasksService } from '../inquiry-tasks/inquiry-tasks.service';

/** User-entered schedule data stashed before a package swap */
interface ScheduleUserDataStash {
    subjects: Array<{
        roleName: string;
        realName: string | null;
        notes: string | null;
        count: number | null;
    }>;
    locations: Array<{
        activityName: string | null;
        locationNumber: number;
        name: string | null;
        address: string | null;
        locationId: number | null;
        notes: string | null;
    }>;
    crew: Array<{
        positionName: string;
        eventDayOrder: number;
        contributorId: number | null;
        notes: string | null;
    }>;
}

/** Result of restoring stashed data after swap */
interface SwapRestoreResult {
    subjects: { restored: number; unmatched: string[] };
    locations: { restored: number; unmatched: string[] };
    crew: { restored: number; unmatched: string[] };
}

@Injectable()
export class InquiriesService {
    private readonly logger = new Logger(InquiriesService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly packageCloneService: ProjectPackageCloneService,
        private readonly inquiryTasksService: InquiryTasksService,
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
                selected_package: {
                    select: {
                        id: true,
                        name: true,
                        base_price: true,
                        currency: true,
                    },
                },
                estimates: {
                    select: { id: true, total_amount: true, tax_rate: true, is_primary: true, status: true, created_at: true },
                    orderBy: [{ is_primary: 'desc' }, { id: 'desc' }],
                    take: 3,
                },
                quotes: {
                    select: { id: true, total_amount: true, tax_rate: true, is_primary: true, status: true },
                    orderBy: [{ is_primary: 'desc' }, { id: 'desc' }],
                    take: 3,
                },
                proposals: {
                    select: { id: true, status: true },
                    orderBy: { id: 'desc' },
                    take: 1,
                },
                contracts: {
                    select: { id: true, status: true },
                    orderBy: { id: 'desc' },
                    take: 1,
                },
                event_type: {
                    select: { id: true, name: true },
                },
                inquiry_tasks: {
                    where: { is_active: true, is_stage: true },
                    orderBy: { order_index: 'asc' },
                    select: {
                        id: true,
                        name: true,
                        stage_color: true,
                        order_index: true,
                        children: {
                            where: { is_active: true },
                            select: { id: true, status: true },
                        },
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
            created_at: inquiry.created_at,
            updated_at: inquiry.updated_at,
            contact: {
                id: inquiry.contact_id,
                first_name: inquiry.contact.first_name,
                last_name: inquiry.contact.last_name,
                email: inquiry.contact.email,
                phone_number: inquiry.contact.phone_number,
            },
            contact_id: inquiry.contact_id,
            selected_package_id: inquiry.selected_package_id,
            selected_package: inquiry.selected_package
                ? {
                      id: inquiry.selected_package.id,
                      name: inquiry.selected_package.name,
                      base_price: inquiry.selected_package.base_price,
                      currency: inquiry.selected_package.currency,
                  }
                : null,
            primary_estimate_total: inquiry.estimates.length > 0
                ? (() => {
                      const amt = Number(inquiry.estimates[0].total_amount);
                      const rate = Number(inquiry.estimates[0].tax_rate ?? 0);
                      return Math.round((amt * (1 + rate / 100)) * 100) / 100;
                  })()
                : null,
            primary_quote_total: inquiry.quotes.length > 0
                ? (() => {
                      const amt = Number(inquiry.quotes[0].total_amount);
                      const rate = Number(inquiry.quotes[0].tax_rate ?? 0);
                      return Math.round((amt * (1 + rate / 100)) * 100) / 100;
                  })()
                : null,
            pipeline_stage: (() => {
                // Dynamic: derive from task hierarchy if stages exist
                const stages = inquiry.inquiry_tasks;
                if (stages.length > 0) {
                    // Find the first stage where NOT all children are completed
                    for (const stage of stages) {
                        if (stage.children.length === 0) continue;
                        const allDone = stage.children.every(c => c.status === 'Completed');
                        if (!allDone) return stage.name;
                    }
                    // All stages complete — last stage name
                    return stages[stages.length - 1].name;
                }
                // Fallback: legacy heuristic for inquiries without tasks generated
                if (inquiry.contracts.length > 0) return 'Contract Stage';
                if (inquiry.proposals.length > 0) return 'Proposal Sent';
                const ests = inquiry.estimates;
                if (ests.some(e => e.status === 'Accepted')) return 'Estimate Accepted';
                if (ests.some(e => e.status === 'Sent')) return 'Estimate Sent';
                if (ests.length > 0) return 'Estimate Created';
                return 'New Lead';
            })(),
            // Include stage definitions for dynamic kanban columns
            pipeline_stages: inquiry.inquiry_tasks.map(s => ({
                name: s.name,
                color: s.stage_color,
                order_index: s.order_index,
                total_children: s.children.length,
                completed_children: s.children.filter(c => c.status === 'Completed').length,
            })),
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
            select: {
                id: true,
                status: true,
                wedding_date: true,
                notes: true,
                venue_details: true,
                venue_address: true,
                venue_lat: true,
                venue_lng: true,
                lead_source: true,
                lead_source_details: true,
                selected_package_id: true,
                source_package_id: true,
                contact_id: true,
                package_contents_snapshot: true,
                preferred_payment_schedule_template_id: true,
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
                estimates: {
                    orderBy: { id: 'desc' },
                },
                proposals: {
                    orderBy: { id: 'desc' },
                },
                quotes: {
                    orderBy: { id: 'desc' },
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
                event_type_id: true,
                event_type: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                schedule_day_operators: {
                    where: {
                        contributor_id: { not: null },
                        OR: [
                            { position_name: { contains: 'producer', mode: 'insensitive' } },
                            {
                                job_role: {
                                    is: {
                                        name: { contains: 'producer', mode: 'insensitive' },
                                    },
                                },
                            },
                            {
                                job_role: {
                                    is: {
                                        display_name: { contains: 'producer', mode: 'insensitive' },
                                    },
                                },
                            },
                            {
                                contributor: {
                                    is: {
                                        contributor_job_roles: {
                                            some: {
                                                job_role: {
                                                    OR: [
                                                        { name: { contains: 'producer', mode: 'insensitive' } },
                                                        { display_name: { contains: 'producer', mode: 'insensitive' } },
                                                    ],
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        ],
                    },
                    orderBy: [{ order_index: 'asc' }],
                    take: 1,
                    select: {
                        id: true,
                        position_name: true,
                        contributor: {
                            select: {
                                id: true,
                                contact: {
                                    select: {
                                        first_name: true,
                                        last_name: true,
                                        email: true,
                                    },
                                },
                            },
                        },
                        job_role: {
                            select: {
                                id: true,
                                name: true,
                                display_name: true,
                            },
                        },
                    },
                },
                inquiry_tasks: {
                    where: {
                        is_stage: false,
                        assigned_to_id: { not: null },
                        job_role: {
                            is: {
                                OR: [
                                    { name: { contains: 'producer', mode: 'insensitive' } },
                                    { display_name: { contains: 'producer', mode: 'insensitive' } },
                                ],
                            },
                        },
                    },
                    take: 1,
                    orderBy: [{ order_index: 'asc' }],
                    select: {
                        id: true,
                        assigned_to: {
                            select: {
                                id: true,
                                contact: {
                                    select: {
                                        first_name: true,
                                        last_name: true,
                                        email: true,
                                    },
                                },
                            },
                        },
                        job_role: {
                            select: {
                                id: true,
                                name: true,
                                display_name: true,
                            },
                        },
                    },
                },
                welcome_sent_at: true,
                created_at: true,
                updated_at: true,
            },
        });

        if (!inquiry) {
            throw new NotFoundException(`Inquiry with ID ${id} not found`);
        }

        const leadProducerAssignment = inquiry.schedule_day_operators[0] ?? null;
        const fallbackTask = inquiry.inquiry_tasks[0] ?? null;
        const leadProducer = leadProducerAssignment?.contributor
            ? {
                id: leadProducerAssignment.contributor.id,
                name: `${leadProducerAssignment.contributor.contact.first_name} ${leadProducerAssignment.contributor.contact.last_name}`.trim(),
                email: leadProducerAssignment.contributor.contact.email,
                position_name: leadProducerAssignment.position_name,
                job_role_name: leadProducerAssignment.job_role?.display_name ?? leadProducerAssignment.job_role?.name ?? null,
            }
            : fallbackTask?.assigned_to
            ? {
                id: fallbackTask.assigned_to.id,
                name: `${fallbackTask.assigned_to.contact.first_name} ${fallbackTask.assigned_to.contact.last_name}`.trim(),
                email: fallbackTask.assigned_to.contact.email,
                position_name: null,
                job_role_name: fallbackTask.job_role?.display_name ?? fallbackTask.job_role?.name ?? null,
            }
            : null;

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
            source_package_id: inquiry.source_package_id ?? null,
            package_contents_snapshot: inquiry.package_contents_snapshot ?? null,
            preferred_payment_schedule_template_id: inquiry.preferred_payment_schedule_template_id ?? null,
            created_at: inquiry.created_at,
            updated_at: inquiry.updated_at,
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
            event_type_id: inquiry.event_type_id ?? null,
            event_type: inquiry.event_type ?? null,
            estimates: inquiry.estimates,
            proposals: inquiry.proposals,
            quotes: inquiry.quotes,
            contracts: inquiry.contracts,
            invoices: inquiry.invoices,
            lead_producer: leadProducer,
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
                venue_address: inquiryData.venue_address ?? null,
                venue_lat: inquiryData.venue_lat ?? null,
                venue_lng: inquiryData.venue_lng ?? null,
                guest_count: inquiryData.guest_count,
                lead_source: inquiryData.lead_source,
                lead_source_details: inquiryData.lead_source_details,
                selected_package_id: inquiryData.selected_package_id ?? null,
                preferred_payment_schedule_template_id: inquiryData.preferred_payment_schedule_template_id ?? null,
                event_type_id: inquiryData.event_type_id ?? null,
                portal_token: randomUUID(),
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

        // Auto-generate pipeline tasks from task library
        try {
            await this.inquiryTasksService.generateForInquiry(inquiry.id, brandId);
        } catch (err) {
            this.logger.warn(`Failed to auto-generate inquiry tasks for inquiry ${inquiry.id}: ${err}`);
        }

        if (inquiryData.selected_package_id) {
            try {
                await this.handlePackageSelection(inquiry.id, inquiryData.selected_package_id, brandId);
            } catch (err) {
                this.logger.error(
                    `Failed to create package snapshot for inquiry ${inquiry.id}`,
                    err instanceof Error ? err.stack : String(err),
                );
            }
        }

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
                // Track venue source and timestamp when any venue field changes
                ...((inquiryData.venue_details !== undefined || inquiryData.venue_address !== undefined) && {
                    venue_source: inquiryData.venue_source || 'manual',
                    venue_updated_at: new Date(),
                }),
                ...(inquiryData.lead_source !== undefined && { lead_source: inquiryData.lead_source }),
                ...(inquiryData.lead_source_details !== undefined && { lead_source_details: inquiryData.lead_source_details }),
                ...(inquiryData.selected_package_id !== undefined && { selected_package_id: inquiryData.selected_package_id }),
                ...(inquiryData.preferred_payment_schedule_template_id !== undefined && {
                    preferred_payment_schedule_template_id: inquiryData.preferred_payment_schedule_template_id,
                }),
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

        // Re-evaluate review auto-subtasks when inquiry data changes.
        await this.inquiryTasksService.syncReviewInquiryAutoSubtasks(id);

        // Status-change hooks
        if (inquiryData.status && inquiryData.status !== existingInquiry.status) {
            const newStatus = inquiryData.status as string;

            if (newStatus === 'Booked') {
                // Create a WEDDING_DAY calendar event if a wedding date exists
                if (updatedInquiry.wedding_date) {
                    try {
                        const existing = await this.prisma.calendar_events.findFirst({
                            where: { inquiry_id: id, event_type: 'WEDDING_DAY' },
                        });
                        if (!existing) {
                            // Find a contributor to associate (required field on calendar_events)
                            const contributor = await this.prisma.contributors.findFirst({
                                where: { contact: { brand_id: existingInquiry.contact.brand_id } },
                                select: { id: true },
                            });
                            if (contributor) {
                                await this.prisma.calendar_events.create({
                                    data: {
                                        inquiry_id: id,
                                        contributor_id: contributor.id,
                                        event_type: 'WEDDING_DAY',
                                        title: 'Wedding Day',
                                        start_time: updatedInquiry.wedding_date,
                                        end_time: updatedInquiry.wedding_date,
                                        is_all_day: true,
                                    },
                                });
                            }
                        }
                    } catch (err) {
                        this.logger.error(`Failed to create WEDDING_DAY event for inquiry ${id}`, err);
                    }
                }
                await this.inquiryTasksService.autoCompleteByName(id, 'Block Wedding Date');
                await this.inquiryTasksService.autoCompleteByName(id, 'Confirm Booking');
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
            preferred_payment_schedule_template_id: updatedInquiry.preferred_payment_schedule_template_id,
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
                    select: { id: true, name: true, base_price: true, currency: true, contents: true },
                });
                if (pkg) {
                    packageContentsSnapshot = {
                        snapshot_taken_at: new Date().toISOString(),
                        package_id: pkg.id,
                        package_name: pkg.name,
                        base_price: pkg.base_price ? Number(pkg.base_price) : 0,
                        currency: pkg.currency ?? 'USD',
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

    /** Shape of user-entered data stashed before a package swap */
    private _emptyStash(): ScheduleUserDataStash {
        return { subjects: [], locations: [], crew: [] };
    }

    /**
     * Extract user-entered data from the current inquiry schedule
     * so it can be restored after re-cloning a different package.
     */
    private async _stashUserData(
        inquiryId: number,
        tx: Prisma.TransactionClient,
    ): Promise<ScheduleUserDataStash> {
        const [subjects, locations, crew] = await Promise.all([
            tx.projectEventDaySubject.findMany({
                where: {
                    inquiry_id: inquiryId,
                    OR: [{ real_name: { not: null } }, { notes: { not: null } }],
                },
                select: { name: true, real_name: true, notes: true, count: true },
            }),
            tx.projectLocationSlot.findMany({
                where: {
                    inquiry_id: inquiryId,
                    OR: [{ name: { not: null } }, { address: { not: null } }, { notes: { not: null } }],
                },
                select: {
                    location_number: true,
                    name: true,
                    address: true,
                    location_id: true,
                    notes: true,
                    project_activity: { select: { name: true } },
                },
            }),
            tx.projectDayOperator.findMany({
                where: { inquiry_id: inquiryId, contributor_id: { not: null } },
                select: {
                    position_name: true,
                    contributor_id: true,
                    notes: true,
                    project_event_day: { select: { order_index: true } },
                },
            }),
        ]);

        return {
            subjects: subjects.map(s => ({
                roleName: s.name,
                realName: s.real_name,
                notes: s.notes,
                count: s.count,
            })),
            locations: locations.map(l => ({
                activityName: l.project_activity?.name ?? null,
                locationNumber: l.location_number,
                name: l.name,
                address: l.address,
                locationId: l.location_id,
                notes: l.notes,
            })),
            crew: crew.map(c => ({
                positionName: c.position_name,
                eventDayOrder: c.project_event_day?.order_index ?? 0,
                contributorId: c.contributor_id,
                notes: c.notes,
            })),
        };
    }

    /**
     * Best-effort restore of stashed user data onto freshly-cloned schedule rows.
     * Returns counts of matched vs unmatched items.
     */
    private async _restoreUserData(
        inquiryId: number,
        stash: ScheduleUserDataStash,
        tx: Prisma.TransactionClient,
    ): Promise<SwapRestoreResult> {
        const result: SwapRestoreResult = {
            subjects: { restored: 0, unmatched: [] },
            locations: { restored: 0, unmatched: [] },
            crew: { restored: 0, unmatched: [] },
        };

        // ── Restore subject real_names (match by role name) ──
        for (const stashed of stash.subjects) {
            if (!stashed.realName && !stashed.notes) continue;
            const match = await tx.projectEventDaySubject.findFirst({
                where: {
                    inquiry_id: inquiryId,
                    name: { equals: stashed.roleName, mode: 'insensitive' },
                },
            });
            if (match) {
                await tx.projectEventDaySubject.update({
                    where: { id: match.id },
                    data: {
                        ...(stashed.realName && { real_name: stashed.realName }),
                        ...(stashed.notes && { notes: stashed.notes }),
                    },
                });
                result.subjects.restored++;
            } else {
                result.subjects.unmatched.push(stashed.roleName);
            }
        }

        // ── Restore location data (match by activity name + slot number) ──
        for (const stashed of stash.locations) {
            if (!stashed.name && !stashed.address && !stashed.notes) continue;
            const match = await tx.projectLocationSlot.findFirst({
                where: {
                    inquiry_id: inquiryId,
                    location_number: stashed.locationNumber,
                    ...(stashed.activityName
                        ? { project_activity: { name: { equals: stashed.activityName, mode: 'insensitive' } } }
                        : {}),
                },
            });
            if (match) {
                await tx.projectLocationSlot.update({
                    where: { id: match.id },
                    data: {
                        ...(stashed.name && { name: stashed.name }),
                        ...(stashed.address && { address: stashed.address }),
                        ...(stashed.locationId && { location_id: stashed.locationId }),
                        ...(stashed.notes && { notes: stashed.notes }),
                    },
                });
                result.locations.restored++;
            } else {
                result.locations.unmatched.push(stashed.name || `Slot ${stashed.locationNumber}`);
            }
        }

        // ── Restore crew assignments (match by position name + day order) ──
        for (const stashed of stash.crew) {
            if (!stashed.contributorId) continue;
            const match = await tx.projectDayOperator.findFirst({
                where: {
                    inquiry_id: inquiryId,
                    position_name: { equals: stashed.positionName, mode: 'insensitive' },
                    project_event_day: { order_index: stashed.eventDayOrder },
                },
            });
            if (match) {
                await tx.projectDayOperator.update({
                    where: { id: match.id },
                    data: {
                        contributor_id: stashed.contributorId,
                        ...(stashed.notes && { notes: stashed.notes }),
                    },
                });
                result.crew.restored++;
            } else {
                result.crew.unmatched.push(stashed.positionName);
            }
        }

        return result;
    }

    /**
     * Clone a package into the inquiry schedule, updating metadata + snapshot.
     */
    private async _clonePackageToInquiry(
        inquiryId: number,
        newPackageId: number,
        tx: Prisma.TransactionClient,
    ) {
        // Fetch inquiry guest_count to prefill Guests subject during clone
        const inquiry = await tx.inquiries.findUnique({
            where: { id: inquiryId },
            select: { guest_count: true },
        });
        const guestCount = parseGuestCountMidpoint(inquiry?.guest_count) ?? undefined;

        const pkg = await tx.service_packages.findUnique({
            where: { id: newPackageId },
            select: { id: true, name: true, base_price: true, currency: true, contents: true },
        });

        const packageContentsSnapshot = pkg
            ? {
                snapshot_taken_at: new Date().toISOString(),
                package_id: pkg.id,
                package_name: pkg.name,
                base_price: pkg.base_price ? Number(pkg.base_price) : 0,
                currency: pkg.currency ?? 'USD',
                contents: pkg.contents,
            }
            : null;

        await tx.inquiries.update({
            where: { id: inquiryId },
            data: {
                source_package_id: newPackageId,
                package_contents_snapshot: packageContentsSnapshot ?? Prisma.JsonNull,
            },
        });

        await this.packageCloneService.clonePackageToInquiry(
            inquiryId, newPackageId, tx,
            guestCount ? { guestCount } : undefined,
        );
    }

    /**
     * Handle package selection change on an inquiry.
     * If swapping from an existing package, stashes user-entered data (subject names,
     * location addresses, crew assignments) and restores them after re-cloning.
     * Estimates, quotes, contracts, and proposals are never affected.
     */
    async handlePackageSelection(
        inquiryId: number,
        newPackageId: number | null,
        brandId: number,
    ) {
        const inquiry = await this.prisma.inquiries.findUnique({
            where: { id: inquiryId },
            select: { source_package_id: true },
        });

        const hadPreviousPackage = !!inquiry?.source_package_id;

        if (newPackageId && hadPreviousPackage) {
            // ── SWAP: stash user data → delete → clone → restore ──
            const swapResult = await this.prisma.$transaction(async (tx) => {
                const stash = await this._stashUserData(inquiryId, tx);
                await this.deleteInquiryScheduleSnapshot(inquiryId, tx);
                await this._clonePackageToInquiry(inquiryId, newPackageId, tx);
                const restoreResult = await this._restoreUserData(inquiryId, stash, tx);
                return restoreResult;
            });
            this.logger.log(
                `Swapped package → ${newPackageId} for inquiry ${inquiryId}. ` +
                `Restored: ${swapResult.subjects.restored} subjects, ${swapResult.locations.restored} locations, ${swapResult.crew.restored} crew`,
            );
            // Update primary estimate title to match the new package name
            await this._syncPrimaryEstimateTitle(inquiryId, newPackageId);
        } else if (newPackageId) {
            // ── FIRST ASSIGNMENT: clean clone ──
            await this.prisma.$transaction(async (tx) => {
                await this.deleteInquiryScheduleSnapshot(inquiryId, tx);
                await this._clonePackageToInquiry(inquiryId, newPackageId, tx);
            });
            this.logger.log(`Cloned package ${newPackageId} → inquiry ${inquiryId}`);
            // Update primary estimate title to match the new package name
            await this._syncPrimaryEstimateTitle(inquiryId, newPackageId);
        } else {
            // ── DESELECT: clear schedule + metadata ──
            await this.prisma.$transaction(async (tx) => {
                await this.deleteInquiryScheduleSnapshot(inquiryId, tx);
                await tx.inquiries.update({
                    where: { id: inquiryId },
                    data: {
                        source_package_id: null,
                        package_contents_snapshot: Prisma.JsonNull,
                    },
                });
            });
            this.logger.log(`Cleared schedule snapshot for inquiry ${inquiryId}`);
        }
    }

    /**
     * When a package is assigned or swapped, update the primary estimate's title
     * to match the new package name (preserving version history).
     */
    private async _syncPrimaryEstimateTitle(inquiryId: number, packageId: number) {
        const pkg = await this.prisma.service_packages.findUnique({
            where: { id: packageId },
            select: { name: true },
        });
        if (!pkg?.name) return;

        const primaryEstimate = await this.prisma.estimates.findFirst({
            where: { inquiry_id: inquiryId, is_primary: true },
            select: { id: true, title: true },
        });
        if (!primaryEstimate || primaryEstimate.title === pkg.name) return;

        await this.prisma.estimates.update({
            where: { id: primaryEstimate.id },
            data: { title: pkg.name },
        });
        this.logger.log(
            `Updated primary estimate ${primaryEstimate.id} title "${primaryEstimate.title}" → "${pkg.name}"`,
        );
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

        await this.prisma.$transaction(async (tx) => {
            // Soft-deleted inquiries should not leave active pipeline tasks behind.
            await tx.inquiry_tasks.deleteMany({
                where: { inquiry_id: id },
            });

            // Soft delete the inquiry itself.
            await tx.inquiries.update({
                where: { id },
                data: {
                    archived_at: new Date(),
                },
            });
        });

        return { message: 'Inquiry deleted successfully' };
    }

    async sendWelcomePack(id: number, brandId: number): Promise<{ welcome_sent_at: Date }> {
        const inquiry = await this.prisma.inquiries.findFirst({
            where: { id, archived_at: null, contact: { brand_id: brandId } },
            select: { id: true },
        });
        if (!inquiry) throw new NotFoundException(`Inquiry with ID ${id} not found`);

        const updated = await this.prisma.inquiries.update({
            where: { id },
            data: { welcome_sent_at: new Date() },
            select: { welcome_sent_at: true },
        });

        await this.inquiryTasksService.autoCompleteByName(id, 'Send Welcome Pack');

        return { welcome_sent_at: updated.welcome_sent_at! };
    }

    async getDiscoveryCall(inquiryId: number, brandId: number) {
        // Verify the inquiry is accessible
        const inquiry = await this.prisma.inquiries.findFirst({
            where: { id: inquiryId, archived_at: null, contact: { brand_id: brandId } },
            select: { id: true },
        });
        if (!inquiry) throw new NotFoundException(`Inquiry ${inquiryId} not found`);

        // Find the most relevant discovery call — prefer upcoming, fall back to most recent
        const now = new Date();
        const upcoming = await this.prisma.calendar_events.findFirst({
            where: {
                inquiry_id: inquiryId,
                event_type: 'DISCOVERY_CALL',
                start_time: { gte: now },
            },
            orderBy: { start_time: 'asc' },
            select: {
                id: true,
                title: true,
                start_time: true,
                end_time: true,
                meeting_type: true,
                meeting_url: true,
                location: true,
                is_confirmed: true,
            },
        });

        if (upcoming) return upcoming;

        // Fall back to most recent past call
        return this.prisma.calendar_events.findFirst({
            where: { inquiry_id: inquiryId, event_type: 'DISCOVERY_CALL' },
            orderBy: { start_time: 'desc' },
            select: {
                id: true,
                title: true,
                start_time: true,
                end_time: true,
                meeting_type: true,
                meeting_url: true,
                location: true,
                is_confirmed: true,
            },
        });
    }
}
