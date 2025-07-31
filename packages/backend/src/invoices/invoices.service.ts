import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) { }

  async create(inquiryId: number, createInvoiceDto: CreateInvoiceDto) {
    // Calculate total amount from items
    const totalAmount = createInvoiceDto.items.reduce(
      (sum, item) => sum + (item.quantity * item.unit_price),
      0
    );

    return await this.prisma.$transaction(async (tx) => {
      // Create the invoice
      const invoice = await tx.invoices.create({
        data: {
          inquiry_id: inquiryId,
          project_id: createInvoiceDto.project_id || null,
          invoice_number: createInvoiceDto.invoice_number,
          issue_date: new Date(createInvoiceDto.issue_date),
          due_date: new Date(createInvoiceDto.due_date),
          amount: totalAmount,
          status: createInvoiceDto.status || 'Draft',
        },
      });

      // Create invoice items
      await Promise.all(
        createInvoiceDto.items.map(item =>
          tx.invoice_items.create({
            data: {
              invoice_id: invoice.id,
              description: item.description,
              quantity: item.quantity,
              unit_price: item.unit_price,
            },
          })
        )
      );

      return invoice;
    });
  }

  async findAll(inquiryId: number) {
    return await this.prisma.invoices.findMany({
      where: { inquiry_id: inquiryId },
      include: {
        items: true,
      },
      orderBy: { id: 'desc' },
    });
  }

  async findOne(inquiryId: number, id: number) {
    const invoice = await this.prisma.invoices.findFirst({
      where: {
        id: id,
        inquiry_id: inquiryId,
      },
      include: {
        items: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found for inquiry ${inquiryId}`);
    }

    return invoice;
  }

  async update(inquiryId: number, id: number, updateInvoiceDto: UpdateInvoiceDto) {
    // First verify the invoice exists and belongs to the inquiry
    await this.findOne(inquiryId, id);

    return await this.prisma.$transaction(async (tx) => {
      let totalAmount: number | undefined;

      // If items are being updated, calculate new total
      if (updateInvoiceDto.items) {
        totalAmount = updateInvoiceDto.items.reduce(
          (sum, item) => sum + ((item.quantity || 0) * (item.unit_price || 0)),
          0
        );

        // Delete existing items
        await tx.invoice_items.deleteMany({
          where: { invoice_id: id },
        });

        // Create new items
        await Promise.all(
          updateInvoiceDto.items.map(item =>
            tx.invoice_items.create({
              data: {
                invoice_id: id,
                description: item.description || '',
                quantity: item.quantity || 0,
                unit_price: item.unit_price || 0,
              },
            })
          )
        );
      }

      // Update the invoice
      const updateData = {
        ...(updateInvoiceDto.invoice_number && { invoice_number: updateInvoiceDto.invoice_number }),
        ...(updateInvoiceDto.issue_date && { issue_date: new Date(updateInvoiceDto.issue_date) }),
        ...(updateInvoiceDto.due_date && { due_date: new Date(updateInvoiceDto.due_date) }),
        ...(updateInvoiceDto.status && { status: updateInvoiceDto.status }),
        ...(updateInvoiceDto.project_id !== undefined && { project_id: updateInvoiceDto.project_id }),
        ...(totalAmount !== undefined && { amount: totalAmount }),
      };

      return await tx.invoices.update({
        where: { id },
        data: updateData,
        include: {
          items: true,
        },
      });
    });
  }

  async remove(inquiryId: number, id: number) {
    // First verify the invoice exists and belongs to the inquiry
    await this.findOne(inquiryId, id);

    return await this.prisma.invoices.delete({
      where: { id },
    });
  }
}
