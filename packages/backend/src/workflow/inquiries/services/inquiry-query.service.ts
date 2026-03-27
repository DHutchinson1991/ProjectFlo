import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { computeTaxBreakdown } from '@finance/shared/pricing.utils';

/**
 * InquiryQueryService
 *
 * Read-only operations: listing, detail retrieval, and discovery-call lookup.
 */
@Injectable()
export class InquiryQueryService {
    constructor(private readonly prisma: PrismaService) {}

    async findAll(brandId: number) {
        const inquiries = await this.prisma.inquiries.findMany({
            where: { archived_at: null, contact: { brand_id: brandId } },
            include: {
                contact: { select: { first_name: true, last_name: true, email: true, phone_number: true } },
                selected_package: { select: { id: true, name: true, base_price: true, currency: true } },
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
                proposals: { select: { id: true, status: true }, orderBy: { id: 'desc' }, take: 1 },
                contracts: { select: { id: true, status: true }, orderBy: { id: 'desc' }, take: 1 },
                event_type: { select: { id: true, name: true } },
                schedule_location_slots: {
                    orderBy: { order_index: 'asc' },
                    take: 1,
                    include: { location: { select: { name: true, address_line1: true, lat: true, lng: true } } },
                },
                inquiry_tasks: {
                    where: { is_active: true, is_task_group: true },
                    orderBy: { order_index: 'asc' },
                    select: {
                        id: true, name: true, order_index: true,
                        children: { where: { is_active: true }, select: { id: true, status: true } },
                    },
                },
            },
            orderBy: { id: 'desc' },
        });

        return inquiries.map((inquiry) => this._mapListItem(inquiry));
    }

    async findOne(id: number, brandId: number) {
        const inquiry = await this.prisma.inquiries.findFirst({
            where: { id, archived_at: null },
            select: {
                id: true, status: true, wedding_date: true, notes: true, lead_source: true,
                lead_source_details: true, selected_package_id: true, source_package_id: true,
                contact_id: true, package_contents_snapshot: true, preferred_payment_schedule_template_id: true,
                event_type_id: true, welcome_sent_at: true, created_at: true, updated_at: true,
                contact: { select: { id: true, first_name: true, last_name: true, email: true, phone_number: true, company_name: true, brand_id: true } },
                estimates: { orderBy: { id: 'desc' } },
                proposals: { orderBy: { id: 'desc' } },
                quotes: { orderBy: { id: 'desc' } },
                contracts: { orderBy: { id: 'desc' } },
                invoices: { include: { items: true }, orderBy: { id: 'desc' } },
                event_type: { select: { id: true, name: true } },
                schedule_location_slots: {
                    orderBy: { order_index: 'asc' }, take: 1,
                    include: { location: { select: { name: true, address_line1: true, lat: true, lng: true } } },
                },
                schedule_day_operators: {
                    where: {
                        crew_member_id: { not: null },
                        OR: [
                            { job_role: { is: { name: { contains: 'producer', mode: 'insensitive' } } } },
                            { job_role: { is: { display_name: { contains: 'producer', mode: 'insensitive' } } } },
                            { crew_member: { is: { crew_member_job_roles: { some: { job_role: { OR: [{ name: { contains: 'producer', mode: 'insensitive' } }, { display_name: { contains: 'producer', mode: 'insensitive' } }] } } } } } },
                        ],
                    },
                    orderBy: [{ order_index: 'asc' }], take: 1,
                    select: {
                        id: true, label: true,
                        crew_member: { select: { id: true, contact: { select: { first_name: true, last_name: true, email: true } } } },
                        job_role: { select: { id: true, name: true, display_name: true } },
                    },
                },
                inquiry_tasks: {
                    where: { is_task_group: false, assigned_to_id: { not: null }, job_role: { is: { OR: [{ name: { contains: 'producer', mode: 'insensitive' } }, { display_name: { contains: 'producer', mode: 'insensitive' } }] } } },
                    take: 1, orderBy: [{ order_index: 'asc' }],
                    select: {
                        id: true,
                        assigned_to: { select: { id: true, contact: { select: { first_name: true, last_name: true, email: true } } } },
                        job_role: { select: { id: true, name: true, display_name: true } },
                    },
                },
            },
        });

        if (!inquiry) throw new NotFoundException(`Inquiry with ID ${id} not found`);

        const lpAssignment = inquiry.schedule_day_operators[0] ?? null;
        const fallbackTask = inquiry.inquiry_tasks[0] ?? null;
        const leadProducer = lpAssignment?.crew_member
            ? { id: lpAssignment.crew_member.id, name: `${lpAssignment.crew_member.contact.first_name} ${lpAssignment.crew_member.contact.last_name}`.trim(), email: lpAssignment.crew_member.contact.email, label: lpAssignment.label, job_role_name: lpAssignment.job_role?.display_name ?? lpAssignment.job_role?.name ?? null }
            : fallbackTask?.assigned_to
            ? { id: fallbackTask.assigned_to.id, name: `${fallbackTask.assigned_to.contact.first_name} ${fallbackTask.assigned_to.contact.last_name}`.trim(), email: fallbackTask.assigned_to.contact.email, label: null, job_role_name: fallbackTask.job_role?.display_name ?? fallbackTask.job_role?.name ?? null }
            : null;

        const detailSlot = inquiry.schedule_location_slots?.[0];

        return {
            id: inquiry.id, status: inquiry.status, event_date: inquiry.wedding_date, wedding_date: inquiry.wedding_date,
            source: inquiry.lead_source || 'OTHER', notes: inquiry.notes,
            venue_details: detailSlot?.location?.name ?? detailSlot?.name ?? null,
            venue_address: detailSlot?.location?.address_line1 ?? detailSlot?.address ?? null,
            venue_lat: detailSlot?.location?.lat ?? null, venue_lng: detailSlot?.location?.lng ?? null,
            lead_source: inquiry.lead_source, lead_source_details: inquiry.lead_source_details,
            selected_package_id: inquiry.selected_package_id, source_package_id: inquiry.source_package_id ?? null,
            package_contents_snapshot: inquiry.package_contents_snapshot ?? null,
            preferred_payment_schedule_template_id: inquiry.preferred_payment_schedule_template_id ?? null,
            created_at: inquiry.created_at, updated_at: inquiry.updated_at,
            contact: { id: inquiry.contact.id, first_name: inquiry.contact.first_name, last_name: inquiry.contact.last_name, email: inquiry.contact.email, phone_number: inquiry.contact.phone_number, company_name: inquiry.contact.company_name, brand_id: inquiry.contact.brand_id },
            brand_id: inquiry.contact.brand_id, contact_id: inquiry.contact_id,
            event_type_id: inquiry.event_type_id ?? null, event_type: inquiry.event_type ?? null,
            estimates: inquiry.estimates, proposals: inquiry.proposals, quotes: inquiry.quotes,
            contracts: inquiry.contracts, invoices: inquiry.invoices,
            lead_producer: leadProducer,
        };
    }

    async getDiscoveryCall(inquiryId: number, brandId: number) {
        const inquiry = await this.prisma.inquiries.findFirst({
            where: { id: inquiryId, archived_at: null, contact: { brand_id: brandId } },
            select: { id: true },
        });
        if (!inquiry) throw new NotFoundException(`Inquiry ${inquiryId} not found`);

        const now = new Date();
        const upcoming = await this.prisma.calendar_events.findFirst({
            where: { inquiry_id: inquiryId, event_type: 'DISCOVERY_CALL', start_time: { gte: now } },
            orderBy: { start_time: 'asc' },
            select: { id: true, title: true, start_time: true, end_time: true, meeting_type: true, meeting_url: true, location: true, is_confirmed: true },
        });
        if (upcoming) return upcoming;

        return this.prisma.calendar_events.findFirst({
            where: { inquiry_id: inquiryId, event_type: 'DISCOVERY_CALL' },
            orderBy: { start_time: 'desc' },
            select: { id: true, title: true, start_time: true, end_time: true, meeting_type: true, meeting_url: true, location: true, is_confirmed: true },
        });
    }

    private _mapListItem(inquiry: Awaited<ReturnType<typeof this.prisma.inquiries.findMany>>[number] & {
        contact: { first_name: string | null; last_name: string | null; email: string; phone_number: string | null };
        selected_package: { id: number; name: string; base_price: unknown; currency: string } | null;
        inquiry_tasks: Array<{ name: string; order_index: number; children: Array<{ status: string }> }>;
        estimates: Array<{ id: number; total_amount: unknown; tax_rate: unknown; status: string }>;
        quotes: Array<{ id: number; total_amount: unknown; tax_rate: unknown; status: string }>;
        proposals: Array<{ status: string }>;
        contracts: Array<{ status: string }>;
        event_type: { id: number; name: string } | null;
        schedule_location_slots: Array<{ name?: string | null; address?: string | null; location?: { name: string | null; address_line1: string | null; lat: unknown; lng: unknown } | null }>;
    }) {
        const slot = inquiry.schedule_location_slots?.[0];
        const stages = inquiry.inquiry_tasks;
        let pipeline_stage: string;
        if (stages.length > 0) {
            const activeStage = stages.find((s) => s.children.length > 0 && !s.children.every((c) => c.status === 'Completed'));
            pipeline_stage = activeStage?.name ?? stages[stages.length - 1].name;
        } else {
            if (inquiry.contracts.length > 0) pipeline_stage = 'Contract Stage';
            else if (inquiry.proposals.length > 0) pipeline_stage = 'Proposal Sent';
            else if (inquiry.estimates.some((e) => e.status === 'Accepted')) pipeline_stage = 'Estimate Accepted';
            else if (inquiry.estimates.some((e) => e.status === 'Sent')) pipeline_stage = 'Estimate Sent';
            else if (inquiry.estimates.length > 0) pipeline_stage = 'Estimate Created';
            else pipeline_stage = 'New Lead';
        }

        const calcTotal = (arr: Array<{ total_amount: unknown; tax_rate: unknown }>) => {
            if (!arr.length) return null;
            const amt = Number(arr[0].total_amount);
            const rate = Number(arr[0].tax_rate ?? 0);
            return computeTaxBreakdown(amt, rate).total;
        };

        return {
            id: inquiry.id, status: inquiry.status, event_date: inquiry.wedding_date, wedding_date: inquiry.wedding_date,
            source: inquiry.lead_source || 'OTHER', notes: inquiry.notes,
            venue_details: slot?.location?.name ?? (slot as { name?: string | null })?.name ?? null,
            venue_address: slot?.location?.address_line1 ?? (slot as { address?: string | null })?.address ?? null,
            venue_lat: slot?.location?.lat ?? null, venue_lng: slot?.location?.lng ?? null,
            lead_source: inquiry.lead_source, lead_source_details: inquiry.lead_source_details,
            created_at: inquiry.created_at, updated_at: inquiry.updated_at,
            contact: { id: inquiry.contact_id, first_name: inquiry.contact.first_name, last_name: inquiry.contact.last_name, email: inquiry.contact.email, phone_number: inquiry.contact.phone_number },
            contact_id: inquiry.contact_id,
            selected_package_id: inquiry.selected_package_id,
            selected_package: inquiry.selected_package ? { id: inquiry.selected_package.id, name: inquiry.selected_package.name, base_price: inquiry.selected_package.base_price, currency: inquiry.selected_package.currency } : null,
            primary_estimate_total: calcTotal(inquiry.estimates),
            primary_quote_total: calcTotal(inquiry.quotes),
            pipeline_stage,
            event_type_id: inquiry.event_type?.id ?? null,
            event_type: inquiry.event_type?.name ?? null,
            pipeline_stages: stages.map((s) => ({
                name: s.name, order_index: s.order_index,
                total_children: s.children.length,
                completed_children: s.children.filter((c) => c.status === 'Completed').length,
            })),
        };
    }
}
