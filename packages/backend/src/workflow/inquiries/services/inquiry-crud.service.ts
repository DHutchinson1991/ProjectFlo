import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { $Enums } from '@prisma/client';
import { CreateInquiryDto, UpdateInquiryDto } from '../dto/inquiries.dto';
import { InquiryTasksService } from '../../tasks/inquiry/services/inquiry-tasks.service';
import { InquiryPackageService } from './inquiry-package.service';
import {
    assertPaymentScheduleBelongsToBrand,
    assertServicePackageBelongsToBrand,
} from './inquiry-brand-guards';

/**
 * InquiryCrudService
 *
 * Core write operations: create, update, remove, and send-welcome-pack.
 */
@Injectable()
export class InquiryCrudService {
    private readonly logger = new Logger(InquiryCrudService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly inquiryTasksService: InquiryTasksService,
        private readonly packageService: InquiryPackageService,
    ) {}

    async create(createInquiryDto: CreateInquiryDto, brandId: number) {
        const { first_name, last_name, email, phone_number, ...inquiryData } = createInquiryDto;

        const existingContact = await this.prisma.contacts.findUnique({
            where: { email },
            select: { brand_id: true },
        });
        if (existingContact?.brand_id != null && existingContact.brand_id !== brandId) {
            throw new ConflictException('A contact with this email already exists for another brand');
        }

        if (inquiryData.selected_package_id) {
            await assertServicePackageBelongsToBrand(
                this.prisma,
                inquiryData.selected_package_id,
                brandId,
            );
        }
        if (inquiryData.preferred_payment_schedule_template_id) {
            await assertPaymentScheduleBelongsToBrand(
                this.prisma,
                inquiryData.preferred_payment_schedule_template_id,
                brandId,
            );
        }

        const contact = await this.prisma.contacts.upsert({
            where: { email },
            update: { first_name, last_name, phone_number },
            create: { first_name, last_name, email, phone_number, type: $Enums.contacts_type.Client_Lead, brand_id: brandId },
        });

        const inquiry = await this.prisma.inquiries.create({
            data: {
                contact_id: contact.id,
                wedding_date: new Date(inquiryData.wedding_date),
                status: inquiryData.status,
                notes: inquiryData.notes,
                guest_count: inquiryData.guest_count,
                lead_source: inquiryData.lead_source,
                lead_source_details: inquiryData.lead_source_details,
                selected_package_id: inquiryData.selected_package_id ?? null,
                preferred_payment_schedule_template_id: inquiryData.preferred_payment_schedule_template_id ?? null,
                event_category: inquiryData.event_category ?? null,
                portal_token: randomUUID(),
            },
            include: { contact: { select: { first_name: true, last_name: true, email: true, phone_number: true } } },
        });

        try {
            await this.inquiryTasksService.generateForInquiry(inquiry.id, brandId);
        } catch (err) {
            this.logger.warn(`Failed to auto-generate inquiry tasks for inquiry ${inquiry.id}: ${err}`);
        }

        const warnings: string[] = [];

        if (inquiryData.selected_package_id) {
            try {
                await this.packageService.handlePackageSelection(inquiry.id, inquiryData.selected_package_id, brandId);
            } catch (err) {
                const message = `Failed to create package snapshot for inquiry ${inquiry.id}`;
                this.logger.error(message, err instanceof Error ? err.stack : String(err));
                warnings.push(`${message}. The inquiry was created, but its package snapshot may be missing.`);
            }
        }

        return { id: inquiry.id, status: inquiry.status, wedding_date: inquiry.wedding_date, notes: inquiry.notes, lead_source: inquiry.lead_source, lead_source_details: inquiry.lead_source_details, first_name: inquiry.contact.first_name, last_name: inquiry.contact.last_name, email: inquiry.contact.email, phone_number: inquiry.contact.phone_number, ...(warnings.length > 0 && { warnings }) };
    }

    async update(id: number, updateInquiryDto: UpdateInquiryDto, brandId: number) {
        const { first_name, last_name, email, phone_number, ...inquiryData } = updateInquiryDto;

        const existingInquiry = await this.prisma.inquiries.findFirst({
            where: { id, archived_at: null, contact: { brand_id: brandId } },
            include: { contact: true },
        });
        if (!existingInquiry) throw new NotFoundException(`Inquiry with ID ${id} not found`);

        const packageChanging = inquiryData.selected_package_id !== undefined && inquiryData.selected_package_id !== existingInquiry.selected_package_id;

        if (packageChanging && inquiryData.selected_package_id) {
            await assertServicePackageBelongsToBrand(
                this.prisma,
                inquiryData.selected_package_id,
                brandId,
            );
        }
        if (inquiryData.preferred_payment_schedule_template_id !== undefined
            && inquiryData.preferred_payment_schedule_template_id !== null
            && inquiryData.preferred_payment_schedule_template_id !== existingInquiry.preferred_payment_schedule_template_id) {
            await assertPaymentScheduleBelongsToBrand(
                this.prisma,
                inquiryData.preferred_payment_schedule_template_id,
                brandId,
            );
        }

        if (first_name || last_name || email || phone_number) {
            if (email && email !== existingInquiry.contact.email) {
                const duplicate = await this.prisma.contacts.findUnique({ where: { email }, select: { id: true } });
                if (duplicate && duplicate.id !== existingInquiry.contact_id) {
                    throw new ConflictException('A contact with this email already exists');
                }
            }
            await this.prisma.contacts.update({
                where: { id: existingInquiry.contact_id },
                data: { ...(first_name && { first_name }), ...(last_name && { last_name }), ...(email && { email }), ...(phone_number && { phone_number }) },
            });
        }

        const updatedInquiry = await this.prisma.inquiries.update({
            where: { id },
            data: {
                ...(inquiryData.wedding_date && { wedding_date: new Date(inquiryData.wedding_date) }),
                ...(inquiryData.status && { status: inquiryData.status }),
                ...(inquiryData.notes !== undefined && { notes: inquiryData.notes }),
                ...(inquiryData.lead_source !== undefined && { lead_source: inquiryData.lead_source }),
                ...(inquiryData.lead_source_details !== undefined && { lead_source_details: inquiryData.lead_source_details }),
                ...(inquiryData.selected_package_id !== undefined && { selected_package_id: inquiryData.selected_package_id }),
                ...(inquiryData.preferred_payment_schedule_template_id !== undefined && { preferred_payment_schedule_template_id: inquiryData.preferred_payment_schedule_template_id }),
                ...(inquiryData.event_category !== undefined && { event_category: inquiryData.event_category }),
            },
            include: { contact: { select: { first_name: true, last_name: true, email: true, phone_number: true } } },
        });

        const warnings: string[] = [];

        if (packageChanging) {
            try {
                await this.packageService.handlePackageSelection(id, inquiryData.selected_package_id ?? null, brandId);
            } catch (error) {
                const message = `Failed to handle package selection change for inquiry ${id}`;
                this.logger.error(message, error instanceof Error ? error.stack : error);
                warnings.push(`${message}. The inquiry was updated, but its package snapshot may be out of date.`);
            }
        }

        await this.inquiryTasksService.syncReviewInquiryAutoSubtasks(id);

        if (inquiryData.status && inquiryData.status !== existingInquiry.status && inquiryData.status === 'Booked') {
            if (updatedInquiry.wedding_date) {
                try {
                    const existing = await this.prisma.calendar_events.findFirst({ where: { inquiry_id: id, event_type: 'WEDDING_DAY' } });
                    if (!existing) {
                        const crew = await this.prisma.crew.findFirst({ where: { contact: { brand_id: existingInquiry.contact.brand_id } }, select: { id: true } });
                        if (crew) {
                            await this.prisma.calendar_events.create({
                                data: { inquiry_id: id, crew_id: crew.id, event_type: 'WEDDING_DAY', title: 'Wedding Day', start_time: updatedInquiry.wedding_date, end_time: updatedInquiry.wedding_date, is_all_day: true },
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

        return { id: updatedInquiry.id, status: updatedInquiry.status, wedding_date: updatedInquiry.wedding_date, notes: updatedInquiry.notes, lead_source: updatedInquiry.lead_source, lead_source_details: updatedInquiry.lead_source_details, selected_package_id: updatedInquiry.selected_package_id, preferred_payment_schedule_template_id: updatedInquiry.preferred_payment_schedule_template_id, first_name: updatedInquiry.contact.first_name, last_name: updatedInquiry.contact.last_name, email: updatedInquiry.contact.email, phone_number: updatedInquiry.contact.phone_number, ...(warnings.length > 0 && { warnings }) };
    }

    async remove(id: number, brandId: number) {
        const existingInquiry = await this.prisma.inquiries.findFirst({ where: { id, archived_at: null, contact: { brand_id: brandId } } });
        if (!existingInquiry) throw new NotFoundException(`Inquiry with ID ${id} not found`);

        await this.prisma.$transaction(async (tx) => {
            await tx.inquiry_tasks.deleteMany({ where: { inquiry_id: id } });
            await tx.inquiries.update({ where: { id }, data: { archived_at: new Date() } });
        });
        return { message: 'Inquiry deleted successfully' };
    }

}
