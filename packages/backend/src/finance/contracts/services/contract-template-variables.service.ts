import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { ContractTemplatesService } from '../contract-templates.service';
import { AVAILABLE_VARIABLES, VariableCategory } from '../constants/available-variables.constants';
import { roundMoney } from '../../shared/pricing.utils';
import { formatCurrency, DEFAULT_CURRENCY } from '@projectflo/shared';

@Injectable()
export class ContractTemplateVariablesService {
  constructor(
    private prisma: PrismaService,
    private templateService: ContractTemplatesService,
  ) {}

  async preview(brandId: number, templateId: number, inquiryId?: number) {
    const tmpl = await this.templateService.findOne(brandId, templateId);

    let variables: Record<string, string> = {};
    if (inquiryId) {
      variables = await this.resolveVariables(inquiryId);
    }

    const sections = tmpl.template_clauses.map((tc) => {
      const body = tc.override_body || tc.clause.body;
      return {
        clause_id: tc.clause_id,
        title: tc.clause.title,
        category: tc.clause.category?.name || '',
        body: this.interpolate(body, variables),
        order_index: tc.order_index,
      };
    });

    return {
      template_id: tmpl.id,
      template_name: tmpl.name,
      inquiry_id: inquiryId || null,
      sections,
      available_variables: this.getAvailableVariables(),
    };
  }

  async resolveVariables(inquiryId: number): Promise<Record<string, string>> {
    const inquiry = await this.prisma.inquiries.findUnique({
      where: { id: inquiryId },
      include: {
        contact: true,
        client: true,
        selected_package: { include: { wedding_type: true } },
        estimates: {
          orderBy: [{ is_primary: 'desc' }, { updated_at: 'desc' }],
          include: {
            items: true,
            payment_milestones: { orderBy: { order_index: 'asc' } },
          },
        },
        schedule_event_days: {
          include: {
            activities: true,
            subjects: true,
            location_slots: { include: { location: true } },
          },
          orderBy: { order_index: 'asc' },
        },
        schedule_films: { include: { film: true } },
        schedule_day_crew_slots: {
          include: { crew: { include: { contact: true } }, job_role: true },
        },
      },
    });

    if (!inquiry) return {};

    const contact = inquiry.contact;
    const estimate = inquiry.estimates?.find((e) => e.is_primary) || inquiry.estimates?.[0];
    const pkg = inquiry.selected_package;
    const eventDays = inquiry.schedule_event_days || [];
    const films = inquiry.schedule_films || [];
    const crewSlots = inquiry.schedule_day_crew_slots || [];

    const brand = contact?.brand_id
      ? await this.prisma.brands.findUnique({ where: { id: contact.brand_id } })
      : null;

    const scheduleTemplate = estimate?.schedule_template_id
      ? await this.prisma.payment_schedule_templates.findUnique({
          where: { id: estimate.schedule_template_id },
          include: { rules: { orderBy: { order_index: 'asc' } } },
        })
      : null;

    const weddingDate = inquiry.wedding_date;

    const filmNames = films.map((f) => f.film?.name).filter(Boolean);
    const crewList = crewSlots.map((op) => {
      const c = op.crew?.contact;
      const name = c ? `${c.first_name || ''} ${c.last_name || ''}`.trim() : 'TBC';
      return `${op.label ?? op.job_role?.display_name ?? op.job_role?.name ?? 'Crew'}: ${name}`;
    }).filter(Boolean);

    const eventDaySummary = eventDays.map((day) => {
      const time = [day.start_time, day.end_time].filter(Boolean).join(' – ');
      return `${day.name}${time ? ` (${time})` : ''}`;
    }).join(', ');

    const locations = eventDays.flatMap((d) => d.location_slots || []).map((s) => s.name).filter(Boolean);
    const subjects = eventDays.flatMap((d) => d.subjects || []).map((s) => s.real_name || s.name).filter(Boolean);

    const milestones = estimate?.payment_milestones || [];
    const milestoneSummary = milestones
      .map(
        (m) =>
          `${m.label}: ${formatCurrency(Number(m.amount), pkg?.currency)} due ${formatDate(m.due_date, 'short')}`,
      )
      .join('\n');

    const firstSlot = eventDays
      .flatMap((d) => d.location_slots || [])
      .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))[0];
    const primaryVenueName = firstSlot?.location?.name || firstSlot?.name || '';
    const primaryVenueAddress = firstSlot?.location?.address_line1 || firstSlot?.address || '';

    return {
      'client.full_name': [contact?.first_name, contact?.last_name].filter(Boolean).join(' '),
      'client.first_name': contact?.first_name || '',
      'client.last_name': contact?.last_name || '',
      'client.email': contact?.email || '',
      'client.phone': contact?.phone_number || '',
      'client.company': contact?.company_name || '',
      'event.date': formatDate(weddingDate),
      'event.date_short': formatDate(weddingDate, 'short'),
      'event.venue': primaryVenueName,
      'event.venue_address': primaryVenueAddress,
      'event.days': eventDaySummary,
      'event.day_count': String(eventDays.length),
      'event.locations': locations.join(', '),
      'event.subjects': subjects.join(', '),
      'package.name': pkg?.name || '',
      'package.price': formatCurrency(estimate ? Number(estimate.total_amount) : null, pkg?.currency),
      'package.currency': pkg?.currency || DEFAULT_CURRENCY,
      'films.list': filmNames.join(', '),
      'films.count': String(filmNames.length),
      'crew.list': crewList.join('\n'),
      'crew.count': String(crewSlots.length),
      'estimate.total': formatCurrency(estimate ? Number(estimate.total_amount) : null, pkg?.currency),
      'estimate.deposit': formatCurrency(estimate ? Number(estimate.deposit_required) : null, pkg?.currency),
      'estimate.tax_rate': estimate?.tax_rate ? `${Number(estimate.tax_rate)}%` : '',
      'estimate.payment_schedule': milestoneSummary,
      'estimate.number': estimate?.estimate_number || '',
      'payment.schedule_name': scheduleTemplate?.name || '',
      'payment.schedule_summary': scheduleTemplate
        ? scheduleTemplate.rules
            .map((r) => {
              const totalNum = estimate ? Number(estimate.total_amount) : null;
              const amountStr =
                r.amount_type === 'PERCENT'
                  ? `${Number(r.amount_value)}%${totalNum ? ` (${formatCurrency(roundMoney((totalNum * Number(r.amount_value)) / 100), pkg?.currency)})` : ''}`
                  : formatCurrency(Number(r.amount_value), pkg?.currency);
              const trigger =
                r.trigger_type === 'AFTER_BOOKING'
                  ? 'on booking'
                  : r.trigger_type === 'BEFORE_EVENT'
                    ? `${r.trigger_days} days before the event`
                    : r.trigger_type === 'AFTER_EVENT'
                      ? `${r.trigger_days} days after the event`
                      : '';
              return `${r.label}: ${amountStr} ${trigger}`.trim();
            })
            .join('; ')
        : '',
      'payment.deposit_amount': (() => {
        const bookingRule = scheduleTemplate?.rules.find((r) => r.trigger_type === 'AFTER_BOOKING');
        if (!bookingRule) return '';
        return bookingRule.amount_type === 'PERCENT'
          ? `${Number(bookingRule.amount_value)}%`
          : formatCurrency(Number(bookingRule.amount_value), pkg?.currency);
      })(),
      'payment.final_balance_timing': (() => {
        const beforeRule = [...(scheduleTemplate?.rules || [])]
          .reverse()
          .find((r) => r.trigger_type === 'BEFORE_EVENT');
        if (beforeRule) return `${beforeRule.trigger_days} days before the event`;
        return '';
      })(),
      'payment.instalment_count': String(scheduleTemplate?.rules.length || 0),
      'brand.name': brand?.name || '',
      'brand.email': brand?.email || '',
      'brand.phone': brand?.phone || '',
      'brand.website': brand?.website || '',
      'brand.address': [
        brand?.address_line1,
        brand?.address_line2,
        brand?.city,
        brand?.state,
        brand?.postal_code,
        brand?.country,
      ]
        .filter(Boolean)
        .join(', '),
      'brand.currency': brand?.currency || DEFAULT_CURRENCY,
      'brand.tax_number': brand?.tax_number || '',
      'brand.tax_rate': brand?.default_tax_rate ? `${Number(brand.default_tax_rate)}%` : '',
      'brand.payment_method': brand?.default_payment_method || '',
      'brand.payment_terms': brand?.payment_terms_days ? `${brand.payment_terms_days} days` : '',
      'brand.bank_name': brand?.bank_name || '',
      'brand.bank_account_name': brand?.bank_account_name || '',
      'brand.bank_sort_code': brand?.bank_sort_code || '',
      'brand.bank_account_number': brand?.bank_account_number || '',
      'brand.late_fee_percent': brand?.late_fee_percent ? `${Number(brand.late_fee_percent)}%` : '2%',
      'brand.cancellation_tier1_days': String(brand?.cancellation_tier1_days ?? 90),
      'brand.cancellation_tier2_days': String(brand?.cancellation_tier2_days ?? 30),
      'brand.cancellation_tier1_percent': brand?.cancellation_tier1_percent
        ? `${Number(brand.cancellation_tier1_percent)}%`
        : '50%',
      'event.type': pkg?.wedding_type?.name || '',
      'today.date': formatDate(new Date()),
      'today.date_short': formatDate(new Date(), 'short'),
    };
  }

  interpolate(text: string, variables: Record<string, string>): string {
    return text.replace(/\{\{(\s*[\w.]+\s*)\}\}/g, (match, key: string) => {
      const trimmed = key.trim();
      return variables[trimmed] ?? match;
    });
  }

  getAvailableVariables(): VariableCategory[] {
    return AVAILABLE_VARIABLES;
  }
}

function formatDate(d: Date | null | undefined, style: 'long' | 'short' = 'long'): string {
  if (!d) return '';
  const opts: Intl.DateTimeFormatOptions =
    style === 'long'
      ? { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
      : { year: 'numeric', month: '2-digit', day: '2-digit' };
  return new Intl.DateTimeFormat('en-GB', opts).format(new Date(d));
}
