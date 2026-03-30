import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { $Enums } from '@prisma/client';
import { CreateInquiryDto, UpdateInquiryDto } from '../dto/inquiries.dto';
import { InquiryTasksService } from '../../tasks/inquiry/services/inquiry-tasks.service';
import { InquiryPackageService } from './inquiry-package.service';

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

        const contact = await this.prisma.contacts.upsert({
            where: { email },
            update: { first_name, last_name, phone_number, brand_id: brandId },
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
                event_type_id: inquiryData.event_type_id ?? null,
                portal_token: randomUUID(),
            },
            include: { contact: { select: { first_name: true, last_name: true, email: true, phone_number: true } } },
        });

        try {
            await this.inquiryTasksService.generateForInquiry(inquiry.id, brandId);
        } catch (err) {
            this.logger.warn(`Failed to auto-generate inquiry tasks for inquiry ${inquiry.id}: ${err}`);
        }

        if (inquiryData.selected_package_id) {
            try {
                await this.packageService.handlePackageSelection(inquiry.id, inquiryData.selected_package_id, brandId);
            } catch (err) {
                this.logger.error(`Failed to create package snapshot for inquiry ${inquiry.id}`, err instanceof Error ? err.stack : String(err));
            }
        }

        return { id: inquiry.id, status: inquiry.status, wedding_date: inquiry.wedding_date, notes: inquiry.notes, lead_source: inquiry.lead_source, lead_source_details: inquiry.lead_source_details, first_name: inquiry.contact.first_name, last_name: inquiry.contact.last_name, email: inquiry.contact.email, phone_number: inquiry.contact.phone_number };
    }

    async update(id: number, updateInquiryDto: UpdateInquiryDto, brandId: number) {
        const { first_name, last_name, email, phone_number, ...inquiryData } = updateInquiryDto;

        const existingInquiry = await this.prisma.inquiries.findFirst({
            where: { id, archived_at: null, contact: { brand_id: brandId } },
            include: { contact: true },
        });
        if (!existingInquiry) throw new NotFoundException(`Inquiry with ID ${id} not found`);

        const packageChanging = inquiryData.selected_package_id !== undefined && inquiryData.selected_package_id !== existingInquiry.selected_package_id;

        if (first_name || last_name || email || phone_number) {
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
                ...(inquiryData.event_type_id !== undefined && { event_type_id: inquiryData.event_type_id }),
            },
            include: { contact: { select: { first_name: true, last_name: true, email: true, phone_number: true } } },
        });

        if (packageChanging) {
            try {
                await this.packageService.handlePackageSelection(id, inquiryData.selected_package_id ?? null, brandId);
            } catch (error) {
                this.logger.error(`Failed to handle package selection change for inquiry ${id}`, error instanceof Error ? error.stack : error);
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

        return { id: updatedInquiry.id, status: updatedInquiry.status, wedding_date: updatedInquiry.wedding_date, notes: updatedInquiry.notes, lead_source: updatedInquiry.lead_source, lead_source_details: updatedInquiry.lead_source_details, selected_package_id: updatedInquiry.selected_package_id, preferred_payment_schedule_template_id: updatedInquiry.preferred_payment_schedule_template_id, first_name: updatedInquiry.contact.first_name, last_name: updatedInquiry.contact.last_name, email: updatedInquiry.contact.email, phone_number: updatedInquiry.contact.phone_number };
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

    async sendWelcomePack(id: number, brandId: number): Promise<{ welcome_sent_at: Date }> {
        const inquiry = await this.prisma.inquiries.findFirst({ where: { id, archived_at: null, contact: { brand_id: brandId } }, select: { id: true } });
        if (!inquiry) throw new NotFoundException(`Inquiry with ID ${id} not found`);
        const updated = await this.prisma.inquiries.update({ where: { id }, data: { welcome_sent_at: new Date() }, select: { welcome_sent_at: true } });
        await this.inquiryTasksService.autoCompleteByName(id, 'Send Welcome Pack');
        return { welcome_sent_at: updated.welcome_sent_at! };
    }
}
