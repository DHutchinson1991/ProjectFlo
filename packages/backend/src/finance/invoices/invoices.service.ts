import { Injectable, Inject, NotFoundException, BadRequestException, Logger, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { InquiryTasksService } from '../../workflow/tasks/inquiry/services/inquiry-tasks.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { computeItemsTotal, roundMoney } from '../shared/pricing.utils';

const INVOICE_INCLUDE = {
  items: true,
  payments: true,
  quote: { select: { id: true, quote_number: true, title: true, total_amount: true, currency: true } },
  milestone: { select: { id: true, label: true, amount: true, due_date: true, status: true, order_index: true } },
  inquiry: {
    select: {
      id: true,
      contact: {
        select: { first_name: true, last_name: true, email: true, phone_number: true },
      },
    },
  },
  brand: {
    select: {
      id: true, name: true, display_name: true, email: true, phone: true,
      address_line1: true, address_line2: true, city: true, state: true,
      country: true, postal_code: true, logo_url: true, currency: true,
      tax_number: true, bank_name: true, bank_account_name: true,
      bank_sort_code: true, bank_account_number: true,
      default_payment_method: true,
    },
  },
} as const;

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => InquiryTasksService))
    private inquiryTasksService: InquiryTasksService,
  ) { }

  async create(inquiryId: number, createInvoiceDto: CreateInvoiceDto, brandId?: number) {
    const subtotal = computeItemsTotal(createInvoiceDto.items);
    const taxRate = createInvoiceDto.tax_rate ?? 0;
    const taxAmount = subtotal * (taxRate / 100);
    const totalAmount = subtotal + taxAmount;

    return await this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoices.create({
        data: {
          inquiry_id: inquiryId,
          brand_id: brandId ?? null,
          project_id: createInvoiceDto.project_id || null,
          quote_id: createInvoiceDto.quote_id || null,
          proposal_id: createInvoiceDto.proposal_id || null,
          milestone_id: createInvoiceDto.milestone_id || null,
          invoice_number: createInvoiceDto.invoice_number,
          title: createInvoiceDto.title || null,
          issue_date: new Date(createInvoiceDto.issue_date),
          due_date: new Date(createInvoiceDto.due_date),
          subtotal,
          tax_rate: taxRate,
          amount: totalAmount,
          currency: createInvoiceDto.currency || 'USD',
          notes: createInvoiceDto.notes || null,
          terms: createInvoiceDto.terms || null,
          payment_method: createInvoiceDto.payment_method || null,
          status: createInvoiceDto.status || 'Draft',
        },
      });

      await Promise.all(
        createInvoiceDto.items.map(item =>
          tx.invoice_items.create({
            data: {
              invoice_id: invoice.id,
              description: item.description,
              category: item.category || null,
              quantity: item.quantity,
              unit_price: item.unit_price,
            },
          })
        )
      );

      return tx.invoices.findUnique({ where: { id: invoice.id }, include: INVOICE_INCLUDE });
    });
  }

  async findAll(inquiryId: number) {
    return await this.prisma.invoices.findMany({
      where: { inquiry_id: inquiryId },
      include: INVOICE_INCLUDE,
      orderBy: { due_date: 'asc' },
    });
  }

  async findOne(inquiryId: number, id: number) {
    const invoice = await this.prisma.invoices.findFirst({
      where: { id, inquiry_id: inquiryId },
      include: INVOICE_INCLUDE,
    });
    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found for inquiry ${inquiryId}`);
    }
    return invoice;
  }

  async update(inquiryId: number, id: number, updateInvoiceDto: UpdateInvoiceDto) {
    await this.findOne(inquiryId, id);

    return await this.prisma.$transaction(async (tx) => {
      let subtotal: number | undefined;

      if (updateInvoiceDto.items) {
        const normalizedItems = updateInvoiceDto.items.map((item) => ({
          ...item,
          quantity: item.quantity ?? 1,
          unit_price: item.unit_price ?? 0,
        }));
        subtotal = computeItemsTotal(normalizedItems);

        await tx.invoice_items.deleteMany({ where: { invoice_id: id } });
        await Promise.all(
          normalizedItems.map(item =>
            tx.invoice_items.create({
              data: {
                invoice_id: id,
                description: item.description || '',
                category: item.category || null,
                quantity: item.quantity,
                unit_price: item.unit_price,
              },
            })
          )
        );
      }

      const taxRate = updateInvoiceDto.tax_rate;
      let totalAmount: number | undefined;
      if (subtotal !== undefined) {
        const rate = taxRate ?? 0;
        totalAmount = subtotal + subtotal * (rate / 100);
      }

      const updateData: Record<string, unknown> = {};
      if (updateInvoiceDto.invoice_number) updateData.invoice_number = updateInvoiceDto.invoice_number;
      if (updateInvoiceDto.title !== undefined) updateData.title = updateInvoiceDto.title;
      if (updateInvoiceDto.issue_date) updateData.issue_date = new Date(updateInvoiceDto.issue_date);
      if (updateInvoiceDto.due_date) updateData.due_date = new Date(updateInvoiceDto.due_date);
      if (updateInvoiceDto.status) updateData.status = updateInvoiceDto.status;
      if (updateInvoiceDto.project_id !== undefined) updateData.project_id = updateInvoiceDto.project_id;
      if (taxRate !== undefined) updateData.tax_rate = taxRate;
      if (updateInvoiceDto.currency) updateData.currency = updateInvoiceDto.currency;
      if (updateInvoiceDto.notes !== undefined) updateData.notes = updateInvoiceDto.notes;
      if (updateInvoiceDto.terms !== undefined) updateData.terms = updateInvoiceDto.terms;
      if (updateInvoiceDto.payment_method !== undefined) updateData.payment_method = updateInvoiceDto.payment_method;
      if (subtotal !== undefined) updateData.subtotal = subtotal;
      if (totalAmount !== undefined) updateData.amount = totalAmount;

      return await tx.invoices.update({
        where: { id },
        data: updateData,
        include: INVOICE_INCLUDE,
      });
    });
  }

  async remove(inquiryId: number, id: number) {
    await this.findOne(inquiryId, id);
    return await this.prisma.invoices.delete({ where: { id } });
  }

  async recordPayment(inquiryId: number, invoiceId: number, dto: RecordPaymentDto) {
    const invoice = await this.findOne(inquiryId, invoiceId);

    const total = Number(invoice.amount);
    const alreadyPaid = Number(invoice.amount_paid ?? 0);
    const remaining = total - alreadyPaid;

    if (dto.amount > remaining + 0.01) {
      throw new BadRequestException(
        `Payment amount (${dto.amount}) exceeds remaining balance (${remaining.toFixed(2)})`,
      );
    }

    return await this.prisma.$transaction(async (tx) => {
      const payment = await tx.payments.create({
        data: {
          invoice_id: invoiceId,
          amount: dto.amount,
          payment_method: dto.payment_method || 'Bank Transfer',
          transaction_id: dto.transaction_id || null,
          payment_date: dto.payment_date ? new Date(dto.payment_date) : new Date(),
        },
      });

      const newAmountPaid = alreadyPaid + dto.amount;
      const fullyPaid = newAmountPaid >= total - 0.01;

      await tx.invoices.update({
        where: { id: invoiceId },
        data: {
          amount_paid: newAmountPaid,
          status: fullyPaid ? 'Paid' : 'Partially Paid',
        },
      });

      this.logger.log(
        `Manual payment recorded: invoice=${invoice.invoice_number} amount=${dto.amount} method=${dto.payment_method || 'Bank Transfer'} status=${fullyPaid ? 'Paid' : 'Partially Paid'}`,
      );

      return tx.invoices.findUnique({ where: { id: invoiceId }, include: INVOICE_INCLUDE });
    });
  }

  /**
   * Auto-generate invoices from quote payment milestones.
   * Called when a proposal is created (quote auto-created from estimate).
   * Creates one invoice per payment milestone, linked to the quote and milestone.
   */
  async autoGenerateFromQuoteMilestones(inquiryId: number, brandId: number): Promise<void> {
    // Delete existing draft invoices so we always regenerate from current milestones.
    // Only drafts are deleted — sent/paid invoices are preserved.
    const deleted = await this.prisma.invoices.deleteMany({
      where: { inquiry_id: inquiryId, status: 'Draft' },
    });
    if (deleted.count > 0) {
      this.logger.log(`Deleted ${deleted.count} draft invoice(s) for inquiry ${inquiryId} before regeneration`);
    }

    // If any non-draft invoices exist, skip regeneration to avoid duplicates
    const nonDraftInvoice = await this.prisma.invoices.findFirst({
      where: { inquiry_id: inquiryId, status: { not: 'Draft' } },
    });
    if (nonDraftInvoice) {
      this.logger.log(`Non-draft invoices exist for inquiry ${inquiryId}, skipping regeneration`);
      return;
    }

    // Get the primary quote with milestones and items
    const primaryQuote = await this.prisma.quotes.findFirst({
      where: { inquiry_id: inquiryId, is_primary: true },
      include: {
        items: { orderBy: { id: 'asc' } },
        payment_milestones: { orderBy: { order_index: 'asc' } },
      },
    });

    if (!primaryQuote) {
      this.logger.warn(`No primary quote for inquiry ${inquiryId}, cannot auto-generate invoices`);
      return;
    }

    // Get brand for invoice branding
    const brand = await this.prisma.brands.findUnique({
      where: { id: brandId },
      select: {
        currency: true, default_payment_method: true,
        default_tax_rate: true, payment_terms_days: true,
      },
    });

    const currency = primaryQuote.currency || brand?.currency || 'USD';
    const taxRate = primaryQuote.tax_rate ? Number(primaryQuote.tax_rate) : (brand?.default_tax_rate ? Number(brand.default_tax_rate) : 0);
    const paymentMethod = brand?.default_payment_method || 'Bank Transfer';
    const quoteSubtotal = Number(primaryQuote.total_amount); // pre-tax
    const quoteTotalWithTax = roundMoney(quoteSubtotal * (1 + taxRate / 100)); // post-tax — what client owes

    if (primaryQuote.payment_milestones.length > 0) {
      // Recalculate milestone amounts proportionally from the current quote total.
      // Stored milestone amounts may be stale if the quote items changed after
      // the payment schedule was applied.
      const storedMilestoneSum = primaryQuote.payment_milestones.reduce(
        (s, m) => s + Number(m.amount), 0,
      );

      // Create one invoice per milestone
      for (const milestone of primaryQuote.payment_milestones) {
        const proportion = storedMilestoneSum > 0
          ? Number(milestone.amount) / storedMilestoneSum
          : 1 / primaryQuote.payment_milestones.length;
        const milestoneTotal = roundMoney(quoteTotalWithTax * proportion); // post-tax invoice amount
        const milestoneSubtotal = roundMoney(quoteSubtotal * proportion); // pre-tax subtotal
        const invoiceNumber = `INV-${inquiryId}-${milestone.order_index + 1}`;

        // Aggregate quote items by category, then pro-rate per milestone.
        // This produces one invoice line per category (e.g. "Planning", "Equipment")
        // instead of fractional copies of every individual line item.
        const catTotals: Record<string, number> = {};
        for (const item of primaryQuote.items) {
          const cat = item.category || 'Services';
          catTotals[cat] = (catTotals[cat] ?? 0) + Number(item.quantity) * Number(item.unit_price);
        }
        const items = Object.entries(catTotals).map(([cat, total]) => ({
          description: cat,
          category: cat,
          quantity: 1,
          unit_price: roundMoney(total * proportion),
        }));

        await this.prisma.invoices.create({
          data: {
            inquiry_id: inquiryId,
            brand_id: brandId,
            quote_id: primaryQuote.id,
            milestone_id: milestone.id,
            invoice_number: invoiceNumber,
            title: milestone.label,
            issue_date: new Date(),
            due_date: milestone.due_date,
            subtotal: milestoneSubtotal,
            tax_rate: taxRate,
            amount: milestoneTotal,
            currency,
            payment_method: paymentMethod,
            terms: primaryQuote.terms || null,
            notes: milestone.notes || null,
            status: 'Draft',
            items: {
              create: items.length > 0 ? items.map(it => ({
                description: it.description,
                category: it.category,
                quantity: it.quantity,
                unit_price: it.unit_price,
              })) : [{
                description: milestone.label,
                quantity: 1,
                unit_price: milestoneSubtotal,
              }],
            },
          },
        });

        this.logger.log(`Created invoice ${invoiceNumber} for milestone "${milestone.label}" (${milestoneTotal} ${currency})`);
      }
    } else {
      // No milestones — create single invoice for the total
      const now = new Date();
      const paymentDays = brand?.payment_terms_days ?? 30;
      const dueDate = new Date(now.getTime() + paymentDays * 24 * 60 * 60 * 1000);
      const subtotal = quoteSubtotal;
      const totalAmount = quoteTotalWithTax;

      await this.prisma.invoices.create({
        data: {
          inquiry_id: inquiryId,
          brand_id: brandId,
          quote_id: primaryQuote.id,
          invoice_number: `INV-${inquiryId}-1`,
          title: primaryQuote.title || 'Invoice',
          issue_date: now,
          due_date: dueDate,
          subtotal,
          tax_rate: taxRate,
          amount: totalAmount,
          currency,
          payment_method: paymentMethod,
          terms: primaryQuote.terms || null,
          status: 'Draft',
          items: {
            create: primaryQuote.items.map(item => ({
              description: item.description,
              category: item.category || null,
              quantity: Number(item.quantity),
              unit_price: Number(item.unit_price),
            })),
          },
        },
      });

      this.logger.log(`Created single invoice for inquiry ${inquiryId} (${totalAmount} ${currency})`);
    }
  }

  /**
   * @deprecated Use autoGenerateFromQuoteMilestones instead.
   * Kept as a thin redirect for any remaining callers.
   */
  async autoGenerateDepositInvoice(inquiryId: number): Promise<void> {
    // Resolve brandId from the inquiry's contact
    const inquiry = await this.prisma.inquiries.findUnique({
      where: { id: inquiryId },
      select: { contact: { select: { brand_id: true } } },
    });
    const brandId = inquiry?.contact?.brand_id;
    if (!brandId) {
      this.logger.warn(`Cannot auto-generate invoices for inquiry ${inquiryId}: no brand_id on contact`);
      return;
    }
    await this.autoGenerateFromQuoteMilestones(inquiryId, brandId);
    await this.inquiryTasksService.autoCompleteByName(inquiryId, 'Raise Deposit Invoice');
  }
}
