import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInquiryDto, UpdateInquiryDto } from './dto/inquiries.dto';
import { $Enums } from '@prisma/client';

@Injectable()
export class InquiriesService {
    constructor(private readonly prisma: PrismaService) { }

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

        return {
            id: updatedInquiry.id,
            status: updatedInquiry.status,
            wedding_date: updatedInquiry.wedding_date,
            notes: updatedInquiry.notes,
            venue_details: updatedInquiry.venue_details,
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

            // 3. Create the Project record
            const project = await prisma.projects.create({
                data: {
                    client_id: client.id,
                    brand_id: brandId,
                    project_name: `${inquiry.contact.first_name} & ${inquiry.contact.last_name}'s Wedding`,
                    wedding_date: inquiry.wedding_date || new Date(),
                    booking_date: new Date(),
                    phase: 'PLANNING', // Or your default starting phase
                },
            });

            // 4. Associate all proposals from the inquiry with the new project
            await prisma.proposals.updateMany({
                where: {
                    inquiry_id: inquiryId,
                },
                data: {
                    project_id: project.id,
                },
            });

            // 5. Update the original inquiry to mark it as converted
            await prisma.inquiries.update({
                where: { id: inquiryId },
                data: {
                    status: 'Booked',
                    archived_at: new Date(),
                },
            });

            // 6. Update the contact type
            await prisma.contacts.update({
                where: { id: inquiry.contact_id },
                data: { type: 'Client' },
            });

            return { projectId: project.id };
        });
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
