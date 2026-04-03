import type { Inquiry, InquiryCrewAvailabilityRow, InquiryEquipmentAvailabilityRow } from '@/features/workflow/inquiries/types';
import type { WelcomeEmailDraft } from '../welcome-email-dialog';
import { computeTaxBreakdown } from '@/shared/utils/pricing';
import { formatCurrency } from '@/shared/utils/formatUtils';
import { DEFAULT_CURRENCY } from '@projectflo/shared';
import { formatDate, formatTime, meetingTypeLabel } from './types';
import type { DiscoveryCallData } from './types';

export function buildWelcomeDraft(
    inquiry: Inquiry,
    leadProducer: Inquiry['lead_producer'],
    missingDataQuestions: string[],
    brandName: string,
    taxRate: number,
    portalUrl?: string | null,
    discoveryCall?: DiscoveryCallData,
    callInterest?: string,
    crew?: InquiryCrewAvailabilityRow[],
    equipment?: InquiryEquipmentAvailabilityRow[],
): WelcomeEmailDraft | null {
    if (!inquiry.contact?.email) return null;

    const firstName = inquiry.contact?.first_name?.trim() || 'there';
    const signOffName = leadProducer?.name || `The ${brandName} Team`;
    const eventLabel = inquiry.event_type ?? null;

    // Opening paragraph
    const openingLine = leadProducer
        ? `Thank you so much for reaching out – I'm ${leadProducer.name}, and I'll be looking after your${eventLabel ? ` ${eventLabel.toLowerCase()}` : ' event'} from start to finish. We're really excited to be part of it!`
        : `Thank you so much for getting in touch! We're really excited to be involved in your${eventLabel ? ` ${eventLabel.toLowerCase()}` : ' event'} and can't wait to get started.`;

    const lines: string[] = [
        `Hi ${firstName},`,
        '',
        openingLine,
        '',
    ];

    // ── Confirmed details block ──
    const confirmedDetails: string[] = [];
    if (eventLabel) confirmedDetails.push(`Event Type: ${eventLabel}`);
    const formattedDate = formatDate(inquiry.event_date);
    if (formattedDate) confirmedDetails.push(`Event Date: ${formattedDate}`);
    const venueDisplay = inquiry.venue_address || inquiry.venue_details;
    if (venueDisplay) confirmedDetails.push(`Venue: ${venueDisplay}`);
    const packageName = inquiry.selected_package?.name ?? inquiry.package_contents_snapshot?.package_name;
    const primaryEst = inquiry.estimates?.find(e => e.is_primary) ?? inquiry.estimates?.[0];
    const estimateTotal = (primaryEst ? computeTaxBreakdown(Number(primaryEst.total_amount ?? 0), taxRate).total : 0)
        || (inquiry.primary_estimate_total ?? 0);
    const currency = primaryEst?.currency ?? inquiry.selected_package?.currency ?? inquiry.package_contents_snapshot?.currency ?? DEFAULT_CURRENCY;
    const packagePriceStr = estimateTotal > 0 ? formatCurrency(estimateTotal, currency) : null;
    if (packageName && packagePriceStr) confirmedDetails.push(`Package: ${packageName} (estimated ${packagePriceStr})`);
    else if (packageName) confirmedDetails.push(`Package: ${packageName}`);
    const paymentScheduleName = inquiry.preferred_payment_schedule_template?.name;
    if (paymentScheduleName) confirmedDetails.push(`Payment Schedule: ${paymentScheduleName}`);

    lines.push("Here's a quick summary of what we have so far:");
    lines.push('');
    confirmedDetails.forEach((detail) => lines.push(`  • ${detail}`));
    lines.push('');

    // ── Discovery call block ──
    if (discoveryCall) {
        const callDate = formatDate(discoveryCall.start_time);
        const callTimeFrom = formatTime(discoveryCall.start_time);
        const callTimeTo = formatTime(discoveryCall.end_time);
        const typeLabel = meetingTypeLabel(discoveryCall.meeting_type);
        const isVirtual = discoveryCall.meeting_type === 'VIDEO_CALL' || discoveryCall.meeting_type === 'ONLINE';
        const confirmed = discoveryCall.is_confirmed;

        lines.push(confirmed ? 'Your Discovery Call is confirmed:' : 'Your Discovery Call:');
        lines.push('');
        if (callDate) lines.push(`  • Date: ${callDate}`);
        lines.push(`  • Time: ${callTimeFrom} – ${callTimeTo}`);
        lines.push(`  • Type: ${typeLabel}`);
        if (isVirtual) {
            const link = discoveryCall.meeting_url ?? '[Video call link — to be confirmed]';
            lines.push(`  • Link: ${link}`);
        } else if (discoveryCall.location) {
            lines.push(`  • Location: ${discoveryCall.location}`);
        }
        if (!confirmed) {
            lines.push('');
            lines.push("If you need to reschedule, simply reply to this email and we'll find a time that works better.");
        }
        lines.push('');
    } else if (callInterest !== 'no') {
        lines.push('Discovery Call:');
        lines.push('');
        lines.push("We'd love to schedule a discovery call to discuss your vision and answer any questions. We'll be in touch shortly to arrange a time that works for you. If you'd like to suggest a time, feel free to reply to this email.");
        lines.push('');
    }

    // ── Crew confirmation block ──
    const confirmedCrew = (crew ?? []).filter(
        (r) => r.assigned_crew && (r.availability_request_status === 'confirmed' || r.status === 'available'),
    );
    if (confirmedCrew.length > 0) {
        lines.push('Your Crew:');
        lines.push('');
        confirmedCrew.forEach((r) => {
            const role = r.job_role?.display_name ?? r.job_role?.name ?? r.label ?? 'Crew';
            const name = r.assigned_crew!.name;
            const confirmed = r.availability_request_status === 'confirmed' ? ' ✓ Confirmed' : '';
            lines.push(`  • ${role}: ${name}${confirmed}`);
        });
        lines.push('');
    }

    // ── Equipment block ──
    const confirmedEquipment = (equipment ?? []).filter(
        (r) => r.equipment_reservation_status === 'confirmed' || r.equipment_reservation_status === 'reserved',
    );
    if (confirmedEquipment.length > 0) {
        lines.push('Your Equipment:');
        lines.push('');
        confirmedEquipment.forEach((r) => {
            const status = r.equipment_reservation_status === 'confirmed' ? ' ✓ Confirmed' : ' (Reserved)';
            lines.push(`  • ${r.equipment.item_name}${status}`);
        });
        lines.push('');
    }

    // ── Missing data questions ──
    if (missingDataQuestions.length > 0) {
        lines.push('To help us get everything in order, we just have a couple of quick questions:');
        missingDataQuestions.forEach((question) => lines.push(`  - ${question}`));
        lines.push('');
    }

    // ── Client portal link ──
    if (portalUrl) {
        lines.push('You can also access your client portal to view your proposals, contracts, and booking documents:');
        lines.push('');
        lines.push(`  ${portalUrl}`);
        lines.push('');
    }

    lines.push("If you have any questions in the meantime, don't hesitate to reach out – we're always happy to help.");
    lines.push('');
    lines.push('Warm regards,');
    lines.push(signOffName);

    return {
        recipientEmail: inquiry.contact.email,
        recipientName: firstName,
        subject: `Thank you for your inquiry – ${brandName}`,
        body: lines.join('\n'),
    };
}
