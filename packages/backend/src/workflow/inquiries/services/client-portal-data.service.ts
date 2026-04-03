import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { ClientPortalSectionsService } from './client-portal-sections.service';
import { ClientPortalJourneyService } from './client-portal-journey.service';

const PORTAL_INCLUDE = {
    contact: {
        select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            phone_number: true,
            brand_id: true,
        },
    },
    inquiry_wizard_submissions: {
        include: {
            template: {
                include: {
                    questions: { orderBy: { order_index: 'asc' as const } },
                },
            },
        },
        orderBy: { id: 'desc' as const },
        take: 1,
    },
    proposals: {
        where: { status: { in: ['Sent', 'Accepted', 'ChangesRequested'] } },
        orderBy: { id: 'desc' as const },
        take: 1,
        select: {
            id: true,
            status: true,
            title: true,
            content: true,
            share_token: true,
            client_response: true,
            client_response_at: true,
            client_response_message: true,
            section_notes: {
                select: { section_type: true, note: true, created_at: true, updated_at: true },
            },
        },
    },
    contracts: {
        where: { status: { in: ['Sent', 'Signed'] } },
        orderBy: { id: 'desc' as const },
        take: 1,
        select: {
            id: true,
            title: true,
            status: true,
            signing_token: true,
            signed_date: true,
            sent_at: true,
            signers: {
                select: { id: true, name: true, role: true, status: true, signed_at: true },
            },
        },
    },
    estimates: {
        where: { status: { in: ['Sent', 'Approved', 'Accepted'] } },
        orderBy: [{ is_primary: 'desc' as const }, { id: 'desc' as const }],
        take: 1,
        select: {
            id: true,
            estimate_number: true,
            title: true,
            status: true,
            total_amount: true,
            tax_rate: true,
            issue_date: true,
            expiry_date: true,
            notes: true,
            deposit_required: true,
            payment_method: true,
            items: {
                select: { id: true, description: true, quantity: true, unit_price: true, unit: true, category: true },
                orderBy: { id: 'asc' as const },
            },
            payment_milestones: {
                select: { id: true, label: true, amount: true, due_date: true, status: true, order_index: true },
                orderBy: { order_index: 'asc' as const },
            },
        },
    },
    invoices: {
        where: { status: { notIn: ['Draft', 'Cancelled', 'Voided'] } },
        orderBy: { due_date: 'asc' as const },
        select: {
            id: true, invoice_number: true, title: true, status: true,
            amount: true, subtotal: true, tax_rate: true, due_date: true,
            issue_date: true, amount_paid: true, currency: true,
            notes: true, terms: true, payment_method: true,
            milestone_id: true,
            items: {
                select: { id: true, description: true, category: true, quantity: true, unit_price: true },
                orderBy: { id: 'asc' as const },
            },
            payments: {
                select: {
                    id: true,
                    payment_date: true,
                    amount: true,
                    payment_method: true,
                    transaction_id: true,
                    receipt_url: true,
                    card_brand: true,
                    card_last4: true,
                    payer_email: true,
                    currency: true,
                },
                orderBy: { payment_date: 'desc' as const },
            },
            milestone: {
                select: { id: true, label: true, amount: true, due_date: true, status: true, order_index: true },
            },
        },
    },
    selected_package: {
        select: {
            id: true, name: true, currency: true, description: true, contents: true,
            _count: {
                select: {
                    package_event_days: true,
                    package_crew_slots: true,
                    package_event_day_locations: true,
                },
            },
            package_crew_slots: {
                select: {
                    crew_id: true,
                    equipment: {
                        select: {
                            equipment: { select: { category: true } },
                        },
                    },
                },
            },
        },
    },
    event_type: { select: { id: true, name: true } },
    preferred_payment_schedule: {
        select: {
            id: true,
            name: true,
            rules: {
                select: { label: true, amount_type: true, amount_value: true, trigger_type: true, trigger_days: true, order_index: true },
                orderBy: { order_index: 'asc' as const },
            },
        },
    },
    schedule_event_days: {
        orderBy: { date: 'asc' as const },
        include: {
            activities: {
                orderBy: { order_index: 'asc' as const },
                include: {
                    moments: {
                        orderBy: { order_index: 'asc' as const },
                        select: { id: true, name: true, order_index: true, duration_seconds: true, is_required: true },
                    },
                },
            },
            subjects: {
                orderBy: { order_index: 'asc' as const },
                select: { id: true, name: true, real_name: true, count: true, order_index: true },
            },
            location_slots: {
                orderBy: { order_index: 'asc' as const },
                include: {
                    location: {
                        select: { id: true, name: true, address_line1: true, city: true, state: true, country: true, lat: true, lng: true },
                    },
                },
            },
            day_crew_slots: {
                orderBy: { order_index: 'asc' as const },
                include: {
                    crew: {
                        include: {
                            contact: { select: { first_name: true, last_name: true } },
                        },
                    },
                    job_role: { select: { name: true, display_name: true, on_site: true, category: true } },
                    equipment: {
                        include: {
                            equipment: { select: { id: true, item_name: true, category: true, type: true } },
                        },
                    },
                    activity_assignments: {
                        select: { project_activity_id: true },
                    },
                },
            },
        },
    },
    schedule_films: {
        orderBy: { order_index: 'asc' as const },
        include: {
            film: {
                select: {
                    id: true, name: true, film_type: true,
                    target_duration_min: true, target_duration_max: true,
                    _count: { select: { scenes: true } },
                    scenes: {
                        orderBy: { order_index: 'asc' as const },
                        select: {
                            id: true, name: true, order_index: true, duration_seconds: true, mode: true,
                            moments: { orderBy: { order_index: 'asc' as const }, select: { id: true, name: true, order_index: true, duration: true } },
                            location_assignment: { select: { location: { select: { name: true, address_line1: true } } } },
                        },
                    },
                    equipment_assignments: {
                        select: {
                            quantity: true,
                            equipment: { select: { item_name: true, category: true } },
                        },
                    },
                },
            },
            instance_tracks: {
                orderBy: { order_index: 'asc' as const },
                select: {
                    id: true, name: true, type: true, order_index: true, is_active: true, is_unmanned: true,
                    crew_id: true,
                    crew: {
                        include: {
                            contact: { select: { first_name: true, last_name: true } },
                        },
                    },
                },
            },
            instance_subjects: {
                select: { id: true, name: true },
            },
            instance_scenes: {
                orderBy: { order_index: 'asc' as const },
                select: {
                    id: true, name: true, order_index: true, mode: true,
                    moments: {
                        orderBy: { order_index: 'asc' as const },
                        select: {
                            id: true, name: true, order_index: true, duration: true,
                            recording_setup: {
                                select: {
                                    audio_track_ids: true,
                                    camera_assignments: {
                                        select: { track_id: true, subject_ids: true, shot_type: true },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    },
} satisfies Prisma.inquiriesInclude;

export type PortalInquiry = NonNullable<Prisma.inquiriesGetPayload<{ include: typeof PORTAL_INCLUDE }>>;

@Injectable()
export class ClientPortalDataService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly sectionsService: ClientPortalSectionsService,
        private readonly journeyService: ClientPortalJourneyService,
    ) {}

    async getPortalByToken(token: string) {
        const inquiry = await this.prisma.inquiries.findUnique({
            where: { portal_token: token },
            include: PORTAL_INCLUDE,
        });
        if (!inquiry) throw new NotFoundException('Portal not found');

        await this._resolveFilmSubjectNames(inquiry);
        const packageFilms = await this.resolvePackageFilms(inquiry);
        const brand = await this.fetchBrand(inquiry.contact.brand_id!);
        const payload = this.sectionsService.buildPortalPayload(inquiry, packageFilms, brand as Record<string, unknown>);

        // Fetch active payment methods for the brand
        const paymentMethods = await this.prisma.payment_methods.findMany({
            where: { brand_id: inquiry.contact.brand_id!, is_active: true },
            orderBy: [{ is_default: 'desc' }, { order_index: 'asc' }],
            select: { id: true, type: true, label: true, is_default: true },
        });

        // Fetch task library entries grouped by phase for this brand
        const brandId = inquiry.contact.brand_id!;
        const rawTasks = await this.prisma.task_library.findMany({
            where: { brand_id: brandId, is_active: true },
            select: {
                phase: true, name: true, description: true,
                is_task_group: true, parent_task_id: true, order_index: true,
                is_customer_facing: true, customer_description: true,
                requires_client_action: true, client_deliverable_description: true,
            },
            orderBy: [{ phase: 'asc' }, { order_index: 'asc' }],
        });
        const phaseMap = new Map<string, { name: string; isGroup: boolean; description: string | null; requiresAction: boolean; deliverable: string | null }[]>();
        for (const t of rawTasks) {
            if (!phaseMap.has(t.phase)) phaseMap.set(t.phase, []);
            if (!t.parent_task_id && t.is_customer_facing) {
                phaseMap.get(t.phase)!.push({
                    name: t.name,
                    isGroup: t.is_task_group,
                    description: t.customer_description ?? t.description ?? null,
                    requiresAction: t.requires_client_action,
                    deliverable: t.client_deliverable_description ?? null,
                });
            }
        }
        const projectPhases = Array.from(phaseMap.entries()).map(([phase, tasks]) => ({
            phase,
            taskCount: tasks.length,
            tasks: tasks.map((t) => t.name),
            taskDetails: tasks.map((t) => ({
                name: t.name,
                description: t.description,
                requiresAction: t.requiresAction,
                deliverable: t.deliverable,
            })),
        }));

        const proposal = inquiry.proposals[0] ?? null;
        const contract = inquiry.contracts[0] ?? null;
        const estimate = inquiry.estimates[0] ?? null;
        const journeySteps = await this.journeyService.buildJourneySteps(inquiry.id, token, {
            questionnaire: inquiry.inquiry_wizard_submissions.length > 0,
            estimate: !!estimate,
            proposalStatus: proposal?.status ?? null,
            proposalShareToken: proposal?.share_token ?? null,
            proposalClientResponse: proposal?.client_response ?? null,
            contractStatus: contract?.status ?? null,
            contractSigningToken: contract?.signing_token ?? null,
            inquiryStatus: inquiry.status,
            welcomeSentAt: inquiry.welcome_sent_at,
        }, {
            packageName: inquiry.selected_package?.name ?? undefined,
            estimateTotal: estimate?.total_amount ? Number(estimate.total_amount) : undefined,
            currency: inquiry.selected_package?.currency ?? undefined,
            eventDate: inquiry.wedding_date
                ? inquiry.wedding_date.toISOString() : undefined,
        });

        return { ...payload, payment_methods: paymentMethods, journeySteps, projectPhases };
    }

    private async resolvePackageFilms(inquiry: PortalInquiry): Promise<{ id: number; name: string }[]> {
        const pkgContents = inquiry.selected_package?.contents as { films?: number[] } | null;
        if (!pkgContents?.films?.length) return [];
        return this.prisma.film.findMany({
            where: { id: { in: pkgContents.films } },
            select: { id: true, name: true },
        });
    }

    private async fetchBrand(brandId: number) {
        return this.prisma.brands.findUnique({
            where: { id: brandId },
            select: {
                id: true, name: true, display_name: true, description: true, website: true,
                email: true, phone: true, address_line1: true, city: true, state: true,
                country: true, postal_code: true, logo_url: true, currency: true,
                tax_number: true, bank_name: true, bank_account_name: true,
                bank_sort_code: true, bank_account_number: true,
                default_payment_method: true,
            },
        });
    }

    async getPaymentScheduleOptions(token: string) {
        const inquiry = await this.prisma.inquiries.findUnique({
            where: { portal_token: token },
            select: { contact: { select: { brand_id: true } } },
        });
        if (!inquiry) throw new NotFoundException('Portal not found');

        const templates = await this.prisma.payment_schedule_templates.findMany({
            where: { brand_id: inquiry.contact.brand_id!, is_active: true },
            select: {
                id: true,
                name: true,
                is_default: true,
                rules: {
                    select: { label: true, amount_type: true, amount_value: true, trigger_type: true, order_index: true },
                    orderBy: { order_index: 'asc' as const },
                },
            },
            orderBy: [{ is_default: 'desc' }, { name: 'asc' }],
        });

        return templates.map((t) => ({
            id: t.id,
            name: t.name,
            is_default: t.is_default,
            rules: t.rules.map((r) => ({
                label: r.label,
                amount_type: r.amount_type,
                amount_value: Number(r.amount_value),
            })),
        }));
    }

    async saveSectionNote(token: string, sectionType: string, note: string) {
        const inquiry = await this.prisma.inquiries.findUnique({
            where: { portal_token: token },
            select: { proposals: { where: { status: { in: ['Sent', 'Accepted', 'ChangesRequested'] } }, orderBy: { id: 'desc' as const }, take: 1, select: { id: true } } },
        });
        if (!inquiry) throw new NotFoundException('Portal not found');
        const proposal = inquiry.proposals[0];
        if (!proposal) throw new NotFoundException('Proposal not found');

        const result = await this.prisma.proposal_section_notes.upsert({
            where: { proposal_id_section_type: { proposal_id: proposal.id, section_type: sectionType } },
            create: { proposal_id: proposal.id, section_type: sectionType, note },
            update: { note },
        });
        return { id: result.id, section_type: result.section_type, note: result.note };
    }

    /**
     * Resolve subject_ids in camera_assignments to subject_names so the
     * frontend can display them without cross-table ID mapping.
     */
    private async _resolveFilmSubjectNames(inquiry: PortalInquiry) {
        const films = inquiry.schedule_films;
        if (!Array.isArray(films)) return;

        const allSubjectIds = new Set<number>();
        for (const pf of films) {
            for (const scene of (pf as any).instance_scenes ?? []) {
                for (const moment of scene.moments ?? []) {
                    for (const ca of moment.recording_setup?.camera_assignments ?? []) {
                        for (const id of ca.subject_ids ?? []) allSubjectIds.add(id);
                    }
                }
            }
        }
        if (allSubjectIds.size === 0) return;

        const ids = Array.from(allSubjectIds);
        const [packageDaySubjects, projectDaySubjects, filmSubjects] = await Promise.all([
            this.prisma.packageDaySubject.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } }),
            this.prisma.projectDaySubject.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } }),
            this.prisma.projectFilmSubject.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } }),
        ]);

        const nameMap = new Map<number, string>();
        for (const s of [...packageDaySubjects, ...projectDaySubjects, ...filmSubjects]) {
            if (!nameMap.has(s.id)) nameMap.set(s.id, s.name);
        }

        for (const pf of films) {
            for (const scene of (pf as any).instance_scenes ?? []) {
                for (const moment of scene.moments ?? []) {
                    for (const ca of moment.recording_setup?.camera_assignments ?? []) {
                        (ca as any).subject_names = (ca.subject_ids ?? [])
                            .map((id: number) => nameMap.get(id))
                            .filter(Boolean);
                    }
                }
            }
        }
    }

    /**
     * Dedicated payments data — returns invoices + brand + contact for the payments page.
     * When preview=true, includes Draft invoices so the studio owner can preview.
     */
    async getPaymentsDataByToken(token: string, preview = false) {
        const inquiry = await this.prisma.inquiries.findUnique({
            where: { portal_token: token },
            select: {
                id: true,
                status: true,
                wedding_date: true,
                contact: {
                    select: { first_name: true, last_name: true, email: true, phone_number: true, brand_id: true },
                },
                invoices: {
                    where: preview
                        ? { status: { notIn: ['Cancelled', 'Voided'] } }
                        : { status: { notIn: ['Draft', 'Cancelled', 'Voided'] } },
                    orderBy: { due_date: 'asc' as const },
                    select: {
                        id: true, invoice_number: true, title: true, status: true,
                        amount: true, subtotal: true, tax_rate: true, due_date: true,
                        issue_date: true, amount_paid: true, currency: true,
                        notes: true, terms: true, payment_method: true,
                        milestone_id: true,
                        items: {
                            select: { id: true, description: true, category: true, quantity: true, unit_price: true },
                            orderBy: { id: 'asc' as const },
                        },
                        payments: {
                            select: {
                                id: true,
                                payment_date: true,
                                amount: true,
                                payment_method: true,
                                transaction_id: true,
                                receipt_url: true,
                                card_brand: true,
                                card_last4: true,
                                payer_email: true,
                                currency: true,
                            },
                            orderBy: { payment_date: 'desc' as const },
                        },
                        milestone: {
                            select: { id: true, label: true, amount: true, due_date: true, status: true, order_index: true },
                        },
                    },
                },
            },
        });
        if (!inquiry) throw new NotFoundException('Portal not found');

        const brand = await this.fetchBrand(inquiry.contact.brand_id!);

        // Fetch active payment methods for the brand
        const paymentMethods = await this.prisma.payment_methods.findMany({
            where: { brand_id: inquiry.contact.brand_id!, is_active: true },
            orderBy: [{ is_default: 'desc' }, { order_index: 'asc' }],
            select: {
                id: true, type: true, label: true, is_default: true,
                instructions: true, config: true, order_index: true,
            },
        });

        // Fetch primary quote for the "What You're Paying For" section
        const primaryQuote = await this.prisma.quotes.findFirst({
            where: { inquiry_id: inquiry.id, is_primary: true },
            select: {
                id: true,
                quote_number: true,
                title: true,
                total_amount: true,
                tax_rate: true,
                currency: true,
                notes: true,
                schedule_template: { select: { name: true } },
                items: {
                    select: { id: true, description: true, category: true, quantity: true, unit_price: true },
                    orderBy: { id: 'asc' },
                },
            },
        });

        return {
            inquiry_id: inquiry.id,
            event_date: inquiry.wedding_date,
            contact: {
                first_name: inquiry.contact.first_name,
                last_name: inquiry.contact.last_name,
                email: inquiry.contact.email,
            },
            brand,
            payment_methods: paymentMethods,
            quote: primaryQuote ? {
                id: primaryQuote.id,
                quote_number: primaryQuote.quote_number,
                title: primaryQuote.title,
                total_amount: primaryQuote.total_amount,
                tax_rate: primaryQuote.tax_rate,
                currency: primaryQuote.currency,
                notes: primaryQuote.notes,
                schedule_name: primaryQuote.schedule_template?.name ?? null,
                items: primaryQuote.items,
            } : null,
            invoices: inquiry.invoices.map((inv) => ({
                id: inv.id,
                invoice_number: inv.invoice_number,
                title: inv.title,
                status: inv.status,
                subtotal: inv.subtotal,
                tax_rate: inv.tax_rate,
                total_amount: inv.amount,
                amount_paid: inv.amount_paid,
                due_date: inv.due_date,
                issued_date: inv.issue_date,
                paid_date: inv.status === 'Paid' ? (inv.payments[0]?.payment_date ?? null) : null,
                currency: inv.currency,
                notes: inv.notes,
                terms: inv.terms,
                payment_method: inv.payment_method,
                milestone: inv.milestone,
                items: inv.items,
                payments: inv.payments,
            })),
        };
    }
}
