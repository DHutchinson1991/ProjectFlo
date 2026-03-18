import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { Quote } from './entities/quote.entity';
import { Decimal } from '@prisma/client/runtime/library';
import { InquiryTasksService } from '../inquiry-tasks/inquiry-tasks.service';

@Injectable()
export class QuotesService {
    constructor(
        private prisma: PrismaService,
        private inquiryTasksService: InquiryTasksService,
    ) { }

    async create(inquiryId: number, createQuoteDto: CreateQuoteDto): Promise<Quote> {
        // Calculate total amount from items using Decimal for precision
        const totalAmount = createQuoteDto.items
            .reduce((sum, item) => sum.add(new Decimal(item.quantity).mul(new Decimal(item.unit_price))), new Decimal(0))
            .toNumber();

        const result = await this.prisma.$transaction(async (tx) => {
            // Resolve brand currency from inquiry → contact → brand
            const inquiry = await tx.inquiries.findUnique({
                where: { id: inquiryId },
                select: { contact: { select: { brand: { select: { currency: true } } } } },
            });
            const currency = inquiry?.contact?.brand?.currency || 'USD';

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
            include: {
                items: {
                    select: {
                        id: true,
                        category: true,
                        description: true,
                        quantity: true,
                        unit: true,
                        unit_price: true,
                        service_date: true,
                        start_time: true,
                        end_time: true,
                    },
                },
            },
            orderBy: { created_at: 'desc' },
        });

        // Convert Decimal to number for the interface
        return quotes.map(quote => {
            const totalAmount = Number(quote.total_amount);
            const taxRate = quote.tax_rate ? Number(quote.tax_rate) : 0;
            return {
                ...quote,
                total_amount: totalAmount,
                total_with_tax: Math.round((totalAmount + totalAmount * (taxRate / 100)) * 100) / 100,
                items: quote.items.map(item => ({
                    ...item,
                    quantity: Number(item.quantity),
                    unit_price: Number(item.unit_price),
                })),
            };
        });
    }

    async findOne(inquiryId: number, id: number) {
        const quote = await this.prisma.quotes.findFirst({
            where: {
                id: id,
                inquiry_id: inquiryId,
            },
            include: {
                items: {
                    select: {
                        id: true,
                        category: true,
                        description: true,
                        quantity: true,
                        unit: true,
                        unit_price: true,
                        service_date: true,
                        start_time: true,
                        end_time: true,
                    },
                },
            },
        });

        if (!quote) {
            throw new NotFoundException(`Quote with ID ${id} not found for inquiry ${inquiryId}`);
        }

        // Convert Decimal to number for the interface
        return {
            ...quote,
            total_amount: Number(quote.total_amount),
            total_with_tax: Math.round((Number(quote.total_amount) + Number(quote.total_amount) * (Number(quote.tax_rate || 0) / 100)) * 100) / 100,
            items: quote.items.map(item => ({
                ...item,
                quantity: Number(item.quantity),
                unit_price: Number(item.unit_price),
            })),
        };
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
                totalAmount = updateQuoteDto.items
                    .reduce((sum, item) => sum.add(new Decimal(item.quantity || 0).mul(new Decimal(item.unit_price || 0))), new Decimal(0))
                    .toNumber();

                // Delete existing items
                await tx.quote_items.deleteMany({
                    where: { quote_id: id },
                });

                // Create new items
                await Promise.all(
                    updateQuoteDto.items.map(item =>
                        tx.quote_items.create({
                            data: {
                                quote_id: id,
                                description: item.description || '',
                                category: item.category,
                                unit: item.unit,
                                service_date: item.service_date ? new Date(item.service_date) : null,
                                start_time: item.start_time,
                                end_time: item.end_time,
                                quantity: item.quantity || 0,
                                unit_price: new Decimal(item.unit_price || 0),
                            },
                        })
                    )
                );
            }

            // Build update data
            const updateData: any = {};

            if (updateQuoteDto.quote_number) updateData.quote_number = updateQuoteDto.quote_number;
            if (updateQuoteDto.issue_date) updateData.issue_date = new Date(updateQuoteDto.issue_date);
            if (updateQuoteDto.expiry_date) updateData.expiry_date = new Date(updateQuoteDto.expiry_date);
            if (updateQuoteDto.status) updateData.status = updateQuoteDto.status;
            if (updateQuoteDto.consultation_notes !== undefined) updateData.consultation_notes = updateQuoteDto.consultation_notes;
            if (updateQuoteDto.project_id !== undefined) updateData.project_id = updateQuoteDto.project_id;
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
                include: {
                    items: {
                        select: {
                            id: true,
                            category: true,
                            description: true,
                            quantity: true,
                            unit: true,
                            unit_price: true,
                            service_date: true,
                            start_time: true,
                            end_time: true,
                        },
                    },
                },
            });

            // Convert Decimal to number for the interface
            return {
                ...updatedQuote,
                total_amount: Number(updatedQuote.total_amount),
                total_with_tax: Math.round((Number(updatedQuote.total_amount) + Number(updatedQuote.total_amount) * (Number(updatedQuote.tax_rate || 0) / 100)) * 100) / 100,
                items: updatedQuote.items.map(item => ({
                    ...item,
                    quantity: Number(item.quantity),
                    unit_price: Number(item.unit_price),
                })),
            };
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
            data: {
                status: 'Sent',
            },
            include: {
                items: {
                    select: {
                        id: true,
                        category: true,
                        description: true,
                        quantity: true,
                        unit: true,
                        unit_price: true,
                        service_date: true,
                        start_time: true,
                        end_time: true,
                    },
                },
            },
        });

        // Convert Decimal to number for the interface
        return {
            ...updatedQuote,
            total_amount: Number(updatedQuote.total_amount),
            total_with_tax: Math.round((Number(updatedQuote.total_amount) + Number(updatedQuote.total_amount) * (Number(updatedQuote.tax_rate || 0) / 100)) * 100) / 100,
            items: updatedQuote.items.map(item => ({
                ...item,
                unit_price: Number(item.unit_price),
            })),
        };
    }
}
