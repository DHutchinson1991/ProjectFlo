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

    private async _computeBlueprintDrift(snapshot: unknown) {
        if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
            return null;
        }

        const raw = snapshot as Record<string, unknown>;
        const blueprintId = typeof raw.source_day_blueprint_id === 'number' ? raw.source_day_blueprint_id : null;
        const consumedVersionId = typeof raw.source_day_blueprint_version_id === 'number'
            ? raw.source_day_blueprint_version_id
            : null;
        const consumedVersionNumber = typeof raw.source_day_blueprint_version_number === 'number'
            ? raw.source_day_blueprint_version_number
            : null;

        if (!blueprintId || !consumedVersionId) {
            return null;
        }

        const blueprint = await this.prisma.dayBlueprint.findUnique({
            where: { id: blueprintId },
            select: { latest_published_version_id: true },
        });

        const latestVersionId = blueprint?.latest_published_version_id ?? null;
        const latestVersion = latestVersionId
            ? await this.prisma.dayBlueprintVersion.findUnique({
                where: { id: latestVersionId },
                select: { version_number: true },
            })
            : null;

        return {
            blueprint_id: blueprintId,
            consumed_version_id: consumedVersionId,
            consumed_version_number: consumedVersionNumber,
            latest_version_id: latestVersionId,
            latest_version_number: latestVersion?.version_number ?? null,
            is_current: latestVersionId ? latestVersionId === consumedVersionId : null,
        };
    }

    /**
     * Batched equivalent of `_computeBlueprintDrift` for list endpoints: collects all
     * blueprint ids referenced by the given snapshots up front, then issues a single
     * `findMany` for blueprints and one for their latest published versions, instead of
     * querying per-row (avoids an N+1 across the page of inquiries).
     */
    private async _computeBlueprintDriftBatch(snapshots: unknown[]) {
        type ParsedSnapshot = {
            blueprintId: number;
            consumedVersionId: number;
            consumedVersionNumber: number | null;
        };

        const parsed: (ParsedSnapshot | null)[] = snapshots.map((snapshot) => {
            if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
                return null;
            }
            const raw = snapshot as Record<string, unknown>;
            const blueprintId = typeof raw.source_day_blueprint_id === 'number' ? raw.source_day_blueprint_id : null;
            const consumedVersionId = typeof raw.source_day_blueprint_version_id === 'number'
                ? raw.source_day_blueprint_version_id
                : null;
            const consumedVersionNumber = typeof raw.source_day_blueprint_version_number === 'number'
                ? raw.source_day_blueprint_version_number
                : null;
            if (!blueprintId || !consumedVersionId) return null;
            return { blueprintId, consumedVersionId, consumedVersionNumber };
        });

        const blueprintIds = Array.from(new Set(parsed.filter((p): p is ParsedSnapshot => p !== null).map((p) => p.blueprintId)));

        if (blueprintIds.length === 0) {
            return parsed.map(() => null);
        }

        const blueprints = await this.prisma.dayBlueprint.findMany({
            where: { id: { in: blueprintIds } },
            select: { id: true, latest_published_version_id: true },
        });
        const blueprintById = new Map(blueprints.map((b) => [b.id, b.latest_published_version_id]));

        const latestVersionIds = Array.from(
            new Set(Array.from(blueprintById.values()).filter((id): id is number => id !== null)),
        );
        const latestVersions = latestVersionIds.length > 0
            ? await this.prisma.dayBlueprintVersion.findMany({
                where: { id: { in: latestVersionIds } },
                select: { id: true, version_number: true },
            })
            : [];
        const versionNumberById = new Map(latestVersions.map((v) => [v.id, v.version_number]));

        return parsed.map((p) => {
            if (!p) return null;
            const latestVersionId = blueprintById.get(p.blueprintId) ?? null;
            return {
                blueprint_id: p.blueprintId,
                consumed_version_id: p.consumedVersionId,
                consumed_version_number: p.consumedVersionNumber,
                latest_version_id: latestVersionId,
                latest_version_number: latestVersionId ? versionNumberById.get(latestVersionId) ?? null : null,
                is_current: latestVersionId ? latestVersionId === p.consumedVersionId : null,
            };
        });
    }

    async findAll(brandId: number) {
        const inquiries = await this.prisma.inquiries.findMany({
            where: { archived_at: null, contact: { brand_id: brandId } },
            include: {
                contact: { select: { first_name: true, last_name: true, email: true, phone_number: true } },
                selected_package: { select: { id: true, name: true, currency: true } },
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
                schedule_day_crew_slots: {
                    where: {
                        crew_id: { not: null },
                        OR: [
                            { lead_type: { not: null } },
                            { job_role: { is: { name: { equals: 'producer', mode: 'insensitive' } } } },
                            { job_role: { is: { name: { equals: 'videographer', mode: 'insensitive' } } } },
                            { job_role: { is: { name: { in: ['editor', 'video-editor'] } } } },
                        ],
                    },
                    orderBy: [{ lead_type: 'asc' }, { order_index: 'asc' }],
                    select: {
                        lead_type: true,
                        job_role: { select: { name: true } },
                        crew: { select: { contact: { select: { first_name: true, last_name: true } } } },
                    },
                },
            },
            orderBy: { id: 'desc' },
        });

        const drifts = await this._computeBlueprintDriftBatch(inquiries.map((i) => i.package_contents_snapshot));

        return inquiries.map((inquiry, index) => ({
            ...this._mapListItem(inquiry),
            blueprint_drift: drifts[index],
        }));
    }

    async findOne(id: number, brandId: number) {
        const inquiry = await this.prisma.inquiries.findFirst({
            where: { id, archived_at: null },
            select: {
                id: true, status: true, wedding_date: true, notes: true, lead_source: true,
                lead_source_details: true, selected_package_id: true, source_package_id: true,
                contact_id: true, package_contents_snapshot: true, preferred_payment_schedule_template_id: true,
                event_category: true, welcome_sent_at: true, created_at: true, updated_at: true,
                contact: { select: { id: true, first_name: true, last_name: true, email: true, phone_number: true, company_name: true, brand_id: true } },
                estimates: { orderBy: { id: 'desc' } },
                proposals: { orderBy: { id: 'desc' } },
                quotes: { orderBy: { id: 'desc' } },
                contracts: { orderBy: { id: 'desc' } },
                invoices: { include: { items: true }, orderBy: { id: 'desc' } },
                schedule_location_slots: {
                    orderBy: { order_index: 'asc' }, take: 1,
                    include: { location: { select: { name: true, address_line1: true, address_line2: true, city: true, state: true, country: true, postal_code: true, lat: true, lng: true } } },
                },
                schedule_day_crew_slots: {
                    where: {
                        crew_id: { not: null },
                        OR: [
                            { lead_type: { not: null } },
                            { job_role: { is: { name: { contains: 'producer', mode: 'insensitive' } } } },
                            { job_role: { is: { display_name: { contains: 'producer', mode: 'insensitive' } } } },
                            { job_role: { is: { name: { contains: 'videographer', mode: 'insensitive' } } } },
                            { job_role: { is: { display_name: { contains: 'videographer', mode: 'insensitive' } } } },
                            { job_role: { is: { name: { in: ['editor', 'video-editor'] } } } },
                            { job_role: { is: { display_name: { contains: 'editor', mode: 'insensitive' } } } },
                            { crew: { is: { job_role_assignments: { some: { job_role: { OR: [{ name: { contains: 'producer', mode: 'insensitive' } }, { display_name: { contains: 'producer', mode: 'insensitive' } }, { name: { contains: 'videographer', mode: 'insensitive' } }, { display_name: { contains: 'videographer', mode: 'insensitive' } }, { name: { in: ['editor', 'video-editor'] } }, { display_name: { contains: 'editor', mode: 'insensitive' } }] } } } } } },
                        ],
                    },
                    orderBy: [{ lead_type: 'asc' }, { order_index: 'asc' }],
                    select: {
                        id: true, label: true, lead_type: true,
                        crew: { select: { id: true, contact: { select: { first_name: true, last_name: true, email: true } } } },
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

        const _resolveLeadFromSlots = (slots: typeof inquiry.schedule_day_crew_slots, leadTypeFilter: string) => {
            const slot = slots.find(s => s.lead_type === leadTypeFilter) ?? slots.find(s => s.job_role?.name?.toLowerCase() === leadTypeFilter);
            if (!slot?.crew) return null;
            return { id: slot.crew.id, name: `${slot.crew.contact.first_name} ${slot.crew.contact.last_name}`.trim(), email: slot.crew.contact.email, label: slot.label, job_role_name: slot.job_role?.display_name ?? slot.job_role?.name ?? null };
        };

        const fallbackTask = inquiry.inquiry_tasks[0] ?? null;
        const leadProducer = _resolveLeadFromSlots(inquiry.schedule_day_crew_slots, 'producer')
            ?? (fallbackTask?.assigned_to
                ? { id: fallbackTask.assigned_to.id, name: `${fallbackTask.assigned_to.contact.first_name} ${fallbackTask.assigned_to.contact.last_name}`.trim(), email: fallbackTask.assigned_to.contact.email, label: null, job_role_name: fallbackTask.job_role?.display_name ?? fallbackTask.job_role?.name ?? null }
                : null);
        const leadVideographer = _resolveLeadFromSlots(inquiry.schedule_day_crew_slots, 'videographer');
        const leadEditor = (() => {
            const slot = inquiry.schedule_day_crew_slots.find(s => s.lead_type === 'editor') ?? inquiry.schedule_day_crew_slots.find(s => ['editor', 'video-editor'].includes(s.job_role?.name?.toLowerCase() ?? ''));
            if (!slot?.crew) return null;
            return { id: slot.crew.id, name: `${slot.crew.contact.first_name} ${slot.crew.contact.last_name}`.trim(), email: slot.crew.contact.email, label: slot.label, job_role_name: slot.job_role?.display_name ?? slot.job_role?.name ?? null };
        })();

        const detailSlot = inquiry.schedule_location_slots?.[0];
        const loc = detailSlot?.location;
        const fullAddress = loc
            ? [loc.address_line1, loc.address_line2, loc.city, loc.state, loc.country, loc.postal_code].filter(Boolean).join(', ') || null
            : (detailSlot?.address ?? null);

        const blueprint_drift = await this._computeBlueprintDrift(inquiry.package_contents_snapshot);

        return {
            id: inquiry.id, status: inquiry.status, event_date: inquiry.wedding_date, wedding_date: inquiry.wedding_date,
            source: inquiry.lead_source || 'OTHER', notes: inquiry.notes,
            venue_details: detailSlot?.location?.name ?? detailSlot?.name ?? null,
            venue_address: fullAddress,
            venue_lat: detailSlot?.location?.lat ?? null, venue_lng: detailSlot?.location?.lng ?? null,
            lead_source: inquiry.lead_source, lead_source_details: inquiry.lead_source_details,
            selected_package_id: inquiry.selected_package_id, source_package_id: inquiry.source_package_id ?? null,
            package_contents_snapshot: inquiry.package_contents_snapshot ?? null,
            blueprint_drift,
            preferred_payment_schedule_template_id: inquiry.preferred_payment_schedule_template_id ?? null,
            created_at: inquiry.created_at, updated_at: inquiry.updated_at,
            contact: { id: inquiry.contact.id, first_name: inquiry.contact.first_name, last_name: inquiry.contact.last_name, email: inquiry.contact.email, phone_number: inquiry.contact.phone_number, company_name: inquiry.contact.company_name, brand_id: inquiry.contact.brand_id },
            brand_id: inquiry.contact.brand_id, contact_id: inquiry.contact_id,
            event_type_id: null, event_type: inquiry.event_category ?? null,
            estimates: inquiry.estimates, proposals: inquiry.proposals, quotes: inquiry.quotes,
            contracts: inquiry.contracts, invoices: inquiry.invoices,
            lead_producer: leadProducer,
            lead_videographer: leadVideographer,
            lead_editor: leadEditor,
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
        selected_package: { id: number; name: string; currency: string } | null;
        inquiry_tasks: Array<{ name: string; order_index: number; children: Array<{ status: string }> }>;
        estimates: Array<{ id: number; total_amount: unknown; tax_rate: unknown; status: string }>;
        quotes: Array<{ id: number; total_amount: unknown; tax_rate: unknown; status: string }>;
        proposals: Array<{ status: string }>;
        contracts: Array<{ status: string }>;
        event_category: string | null;
        schedule_location_slots: Array<{ name?: string | null; address?: string | null; location?: { name: string | null; address_line1: string | null; lat: unknown; lng: unknown } | null }>;
        schedule_day_crew_slots: Array<{ lead_type: string | null; job_role: { name: string } | null; crew: { contact: { first_name: string | null; last_name: string | null } } | null }>;
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
            selected_package: inquiry.selected_package ? { id: inquiry.selected_package.id, name: inquiry.selected_package.name, currency: inquiry.selected_package.currency } : null,
            primary_estimate_total: calcTotal(inquiry.estimates),
            primary_quote_total: calcTotal(inquiry.quotes),
            pipeline_stage,
            event_type_id: null,
            event_type: inquiry.event_category ?? null,
            pipeline_stages: stages.map((s) => ({
                name: s.name, order_index: s.order_index,
                total_children: s.children.length,
                completed_children: s.children.filter((c) => c.status === 'Completed').length,
            })),
            lead_producer_name: (() => {
                const lp = inquiry.schedule_day_crew_slots?.find(s => s.lead_type === 'producer') ?? inquiry.schedule_day_crew_slots?.find(s => s.job_role?.name?.toLowerCase() === 'producer');
                if (!lp?.crew?.contact) return null;
                return [lp.crew.contact.first_name, lp.crew.contact.last_name].filter(Boolean).join(' ') || null;
            })(),
            lead_videographer_name: (() => {
                const lv = inquiry.schedule_day_crew_slots?.find(s => s.lead_type === 'videographer') ?? inquiry.schedule_day_crew_slots?.find(s => s.job_role?.name?.toLowerCase() === 'videographer');
                if (!lv?.crew?.contact) return null;
                return [lv.crew.contact.first_name, lv.crew.contact.last_name].filter(Boolean).join(' ') || null;
            })(),
            lead_editor_name: (() => {
                const le = inquiry.schedule_day_crew_slots?.find(s => s.lead_type === 'editor') ?? inquiry.schedule_day_crew_slots?.find(s => ['editor', 'video-editor'].includes(s.job_role?.name?.toLowerCase() ?? ''));
                if (!le?.crew?.contact) return null;
                return [le.crew.contact.first_name, le.crew.contact.last_name].filter(Boolean).join(' ') || null;
            })(),
        };
    }
}
