import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { ClientPortalSectionsService } from './client-portal-sections.service';

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
        select: { id: true, invoice_number: true, status: true, amount: true, due_date: true, issue_date: true, amount_paid: true },
    },
    selected_package: {
        select: { id: true, name: true, base_price: true, currency: true, description: true, contents: true },
    },
    event_type: { select: { id: true, name: true } },
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
                        select: { id: true, name: true, address_line1: true, city: true, state: true, country: true },
                    },
                },
            },
        },
    },
    schedule_films: {
        orderBy: { order_index: 'asc' as const },
        include: {
            film: {
                select: { id: true, name: true, film_type: true, target_duration_min: true, target_duration_max: true },
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
    ) {}

    async getPortalByToken(token: string) {
        const inquiry = await this.prisma.inquiries.findUnique({
            where: { portal_token: token },
            include: PORTAL_INCLUDE,
        });
        if (!inquiry) throw new NotFoundException('Portal not found');

        const packageFilms = await this.resolvePackageFilms(inquiry);
        const brand = await this.fetchBrand(inquiry.contact.brand_id!);
        return this.sectionsService.buildPortalPayload(inquiry, packageFilms, brand as Record<string, unknown>);
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
            },
        });
    }
}
