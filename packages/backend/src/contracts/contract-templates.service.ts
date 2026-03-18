import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateContractTemplateDto,
  UpdateContractTemplateDto,
} from './dto/contract-template.dto';

const TEMPLATE_INCLUDE = {
  template_clauses: {
    include: {
      clause: {
        include: { category: true },
      },
    },
    orderBy: { order_index: 'asc' as const },
  },
  payment_schedule: {
    include: { rules: { orderBy: { order_index: 'asc' as const } } },
  },
};

@Injectable()
export class ContractTemplatesService {
  constructor(private prisma: PrismaService) {}

  // ── Templates CRUD ──────────────────────────────────────────────────

  async findAll(brandId: number) {
    return this.prisma.contract_templates.findMany({
      where: { brand_id: brandId },
      include: TEMPLATE_INCLUDE,
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(brandId: number, id: number) {
    const tmpl = await this.prisma.contract_templates.findFirst({
      where: { id, brand_id: brandId },
      include: TEMPLATE_INCLUDE,
    });
    if (!tmpl) throw new NotFoundException(`Template ${id} not found`);
    return tmpl;
  }

  async create(brandId: number, dto: CreateContractTemplateDto) {
    return this.prisma.contract_templates.create({
      data: {
        brand_id: brandId,
        name: dto.name,
        description: dto.description ?? null,
        payment_schedule_template_id: dto.payment_schedule_template_id ?? null,
        is_default: dto.is_default ?? false,
        template_clauses: dto.clauses?.length
          ? {
              create: dto.clauses.map((c, i) => ({
                clause_id: c.clause_id,
                order_index: c.order_index ?? i,
                override_body: c.override_body ?? null,
              })),
            }
          : undefined,
      },
      include: TEMPLATE_INCLUDE,
    });
  }

  async update(brandId: number, id: number, dto: UpdateContractTemplateDto) {
    await this.findOne(brandId, id);

    // If clauses array is provided, reconcile (replace-all strategy)
    if (dto.clauses !== undefined) {
      await this.prisma.contract_template_clauses.deleteMany({
        where: { template_id: id },
      });
      if (dto.clauses.length > 0) {
        await this.prisma.contract_template_clauses.createMany({
          data: dto.clauses.map((c, i) => ({
            template_id: id,
            clause_id: c.clause_id,
            order_index: c.order_index ?? i,
            override_body: c.override_body ?? null,
          })),
        });
      }
    }

    return this.prisma.contract_templates.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.payment_schedule_template_id !== undefined && {
          payment_schedule_template_id: dto.payment_schedule_template_id,
        }),
        ...(dto.is_default !== undefined && { is_default: dto.is_default }),
        ...(dto.is_active !== undefined && { is_active: dto.is_active }),
      },
      include: TEMPLATE_INCLUDE,
    });
  }

  async remove(brandId: number, id: number) {
    await this.findOne(brandId, id);
    await this.prisma.contract_templates.delete({ where: { id } });
  }

  // ── Seed default templates ──────────────────────────────────────────

  async seedDefaultTemplates(brandId: number) {
    // Load all existing clause categories for this brand
    const categories = await this.prisma.contract_clause_categories.findMany({
      where: { brand_id: brandId },
      include: { clauses: { where: { is_active: true }, orderBy: { order_index: 'asc' } } },
      orderBy: { order_index: 'asc' },
    });

    if (categories.length === 0) {
      return [];
    }

    // Build a lookup map: category name -> clauses
    const catMap = new Map(
      categories.map((c) => [c.name.toLowerCase(), c.clauses]),
    );

    const getClauseIds = (categoryNames: string[]): number[] => {
      const ids: number[] = [];
      for (const name of categoryNames) {
        const clauses = catMap.get(name.toLowerCase());
        if (clauses) {
          // Include all STANDARD clauses from this category
          for (const cl of clauses) {
            if (cl.clause_type === 'STANDARD') ids.push(cl.id);
          }
        }
      }
      return ids;
    };

    const templateDefs = [
      {
        name: 'Professional Services Agreement',
        description:
          'Standard contract for videography/photography services covering scope of work, payment, liability, IP, and general terms.',
        categories: [
          'Scope of Work',
          'Payment Terms',
          'Cancellation & Rescheduling',
          'Liability & Insurance',
          'Intellectual Property',
          'Confidentiality',
          'Force Majeure',
          'General Provisions',
        ],
      },
      {
        name: 'Talent Release Form',
        description:
          'Release form for talent/subjects granting permission to use their likeness in productions.',
        categories: ['Talent Release Form'],
      },
      {
        name: 'Location Release Agreement',
        description:
          'Agreement with property owners for filming at their locations, covering access, liability, and restoration.',
        categories: ['Location Release Agreement'],
      },
    ];

    const created: unknown[] = [];
    for (const def of templateDefs) {
      const clauseIds = getClauseIds(def.categories);
      if (clauseIds.length === 0) continue;

      // Skip if a template with the same name already exists for this brand
      const existing = await this.prisma.contract_templates.findFirst({
        where: { brand_id: brandId, name: def.name },
      });
      if (existing) continue;

      const tmpl = await this.prisma.contract_templates.create({
        data: {
          brand_id: brandId,
          name: def.name,
          description: def.description,
          is_default: true,
          template_clauses: {
            create: clauseIds.map((cId, i) => ({
              clause_id: cId,
              order_index: i,
            })),
          },
        },
        include: TEMPLATE_INCLUDE,
      });
      created.push(tmpl);
    }

    return this.findAll(brandId);
  }

  // ── Preview / Generate ──────────────────────────────────────────────
  // Resolves template + variables into rendered contract text

  async preview(brandId: number, templateId: number, inquiryId?: number) {
    const tmpl = await this.findOne(brandId, templateId);

    // Load inquiry context if available
    let variables: Record<string, string> = {};
    if (inquiryId) {
      variables = await this.resolveVariables(inquiryId);
    }

    // Build rendered sections
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

  // ── Variable resolution engine ──────────────────────────────────────

  async resolveVariables(inquiryId: number): Promise<Record<string, string>> {
    const inquiry = await this.prisma.inquiries.findUnique({
      where: { id: inquiryId },
      include: {
        contact: true,
        client: true,
        selected_package: { include: { wedding_type: true } },
        estimates: {
          // Prefer primary estimate, but keep latest fallback when primary is not set.
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
            location_slots: true,
          },
          orderBy: { order_index: 'asc' },
        },
        schedule_films: {
          include: { film: true },
        },
        schedule_day_operators: {
          include: { contributor: { include: { contact: true } }, job_role: true },
        },
      },
    });

    if (!inquiry) return {};

    const contact = inquiry.contact;
    const estimate = inquiry.estimates?.find((e) => e.is_primary) || inquiry.estimates?.[0];
    const pkg = inquiry.selected_package;
    const eventDays = inquiry.schedule_event_days || [];
    const films = inquiry.schedule_films || [];
    const operators = inquiry.schedule_day_operators || [];

    // Look up the brand (full record for variable resolution)
    const brand = contact?.brand_id
      ? await this.prisma.brands.findUnique({ where: { id: contact.brand_id } })
      : null;

    // Look up the payment schedule linked to the primary estimate
    const scheduleTemplate = estimate?.schedule_template_id
      ? await this.prisma.payment_schedule_templates.findUnique({
          where: { id: estimate.schedule_template_id },
          include: { rules: { orderBy: { order_index: 'asc' } } },
        })
      : null;

    const weddingDate = inquiry.wedding_date;
    const formatDate = (d: Date | null | undefined, style: 'long' | 'short' = 'long') => {
      if (!d) return '';
      const opts: Intl.DateTimeFormatOptions =
        style === 'long'
          ? { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
          : { year: 'numeric', month: '2-digit', day: '2-digit' };
      return new Intl.DateTimeFormat('en-GB', opts).format(new Date(d));
    };

    const formatCurrency = (amount: number | null | undefined, currency?: string) => {
      if (amount == null) return '';
      return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: currency || 'GBP',
      }).format(Number(amount));
    };

    // Build film list
    const filmNames = films.map((f) => f.film?.name).filter(Boolean);

    // Build crew list
    const crewList = operators
      .map((op) => {
        const name = op.contributor?.contact
          ? `${op.contributor.contact.first_name || ''} ${op.contributor.contact.last_name || ''}`.trim()
          : 'TBC';
        return `${op.position_name}: ${name}`;
      })
      .filter(Boolean);

    // Build event day summary
    const eventDaySummary = eventDays
      .map((day) => {
        const time = [day.start_time, day.end_time].filter(Boolean).join(' – ');
        return `${day.name}${time ? ` (${time})` : ''}`;
      })
      .join(', ');

    // Build location list
    const locations = eventDays
      .flatMap((d) => d.location_slots || [])
      .map((s) => s.name)
      .filter(Boolean);

    // Build subjects list
    const subjects = eventDays
      .flatMap((d) => d.subjects || [])
      .map((s) => s.real_name || s.name)
      .filter(Boolean);

    // Payment milestones
    const milestones = estimate?.payment_milestones || [];
    const milestoneSummary = milestones
      .map(
        (m) =>
          `${m.label}: ${formatCurrency(Number(m.amount), pkg?.currency)} due ${formatDate(m.due_date, 'short')}`,
      )
      .join('\n');

    const vars: Record<string, string> = {
      // Client
      'client.full_name': [contact?.first_name, contact?.last_name]
        .filter(Boolean)
        .join(' '),
      'client.first_name': contact?.first_name || '',
      'client.last_name': contact?.last_name || '',
      'client.email': contact?.email || '',
      'client.phone': contact?.phone_number || '',
      'client.company': contact?.company_name || '',

      // Event
      'event.date': formatDate(weddingDate),
      'event.date_short': formatDate(weddingDate, 'short'),
      'event.venue': inquiry.venue_details || '',
      'event.venue_address': inquiry.venue_address || '',
      'event.days': eventDaySummary,
      'event.day_count': String(eventDays.length),
      'event.locations': locations.join(', '),
      'event.subjects': subjects.join(', '),

      // Package
      'package.name': pkg?.name || '',
      'package.price': formatCurrency(pkg ? Number(pkg.base_price) : null, pkg?.currency),
      'package.currency': pkg?.currency || 'GBP',

      // Films
      'films.list': filmNames.join(', '),
      'films.count': String(filmNames.length),

      // Crew
      'crew.list': crewList.join('\n'),
      'crew.count': String(operators.length),

      // Financial
      'estimate.total': formatCurrency(
        estimate ? Number(estimate.total_amount) : null,
        pkg?.currency,
      ),
      'estimate.deposit': formatCurrency(
        estimate ? Number(estimate.deposit_required) : null,
        pkg?.currency,
      ),
      'estimate.tax_rate': estimate?.tax_rate
        ? `${Number(estimate.tax_rate)}%`
        : '',
      'estimate.payment_schedule': milestoneSummary,
      'estimate.number': estimate?.estimate_number || '',

      // Payment schedule
      'payment.schedule_name': scheduleTemplate?.name || '',
      'payment.schedule_summary': scheduleTemplate
        ? scheduleTemplate.rules
            .map((r) => {
              const totalNum = estimate ? Number(estimate.total_amount) : null;
              const amountStr = r.amount_type === 'PERCENT'
                ? `${Number(r.amount_value)}%${totalNum ? ` (${formatCurrency(totalNum * Number(r.amount_value) / 100, pkg?.currency)})` : ''}`
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
        return bookingRule.amount_type === 'PERCENT' ? `${Number(bookingRule.amount_value)}%` : formatCurrency(Number(bookingRule.amount_value), pkg?.currency);
      })(),
      'payment.final_balance_timing': (() => {
        const beforeRule = [...(scheduleTemplate?.rules || [])].reverse().find((r) => r.trigger_type === 'BEFORE_EVENT');
        if (beforeRule) return `${beforeRule.trigger_days} days before the event`;
        return '';
      })(),
      'payment.instalment_count': String(scheduleTemplate?.rules.length || 0),

      // Brand
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
      'brand.currency': brand?.currency || 'GBP',
      'brand.tax_number': brand?.tax_number || '',
      'brand.tax_rate': brand?.default_tax_rate
        ? `${Number(brand.default_tax_rate)}%`
        : '',
      'brand.payment_method': brand?.default_payment_method || '',
      'brand.payment_terms': brand?.payment_terms_days
        ? `${brand.payment_terms_days} days`
        : '',
      'brand.bank_name': brand?.bank_name || '',
      'brand.bank_account_name': brand?.bank_account_name || '',
      'brand.bank_sort_code': brand?.bank_sort_code || '',
      'brand.bank_account_number': brand?.bank_account_number || '',
      'brand.late_fee_percent': brand?.late_fee_percent
        ? `${Number(brand.late_fee_percent)}%`
        : '2%',
      'brand.cancellation_tier1_days': String(brand?.cancellation_tier1_days ?? 90),
      'brand.cancellation_tier2_days': String(brand?.cancellation_tier2_days ?? 30),
      'brand.cancellation_tier1_percent': brand?.cancellation_tier1_percent
        ? `${Number(brand.cancellation_tier1_percent)}%`
        : '50%',

      // Event extras
      'event.type': pkg?.wedding_type?.name || '',

      // Dates
      'today.date': formatDate(new Date()),
      'today.date_short': formatDate(new Date(), 'short'),
    };

    return vars;
  }

  // ── Helpers ─────────────────────────────────────────────────────────

  private interpolate(
    text: string,
    variables: Record<string, string>,
  ): string {
    return text.replace(/\{\{(\s*[\w.]+\s*)\}\}/g, (match, key: string) => {
      const trimmed = key.trim();
      return variables[trimmed] ?? match; // leave unresolved vars as-is
    });
  }

  getAvailableVariables(): Array<{
    category: string;
    variables: Array<{ key: string; label: string; example: string }>;
  }> {
    return [
      {
        category: 'Client',
        variables: [
          { key: 'client.full_name', label: 'Full Name', example: 'Sarah & James Johnson' },
          { key: 'client.first_name', label: 'First Name', example: 'Sarah' },
          { key: 'client.last_name', label: 'Last Name', example: 'Johnson' },
          { key: 'client.email', label: 'Email', example: 'sarah@example.com' },
          { key: 'client.phone', label: 'Phone', example: '+44 7700 900000' },
          { key: 'client.company', label: 'Company', example: 'Johnson Ltd' },
        ],
      },
      {
        category: 'Event',
        variables: [
          { key: 'event.date', label: 'Event Date (long)', example: 'Saturday, 14 June 2025' },
          { key: 'event.date_short', label: 'Event Date (short)', example: '14/06/2025' },
          { key: 'event.venue', label: 'Venue Name', example: 'Hedsor House' },
          { key: 'event.venue_address', label: 'Venue Address', example: 'Taplow, Maidenhead SL6 0HX' },
          { key: 'event.days', label: 'Event Days Summary', example: 'Wedding Day (10:00 – 23:00)' },
          { key: 'event.day_count', label: 'Number of Days', example: '1' },
          { key: 'event.locations', label: 'All Locations', example: 'Hedsor House, St Mary\'s Church' },
          { key: 'event.subjects', label: 'Key People', example: 'Sarah, James, Emily (MOH)' },
          { key: 'event.type', label: 'Event Type', example: 'Wedding' },
        ],
      },
      {
        category: 'Package',
        variables: [
          { key: 'package.name', label: 'Package Name', example: 'Gold Wedding Package' },
          { key: 'package.price', label: 'Package Price', example: '£3,500.00' },
          { key: 'package.currency', label: 'Currency', example: 'GBP' },
        ],
      },
      {
        category: 'Films',
        variables: [
          { key: 'films.list', label: 'Film Names', example: 'Feature Film, Highlights' },
          { key: 'films.count', label: 'Number of Films', example: '2' },
        ],
      },
      {
        category: 'Crew',
        variables: [
          { key: 'crew.list', label: 'Crew Members', example: 'Lead Videographer: Dan H\nSecond Shooter: Alex T' },
          { key: 'crew.count', label: 'Crew Count', example: '3' },
        ],
      },
      {
        category: 'Financial',
        variables: [
          { key: 'estimate.total', label: 'Total Amount', example: '£3,500.00' },
          { key: 'estimate.deposit', label: 'Deposit Amount', example: '£875.00' },
          { key: 'estimate.tax_rate', label: 'Tax Rate', example: '20%' },
          { key: 'estimate.payment_schedule', label: 'Payment Schedule', example: 'Booking Deposit: £875.00 due 01/03/2025' },
          { key: 'estimate.number', label: 'Estimate Number', example: 'EST-2025-001' },
        ],
      },
      {
        category: 'Payment Schedule',
        variables: [
          { key: 'payment.schedule_name', label: 'Schedule Name', example: '50/50 Split' },
          { key: 'payment.schedule_summary', label: 'Schedule Breakdown', example: 'Booking Deposit: 50% (£1,750) on booking; Final Balance: 50% (£1,750) 14 days before the event' },
          { key: 'payment.deposit_amount', label: 'Deposit Amount', example: '50%' },
          { key: 'payment.final_balance_timing', label: 'Final Balance Due', example: '14 days before the event' },
          { key: 'payment.instalment_count', label: 'Number of Payments', example: '2' },
        ],
      },
      {
        category: 'Brand',
        variables: [
          { key: 'brand.name', label: 'Brand/Company Name', example: 'Moonrise Films' },
          { key: 'brand.email', label: 'Email', example: 'info@moonrisefilms.co.uk' },
          { key: 'brand.phone', label: 'Phone', example: '+44 7700 900000' },
          { key: 'brand.website', label: 'Website', example: 'www.moonrisefilms.co.uk' },
          { key: 'brand.address', label: 'Full Address', example: '10 High Street, London, SW1A 1AA' },
          { key: 'brand.currency', label: 'Currency', example: 'GBP' },
          { key: 'brand.tax_number', label: 'VAT/Tax Number', example: 'GB123456789' },
          { key: 'brand.tax_rate', label: 'Default Tax Rate', example: '20%' },
          { key: 'brand.payment_method', label: 'Payment Method', example: 'Bank Transfer' },
          { key: 'brand.payment_terms', label: 'Payment Terms', example: '30 days' },
          { key: 'brand.bank_name', label: 'Bank Name', example: 'Barclays' },
          { key: 'brand.bank_account_name', label: 'Account Name', example: 'Moonrise Films Ltd' },
          { key: 'brand.bank_sort_code', label: 'Sort Code', example: '20-30-40' },
          { key: 'brand.bank_account_number', label: 'Account Number', example: '12345678' },
          { key: 'brand.late_fee_percent', label: 'Late Fee %', example: '2%' },
          { key: 'brand.cancellation_tier1_days', label: 'Cancellation Tier 1 Days', example: '90' },
          { key: 'brand.cancellation_tier2_days', label: 'Cancellation Tier 2 Days', example: '30' },
          { key: 'brand.cancellation_tier1_percent', label: 'Cancellation Fee %', example: '50%' },
        ],
      },
      {
        category: 'Dates',
        variables: [
          { key: 'today.date', label: "Today's Date (long)", example: 'Monday, 3 February 2025' },
          { key: 'today.date_short', label: "Today's Date (short)", example: '03/02/2025' },
        ],
      },
    ];
  }
}
