import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import { roundMoney } from '../shared/pricing.utils';
import { CreatePaymentScheduleTemplateDto } from './dto/create-payment-schedule-template.dto';
import { UpdatePaymentScheduleTemplateDto } from './dto/update-payment-schedule-template.dto';
import { ApplyScheduleToEstimateDto } from './dto/apply-schedule-to-estimate.dto';
import { ApplyScheduleToQuoteDto } from './dto/apply-schedule-to-quote.dto';

@Injectable()
export class PaymentSchedulesService {
  constructor(private prisma: PrismaService) {}

  // ── Templates CRUD ─────────────────────────────────────────────────────────

  async findAllTemplates(brandId: number) {
    return this.prisma.payment_schedule_templates.findMany({
      where: { brand_id: brandId, is_active: true },
      include: { rules: { orderBy: { order_index: 'asc' } } },
      orderBy: [{ is_default: 'desc' }, { name: 'asc' }],
    });
  }

  async findOneTemplate(brandId: number, id: number) {
    const template = await this.prisma.payment_schedule_templates.findFirst({
      where: { id, brand_id: brandId },
      include: { rules: { orderBy: { order_index: 'asc' } } },
    });
    if (!template) throw new NotFoundException(`Payment schedule template ${id} not found`);
    return template;
  }

  async createTemplate(dto: CreatePaymentScheduleTemplateDto) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        // If this is being set as default, unset others
        if (dto.is_default) {
          await tx.payment_schedule_templates.updateMany({
            where: { brand_id: dto.brand_id, is_default: true },
            data: { is_default: false },
          });
        }

        return tx.payment_schedule_templates.create({
          data: {
            brand_id: dto.brand_id,
            name: dto.name,
            description: dto.description,
            is_default: dto.is_default ?? false,
            rules: {
              create: (dto.rules ?? []).map((r, i) => ({
                label: r.label,
                amount_type: r.amount_type ?? 'PERCENT',
                amount_value: new Decimal(r.amount_value),
                trigger_type: r.trigger_type,
                trigger_days: r.trigger_days ?? null,
                order_index: r.order_index ?? i,
              })),
            },
          },
          include: { rules: { orderBy: { order_index: 'asc' } } },
        });
      });
    } catch (e: unknown) {
      if ((e as { code?: string })?.code === 'P2002') {
        throw new ConflictException(`A template named "${dto.name}" already exists for this brand`);
      }
      throw e;
    }
  }

  async updateTemplate(brandId: number, id: number, dto: UpdatePaymentScheduleTemplateDto) {
    await this.findOneTemplate(brandId, id); // 404 guard

    return this.prisma.$transaction(async (tx) => {
      if (dto.is_default) {
        await tx.payment_schedule_templates.updateMany({
          where: { brand_id: brandId, is_default: true, id: { not: id } },
          data: { is_default: false },
        });
      }

      // If rules are provided, replace all rules
      if (dto.rules !== undefined) {
        await tx.payment_schedule_rules.deleteMany({ where: { template_id: id } });
        await tx.payment_schedule_rules.createMany({
          data: dto.rules.map((r, i) => ({
            template_id: id,
            label: r.label,
            amount_type: r.amount_type,
            amount_value: new Decimal(r.amount_value),
            trigger_type: r.trigger_type,
            trigger_days: r.trigger_days ?? null,
            order_index: r.order_index ?? i,
          })),
        });
      }

      return tx.payment_schedule_templates.update({
        where: { id },
        data: {
          ...(dto.name !== undefined && { name: dto.name }),
          ...(dto.description !== undefined && { description: dto.description }),
          ...(dto.is_default !== undefined && { is_default: dto.is_default }),
          ...(dto.is_active !== undefined && { is_active: dto.is_active }),
        },
        include: { rules: { orderBy: { order_index: 'asc' } } },
      });
    });
  }

  async deleteTemplate(brandId: number, id: number) {
    await this.findOneTemplate(brandId, id);
    await this.prisma.payment_schedule_templates.update({
      where: { id },
      data: { is_active: false },
    });
    return { success: true };
  }

  // ── Shared milestone resolution ─────────────────────────────────────────────

  private resolveDueDate(triggerType: string, days: number, bookingDate: Date, eventDate: Date): Date {
    switch (triggerType) {
      case 'AFTER_BOOKING': { const d = new Date(bookingDate); d.setDate(d.getDate() + days); return d; }
      case 'BEFORE_EVENT': { const d = new Date(eventDate); d.setDate(d.getDate() - days); return d; }
      case 'AFTER_EVENT': { const d = new Date(eventDate); d.setDate(d.getDate() + days); return d; }
      default: return new Date(bookingDate);
    }
  }

  private resolveRuleMilestones(
    rules: { label: string; amount_type: string; amount_value: Decimal | number; trigger_type: string; trigger_days: number | null; order_index: number }[],
    bookingDate: Date,
    eventDate: Date,
    total: number,
  ) {
    const pctSum = rules
      .filter(r => r.amount_type === 'PERCENT')
      .reduce((s, r) => s + Number(r.amount_value), 0);
    if (pctSum > 100) throw new BadRequestException('Template rules percentages exceed 100%');

    return rules.map((rule, i) => {
      const amount = rule.amount_type === 'PERCENT'
        ? roundMoney((Number(rule.amount_value) / 100) * total)
        : Number(rule.amount_value);

      return {
        label: rule.label,
        amount: new Decimal(amount),
        due_date: this.resolveDueDate(rule.trigger_type, rule.trigger_days ?? 0, bookingDate, eventDate),
        status: 'PENDING',
        order_index: rule.order_index ?? i,
      };
    });
  }

  // ── Apply template to an estimate → create resolved milestones ─────────────

  async applyToEstimate(estimateId: number, dto: ApplyScheduleToEstimateDto) {
    const template = await this.prisma.payment_schedule_templates.findUnique({
      where: { id: dto.template_id },
      include: { rules: { orderBy: { order_index: 'asc' } } },
    });
    if (!template) throw new NotFoundException(`Template ${dto.template_id} not found`);

    const milestones = this.resolveRuleMilestones(
      template.rules, new Date(dto.booking_date), new Date(dto.event_date), dto.total_amount,
    ).map(m => ({ ...m, estimate_id: estimateId }));

    await this.prisma.$transaction(async (tx) => {
      await tx.estimate_payment_milestones.deleteMany({ where: { estimate_id: estimateId } });
      await tx.estimate_payment_milestones.createMany({ data: milestones });
      await tx.estimates.update({
        where: { id: estimateId },
        data: { schedule_template_id: dto.template_id },
      });
    });

    return this.getMilestonesForEstimate(estimateId);
  }

  async getMilestonesForEstimate(estimateId: number) {
    return this.prisma.estimate_payment_milestones.findMany({
      where: { estimate_id: estimateId },
      orderBy: { order_index: 'asc' },
    });
  }

  async updateMilestoneStatus(milestoneId: number, status: string) {
    return this.prisma.estimate_payment_milestones.update({
      where: { id: milestoneId },
      data: { status },
    });
  }

  async getDefaultTemplate(brandId: number) {
    return this.prisma.payment_schedule_templates.findFirst({
      where: { brand_id: brandId, is_default: true, is_active: true },
      include: { rules: { orderBy: { order_index: 'asc' } } },
    });
  }

  // ── Apply template to a quote → create resolved milestones ──────────────────

  async applyToQuote(quoteId: number, dto: ApplyScheduleToQuoteDto) {
    const template = await this.prisma.payment_schedule_templates.findUnique({
      where: { id: dto.template_id },
      include: { rules: { orderBy: { order_index: 'asc' } } },
    });
    if (!template) throw new NotFoundException(`Template ${dto.template_id} not found`);

    const milestones = this.resolveRuleMilestones(
      template.rules, new Date(dto.booking_date), new Date(dto.event_date), dto.total_amount,
    ).map(m => ({ ...m, quote_id: quoteId }));

    await this.prisma.$transaction(async (tx) => {
      await tx.quote_payment_milestones.deleteMany({ where: { quote_id: quoteId } });
      await tx.quote_payment_milestones.createMany({ data: milestones });
      await tx.quotes.update({
        where: { id: quoteId },
        data: { schedule_template_id: dto.template_id },
      });
    });

    return this.getMilestonesForQuote(quoteId);
  }

  async getMilestonesForQuote(quoteId: number) {
    return this.prisma.quote_payment_milestones.findMany({
      where: { quote_id: quoteId },
      orderBy: { order_index: 'asc' },
    });
  }

  async updateQuoteMilestoneStatus(milestoneId: number, status: string) {
    return this.prisma.quote_payment_milestones.update({
      where: { id: milestoneId },
      data: { status },
    });
  }
}
