import { Injectable } from '@nestjs/common';
import { Prisma, $Enums } from '@prisma/client';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { InquiryCrudService } from '../../inquiries/services/inquiry-crud.service';
import { InquiryPackageService } from '../../inquiries/services/inquiry-package.service';
import { CreateInquiryDto } from '../../inquiries/dto/inquiries.dto';
import { InquiryTasksService } from '../../tasks/inquiry/services/inquiry-tasks.service';
import { InquiryWizardPrefillService } from './inquiry-wizard-prefill.service';
import { CreateInquiryWizardSubmissionDto } from '../dto/create-inquiry-wizard-submission.dto';

@Injectable()
export class InquiryWizardLinkService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly inquiryCrudService: InquiryCrudService,
        private readonly inquiryPackageService: InquiryPackageService,
        private readonly inquiryTasksService: InquiryTasksService,
        private readonly prefillService: InquiryWizardPrefillService,
    ) {}

    async linkToExistingInquiry(
        payload: CreateInquiryWizardSubmissionDto,
        brandId: number,
    ): Promise<{ inquiryId: number; contactId?: number }> {
        const responses = payload.responses || {};
        const existingInquiry = await this.prisma.inquiries.findUnique({
            where: { id: payload.inquiry_id },
            include: { contact: { select: { id: true, first_name: true, last_name: true, email: true, phone_number: true } } },
        });
        const contactId = existingInquiry?.contact_id ?? undefined;
        const inquiryUpdate: Record<string, unknown> = {};

        if (!existingInquiry?.wedding_date && responses['wedding_date'])
            inquiryUpdate.wedding_date = new Date(responses['wedding_date'] as string);
        if (!existingInquiry?.guest_count && responses['guest_count'])
            inquiryUpdate.guest_count = responses['guest_count'] as string;
        if (!existingInquiry?.notes && responses['notes'])
            inquiryUpdate.notes = responses['notes'] as string;
        if (!existingInquiry?.lead_source && responses['lead_source'])
            inquiryUpdate.lead_source = responses['lead_source'] as string;
        inquiryUpdate.lead_source_details = JSON.stringify(responses);

        const pkgIdFromPayload = payload.selected_package_id;
        const pkgIdFromResponses = responses['selected_package'] ? Number(responses['selected_package']) : null;
        const resolvedPkgId = (pkgIdFromPayload && !isNaN(pkgIdFromPayload)) ? pkgIdFromPayload
            : (pkgIdFromResponses && !isNaN(pkgIdFromResponses) ? pkgIdFromResponses : null);
        if (resolvedPkgId && !existingInquiry?.selected_package_id)
            inquiryUpdate.selected_package_id = resolvedPkgId;

        const resolvedScheduleId = payload.preferred_payment_schedule_template_id
            ?? (responses['payment_schedule_template_id'] != null
                ? Number(responses['payment_schedule_template_id'])
                : null);
        if (resolvedScheduleId) inquiryUpdate.preferred_payment_schedule_template_id = resolvedScheduleId;

        if (!existingInquiry?.event_type_id && responses['event_type']) {
            const matchedET = await this.resolveEventType(String(responses['event_type']));
            if (matchedET) inquiryUpdate.event_type_id = matchedET;
        }

        if (Object.keys(inquiryUpdate).length > 0) {
            await this.prisma.inquiries.update({
                where: { id: payload.inquiry_id },
                data: inquiryUpdate as Prisma.inquiriesUpdateInput,
            });
            await this.inquiryTasksService.syncReviewInquiryAutoSubtasks(payload.inquiry_id!);

            if (resolvedPkgId && !existingInquiry?.selected_package_id) {
                try {
                    await this.inquiryPackageService.handlePackageSelection(payload.inquiry_id!, resolvedPkgId, brandId);
                } catch (err) {
                    console.error(`Failed to create inquiry package snapshot for inquiry ${payload.inquiry_id}:`, err);
                }
            }
        }

        if (existingInquiry?.contact) {
            const contactUpdate: Record<string, string> = {};
            const c = existingInquiry.contact;
            if ((!c.first_name || c.first_name === 'Unknown') && responses['contact_first_name'])
                contactUpdate.first_name = responses['contact_first_name'] as string;
            if ((!c.last_name || c.last_name === 'Lead') && responses['contact_last_name'])
                contactUpdate.last_name = responses['contact_last_name'] as string;
            if (!c.phone_number && responses['contact_phone'])
                contactUpdate.phone_number = responses['contact_phone'] as string;
            if (Object.keys(contactUpdate).length > 0) {
                await this.prisma.contacts.update({ where: { id: existingInquiry.contact.id }, data: contactUpdate });
            }
        }

        const prefillFirstName = ((responses['contact_first_name'] as string | undefined)?.trim()) || existingInquiry?.contact?.first_name || '';
        const prefillLastName = ((responses['contact_last_name'] as string | undefined)?.trim()) || existingInquiry?.contact?.last_name || '';
        const prefillContactName = [prefillFirstName, prefillLastName].filter(Boolean).join(' ');
        try {
            await this.prefillService.prefillLocationSlots(payload.inquiry_id!, responses, brandId);
            await this.prefillService.prefillSubjectNames(payload.inquiry_id!, responses, prefillContactName);
        } catch (err) {
            console.error(`NA prefill error for inquiry ${payload.inquiry_id}:`, err);
        }

        return { inquiryId: payload.inquiry_id!, contactId };
    }

    async createNewInquiry(
        payload: CreateInquiryWizardSubmissionDto,
        brandId: number,
    ): Promise<{ inquiryId: number; contactId?: number }> {
        const responses = payload.responses || {};
        const contact = payload.contact || {};
        const inquiry = payload.inquiry || {};
        const { randomUUID } = await import('crypto');

        const inferredInquiry: CreateInquiryDto = {
            wedding_date: inquiry.wedding_date || (responses['wedding_date'] as string) || new Date().toISOString(),
            guest_count: (inquiry.guest_count || (responses['guest_count'] as string)) as string | undefined,
            notes: (inquiry.notes || (responses['notes'] as string)) as string | undefined,
            lead_source: inquiry.lead_source || (responses['lead_source'] as string) || 'Inquiry Wizard',
            lead_source_details: inquiry.lead_source_details || JSON.stringify(responses),
            selected_package_id: payload.selected_package_id || inquiry.selected_package_id,
            status: $Enums.inquiries_status.New,
            first_name: contact.first_name || (responses['contact_first_name'] as string) || 'Unknown',
            last_name: contact.last_name || (responses['contact_last_name'] as string) || 'Lead',
            email: contact.email || (responses['contact_email'] as string) || `inquiry_wizard_${Date.now()}@temp.com`,
            phone_number: contact.phone_number || (responses['contact_phone'] as string) || '',
        };

        const scheduleId = payload.preferred_payment_schedule_template_id
            ?? (responses['payment_schedule_template_id'] != null
                ? Number(responses['payment_schedule_template_id'])
                : undefined);
        if (scheduleId) inferredInquiry.preferred_payment_schedule_template_id = scheduleId;

        if (responses['event_type']) {
            const matchedET = await this.resolveEventType(String(responses['event_type']));
            if (matchedET) inferredInquiry.event_type_id = matchedET;
        }

        const createdInquiry = await this.inquiryCrudService.create(inferredInquiry, brandId);
        const portalToken = randomUUID();
        await this.prisma.inquiries.update({
            where: { id: createdInquiry.id },
            data: { portal_token: portalToken },
        });

        const linkedContact = await this.prisma.contacts.findUnique({
            where: { email: inferredInquiry.email },
            select: { id: true },
        });

        // Prefill location slots + subject names (mirrors linkToExistingInquiry)
        const prefillContactName = [inferredInquiry.first_name, inferredInquiry.last_name].filter(Boolean).join(' ');
        try {
            await this.prefillService.prefillLocationSlots(createdInquiry.id, responses, brandId);
            await this.prefillService.prefillSubjectNames(createdInquiry.id, responses, prefillContactName);
        } catch (err) {
            console.error(`NA prefill error for new inquiry ${createdInquiry.id}:`, err);
        }

        return { inquiryId: createdInquiry.id, contactId: linkedContact?.id };
    }

    async createInquiryFromResponses(responses: Record<string, unknown>, brandId: number): Promise<number> {
        const inferredInquiry = {
            wedding_date: (responses['wedding_date'] as string) || new Date().toISOString(),
            guest_count: (responses['guest_count'] as string),
            notes: (responses['notes'] as string),
            lead_source: (responses['lead_source'] as string) || 'Inquiry Wizard',
            lead_source_details: JSON.stringify(responses),
            selected_package_id: undefined,
            status: $Enums.inquiries_status.New,
            first_name: (responses['contact_first_name'] as string) || 'Unknown',
            last_name: (responses['contact_last_name'] as string) || 'Lead',
            email: (responses['contact_email'] as string) || `inquiry_wizard_${Date.now()}@temp.com`,
            phone_number: (responses['contact_phone'] as string) || '',
        };
        const created = await this.inquiryCrudService.create(inferredInquiry, brandId);
        return created.id;
    }

    private async resolveEventType(rawEventType: string): Promise<number | null> {
        const trimmed = rawEventType.trim();
        let matched = await this.prisma.eventType.findFirst({
            where: { name: { equals: trimmed, mode: 'insensitive' } },
            select: { id: true },
        });
        if (!matched && trimmed.toLowerCase().endsWith('s')) {
            matched = await this.prisma.eventType.findFirst({
                where: { name: { equals: trimmed.slice(0, -1), mode: 'insensitive' } },
                select: { id: true },
            });
        }
        return matched?.id ?? null;
    }
}
