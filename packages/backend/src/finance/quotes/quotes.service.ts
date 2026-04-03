import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DEFAULT_CURRENCY } from '@projectflo/shared';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { Quote } from './entities/quote.entity';
import { Decimal } from '@prisma/client/runtime/library';
import { computeItemsTotalDecimal } from '../shared/pricing.utils';
import { roundMoney } from '../shared/pricing.utils';
import { InquiryTasksService } from '../../workflow/tasks/inquiry/services/inquiry-tasks.service';
import { QUOTE_ITEMS_INCLUDE, mapQuoteResponse } from './mappers/quote-response.mapper';

@Injectable()
export class QuotesService {
    private readonly logger = new Logger(QuotesService.name);

    constructor(
        private prisma: PrismaService,
        private inquiryTasksService: InquiryTasksService,
    ) { }

    /**
     * Auto-create a quote from the primary estimate for an inquiry.
     * Called when a proposal is created. No-ops if no primary estimate exists
     * or a quote already exists for this inquiry.
     */
    async createFromEstimate(inquiryId: number): Promise<Quote | null> {
        // Skip if a quote already exists for this inquiry
        const existingQuote = await this.prisma.quotes.findFirst({
            where: { inquiry_id: inquiryId },
        });
        if (existingQuote) {
            this.logger.log(`Quote already exists for inquiry ${inquiryId}, skipping auto-create`);
            return null;
        }

        // Find the primary estimate with items and payment milestones
        const primaryEstimate = await this.prisma.estimates.findFirst({
            where: { inquiry_id: inquiryId, is_primary: true },
            include: { items: true, payment_milestones: { orderBy: { order_index: 'asc' } } },
        });
        if (!primaryEstimate) {
            this.logger.warn(`No primary estimate found for inquiry ${inquiryId}, cannot auto-create quote`);
            return null;
        }

        const items = (primaryEstimate.items || []).map((item) => ({
            description: item.description,
            category: item.category ?? undefined,
            unit: item.unit ?? undefined,
            service_date: item.service_date ? item.service_date.toISOString().split('T')[0] : undefined,
            start_time: item.start_time ?? undefined,
            end_time: item.end_time ?? undefined,
            quantity: Number(item.quantity),
            unit_price: Number(item.unit_price),
        }));

        const quoteNumber = `QUO-${Date.now()}`;
        const now = new Date();
        const expiryDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        const createDto: CreateQuoteDto = {
            quote_number: quoteNumber,
            title: `Quote from ${primaryEstimate.title || 'Estimate'}`,
            issue_date: now.toISOString().split('T')[0],
            expiry_date: expiryDate.toISOString().split('T')[0],
            tax_rate: primaryEstimate.tax_rate ? Number(primaryEstimate.tax_rate) : 0,
            deposit_required: primaryEstimate.deposit_required ? Number(primaryEstimate.deposit_required) : 0,
            payment_method: primaryEstimate.payment_method ?? undefined,
            installments: primaryEstimate.installments ?? undefined,
            notes: primaryEstimate.notes ?? undefined,
            is_primary: true,
            items,
        } as CreateQuoteDto;

        this.logger.log(`Auto-creating quote from estimate ${primaryEstimate.id} for inquiry ${inquiryId}`);
        const quote = await this.create(inquiryId, createDto);

        // Copy payment milestones from estimate to quote.
        // If the estimate has a template but no resolved milestones, resolve them now.
        let estimateMilestones = primaryEstimate.payment_milestones || [];

        if (estimateMilestones.length === 0 && primaryEstimate.schedule_template_id) {
            // Resolve milestones from the template inline
            const inquiry = await this.prisma.inquiries.findUnique({
                where: { id: inquiryId },
                select: { wedding_date: true, created_at: true },
            });
            const template = await this.prisma.payment_schedule_templates.findUnique({
                where: { id: primaryEstimate.schedule_template_id },
                include: { rules: { orderBy: { order_index: 'asc' } } },
            });
            if (template && inquiry) {
                const bookingDate = inquiry.created_at;
                const eventDate = inquiry.wedding_date ?? new Date(bookingDate.getTime() + 180 * 24 * 60 * 60 * 1000);
                const total = Number(primaryEstimate.total_amount);

                const resolved = template.rules.map((rule, i) => {
                    const amount = rule.amount_type === 'PERCENT'
                        ? roundMoney((Number(rule.amount_value) / 100) * total)
                        : Number(rule.amount_value);

                    let dueDate: Date;
                    switch (rule.trigger_type) {
                        case 'AFTER_BOOKING': { dueDate = new Date(bookingDate); dueDate.setDate(dueDate.getDate() + (rule.trigger_days ?? 0)); break; }
                        case 'BEFORE_EVENT': { dueDate = new Date(eventDate); dueDate.setDate(dueDate.getDate() - (rule.trigger_days ?? 0)); break; }
                        case 'AFTER_EVENT': { dueDate = new Date(eventDate); dueDate.setDate(dueDate.getDate() + (rule.trigger_days ?? 0)); break; }
                        default: dueDate = new Date(bookingDate);
                    }

                    return {
                        label: rule.label,
                        amount: new Decimal(amount),
                        due_date: dueDate,
                        status: 'PENDING',
                        notes: null as string | null,
                        order_index: rule.order_index ?? i,
                    };
                });

                // Also persist to the estimate for consistency
                await this.prisma.estimate_payment_milestones.createMany({
                    data: resolved.map(m => ({ ...m, estimate_id: primaryEstimate.id })),
                });
                this.logger.log(`Resolved ${resolved.length} milestones from template for estimate ${primaryEstimate.id}`);
                estimateMilestones = resolved as typeof estimateMilestones;
            }
        }

        if (estimateMilestones.length > 0) {
            await this.prisma.$transaction(async (tx) => {
                await tx.quote_payment_milestones.createMany({
                    data: estimateMilestones.map((m) => ({
                        quote_id: quote.id,
                        label: m.label,
                        amount: m.amount,
                        due_date: m.due_date,
                        status: m.status,
                        notes: m.notes,
                        order_index: m.order_index,
                    })),
                });
                // Copy the schedule template reference
                if (primaryEstimate.schedule_template_id) {
                    await tx.quotes.update({
                        where: { id: quote.id },
                        data: { schedule_template_id: primaryEstimate.schedule_template_id },
                    });
                }
            });
            this.logger.log(`Copied ${estimateMilestones.length} payment milestones from estimate to quote ${quote.id}`);
        }

        return quote;
    }

    async create(inquiryId: number, createQuoteDto: CreateQuoteDto): Promise<Quote> {
        // Calculate total amount from items using Decimal for precision
        const totalAmount = computeItemsTotalDecimal(createQuoteDto.items).toNumber();

        const result = await this.prisma.$transaction(async (tx) => {
            // Resolve brand currency from inquiry → contact → brand
            const inquiry = await tx.inquiries.findUnique({
                where: { id: inquiryId },
                select: { contact: { select: { brand: { select: { currency: true } } } } },
            });
            const currency = inquiry?.contact?.brand?.currency ?? DEFAULT_CURRENCY;

            // Handle Primary Exclusivity
            if (createQuoteDto.is_primary) {
                await tx.quotes.updateMany({
                    where: { inquiry_id: inquiryId, is_primary: true },
                    data: { is_primary: false }
                });
            }

            // Create the quote
            const quote = await tx.quotes.create({
                data: {
                    inquiry_id: inquiryId,
                    project_id: createQuoteDto.project_id || null,
                    quote_number: createQuoteDto.quote_number,
                    issue_date: new Date(createQuoteDto.issue_date),
                    expiry_date: new Date(createQuoteDto.expiry_date),
                    total_amount: new Decimal(totalAmount),
                    consultation_notes: createQuoteDto.consultation_notes || null,
                    status: createQuoteDto.status || 'Draft',
                    title: createQuoteDto.title,
                    tax_rate: createQuoteDto.tax_rate ? new Decimal(createQuoteDto.tax_rate) : new Decimal(0),
                    deposit_required: createQuoteDto.deposit_required ? new Decimal(createQuoteDto.deposit_required) : null,
                    notes: createQuoteDto.notes,
                    terms: createQuoteDto.terms,
                    payment_method: createQuoteDto.payment_method,
                    installments: createQuoteDto.installments,
                    is_primary: createQuoteDto.is_primary || false,
                    currency,
                },
            });

            // Create quote items
            await Promise.all(
                createQuoteDto.items.map(item =>
                    tx.quote_items.create({
                        data: {
                            quote_id: quote.id,
                            description: item.description,
                            category: item.category,
                            unit: item.unit,
                            service_date: item.service_date ? new Date(item.service_date) : null,
                            start_time: item.start_time,
                            end_time: item.end_time,
                            quantity: item.quantity,
                            unit_price: new Decimal(item.unit_price),
                        },
                    })
                )
            );

            // Return quote with converted total_amount for Quote interface
            return {
                ...quote,
                total_amount: totalAmount,
            } as unknown as Quote; // Cast to unknown then Quote to suppress strict checks if needed
        });

        await this.inquiryTasksService.autoCompleteByName(inquiryId, 'Generate Quote');

        return result;
    }

    async findAll(inquiryId: number) {
        const quotes = await this.prisma.quotes.findMany({
            where: { inquiry_id: inquiryId },
            include: QUOTE_ITEMS_INCLUDE,
            orderBy: { created_at: 'desc' },
        });

        return quotes.map(mapQuoteResponse);
    }

    async findOne(inquiryId: number, id: number) {
        const quote = await this.prisma.quotes.findFirst({
            where: { id, inquiry_id: inquiryId },
            include: QUOTE_ITEMS_INCLUDE,
        });

        if (!quote) {
            throw new NotFoundException(`Quote with ID ${id} not found for inquiry ${inquiryId}`);
        }

        return mapQuoteResponse(quote);
    }

    async update(inquiryId: number, id: number, updateQuoteDto: UpdateQuoteDto) {
        // First verify the quote exists and belongs to the inquiry
        await this.findOne(inquiryId, id);

        return await this.prisma.$transaction(async (tx) => {
            // Handle Primary Exclusivity
            if (updateQuoteDto.is_primary) {
                await tx.quotes.updateMany({
                    where: { inquiry_id: inquiryId, is_primary: true, id: { not: id } },
                    data: { is_primary: false }
                });
            }

            let totalAmount: number | undefined;

            // If items are being updated, calculate new total
            if (updateQuoteDto.items) {
                const normalizedItems = updateQuoteDto.items.map((item) => ({
                    ...item,
                    quantity: item.quantity ?? 1,
                    unit_price: item.unit_price ?? 0,
                }));

                totalAmount = computeItemsTotalDecimal(normalizedItems).toNumber();

                // Delete existing items
                await tx.quote_items.deleteMany({
                    where: { quote_id: id },
                });

                // Create new items
                await Promise.all(
                    normalizedItems.map(item =>
                        tx.quote_items.create({
                            data: {
                                quote_id: id,
                                description: item.description || '',
                                category: item.category,
                                unit: item.unit,
                                service_date: item.service_date ? new Date(item.service_date) : null,
                                start_time: item.start_time,
                                end_time: item.end_time,
                                quantity: item.quantity,
                                unit_price: new Decimal(item.unit_price),
                            },
                        })
                    )
                );
            }

            // Build update data
            const updateData: Prisma.quotesUpdateInput = {};

            if (updateQuoteDto.quote_number) updateData.quote_number = updateQuoteDto.quote_number;
            if (updateQuoteDto.issue_date) updateData.issue_date = new Date(updateQuoteDto.issue_date);
            if (updateQuoteDto.expiry_date) updateData.expiry_date = new Date(updateQuoteDto.expiry_date);
            if (updateQuoteDto.status) updateData.status = updateQuoteDto.status;
            if (updateQuoteDto.consultation_notes !== undefined) updateData.consultation_notes = updateQuoteDto.consultation_notes;
            if (updateQuoteDto.project_id !== undefined) updateData.project = updateQuoteDto.project_id ? { connect: { id: updateQuoteDto.project_id } } : { disconnect: true };
            if (totalAmount !== undefined) updateData.total_amount = new Decimal(totalAmount);

            if (updateQuoteDto.title !== undefined) updateData.title = updateQuoteDto.title;
            if (updateQuoteDto.tax_rate !== undefined) updateData.tax_rate = new Decimal(updateQuoteDto.tax_rate);
            if (updateQuoteDto.deposit_required !== undefined) updateData.deposit_required = new Decimal(updateQuoteDto.deposit_required);
            if (updateQuoteDto.notes !== undefined) updateData.notes = updateQuoteDto.notes;
            if (updateQuoteDto.terms !== undefined) updateData.terms = updateQuoteDto.terms;
            if (updateQuoteDto.payment_method !== undefined) updateData.payment_method = updateQuoteDto.payment_method;
            if (updateQuoteDto.installments !== undefined) updateData.installments = updateQuoteDto.installments;
            if (updateQuoteDto.is_primary !== undefined) updateData.is_primary = updateQuoteDto.is_primary;


            const updatedQuote = await tx.quotes.update({
                where: { id },
                data: updateData,
                include: QUOTE_ITEMS_INCLUDE,
            });

            return mapQuoteResponse(updatedQuote);
        });
    }

    async remove(inquiryId: number, id: number) {
        // First verify the quote exists and belongs to the inquiry
        await this.findOne(inquiryId, id);

        return await this.prisma.quotes.delete({
            where: { id },
        });
    }

    async send(inquiryId: number, id: number) {
        // First verify the quote exists and belongs to the inquiry
        await this.findOne(inquiryId, id);

        const updatedQuote = await this.prisma.quotes.update({
            where: { id },
            data: { status: 'Sent' },
            include: QUOTE_ITEMS_INCLUDE,
        });

        return mapQuoteResponse(updatedQuote);
    }
}
