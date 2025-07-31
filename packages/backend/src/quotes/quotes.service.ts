import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { Quote } from './entities/quote.entity';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class QuotesService {
    constructor(private prisma: PrismaService) { }

    async create(inquiryId: number, createQuoteDto: CreateQuoteDto): Promise<Quote> {
        // Calculate total amount from items
        const totalAmount = createQuoteDto.items.reduce(
            (sum, item) => sum + (item.quantity * item.unit_price),
            0
        );

        return await this.prisma.$transaction(async (tx) => {
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
                },
            });

            // Create quote items
            await Promise.all(
                createQuoteDto.items.map(item =>
                    tx.quote_items.create({
                        data: {
                            quote_id: quote.id,
                            description: item.description,
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
            } as Quote;
        });
    }

    async findAll(inquiryId: number) {
        const quotes = await this.prisma.quotes.findMany({
            where: { inquiry_id: inquiryId },
            include: {
                items: {
                    select: {
                        id: true,
                        description: true,
                        quantity: true,
                        unit_price: true,
                    },
                },
            },
            orderBy: { created_at: 'desc' },
        });

        // Convert Decimal to number for the interface
        return quotes.map(quote => ({
            ...quote,
            total_amount: Number(quote.total_amount),
            items: quote.items.map(item => ({
                ...item,
                unit_price: Number(item.unit_price),
            })),
        }));
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
                        description: true,
                        quantity: true,
                        unit_price: true,
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
            items: quote.items.map(item => ({
                ...item,
                unit_price: Number(item.unit_price),
            })),
        };
    }

    async update(inquiryId: number, id: number, updateQuoteDto: UpdateQuoteDto) {
        // First verify the quote exists and belongs to the inquiry
        await this.findOne(inquiryId, id);

        return await this.prisma.$transaction(async (tx) => {
            let totalAmount: number | undefined;

            // If items are being updated, calculate new total
            if (updateQuoteDto.items) {
                totalAmount = updateQuoteDto.items.reduce(
                    (sum, item) => sum + ((item.quantity || 0) * (item.unit_price || 0)),
                    0
                );

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
                                quantity: item.quantity || 0,
                                unit_price: new Decimal(item.unit_price || 0),
                            },
                        })
                    )
                );
            }

            // Build update data with proper typing
            const updateData: {
                quote_number?: string;
                issue_date?: Date;
                expiry_date?: Date;
                status?: string;
                project_id?: number | null;
                consultation_notes?: string | null;
                total_amount?: Decimal;
            } = {};

            if (updateQuoteDto.quote_number) {
                updateData.quote_number = updateQuoteDto.quote_number;
            }
            if (updateQuoteDto.issue_date) {
                updateData.issue_date = new Date(updateQuoteDto.issue_date);
            }
            if (updateQuoteDto.expiry_date) {
                updateData.expiry_date = new Date(updateQuoteDto.expiry_date);
            }
            if (updateQuoteDto.status) {
                updateData.status = updateQuoteDto.status;
            }
            if (updateQuoteDto.consultation_notes !== undefined) {
                updateData.consultation_notes = updateQuoteDto.consultation_notes;
            }
            if (updateQuoteDto.project_id !== undefined) {
                updateData.project_id = updateQuoteDto.project_id;
            }
            if (totalAmount !== undefined) {
                updateData.total_amount = new Decimal(totalAmount);
            }

            const updatedQuote = await tx.quotes.update({
                where: { id },
                data: updateData,
                include: {
                    items: {
                        select: {
                            id: true,
                            description: true,
                            quantity: true,
                            unit_price: true,
                        },
                    },
                },
            });

            // Convert Decimal to number for the interface
            return {
                ...updatedQuote,
                total_amount: Number(updatedQuote.total_amount),
                items: updatedQuote.items.map(item => ({
                    ...item,
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
                        description: true,
                        quantity: true,
                        unit_price: true,
                    },
                },
            },
        });

        // Convert Decimal to number for the interface
        return {
            ...updatedQuote,
            total_amount: Number(updatedQuote.total_amount),
            items: updatedQuote.items.map(item => ({
                ...item,
                unit_price: Number(item.unit_price),
            })),
        };
    }
}
