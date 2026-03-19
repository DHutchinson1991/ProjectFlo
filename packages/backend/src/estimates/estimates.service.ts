import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEstimateDto } from './dto/create-estimate.dto';
import { UpdateEstimateDto } from './dto/update-estimate.dto';
import { Estimate } from './entities/estimate.entity';
import { Decimal } from '@prisma/client/runtime/library';
import { InquiryTasksService } from '../inquiry-tasks/inquiry-tasks.service';
import { ProjectPackageSnapshotService } from '../projects/project-package-snapshot.service';
import { TaskLibraryService } from '../business/task-library/task-library.service';

type AutoEstimateItem = {
  category?: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
};

@Injectable()
export class EstimatesService {
  private readonly logger = new Logger(EstimatesService.name);
  constructor(
    private prisma: PrismaService,
    private inquiryTasksService: InquiryTasksService,
    private snapshotService: ProjectPackageSnapshotService,
    private taskLibraryService: TaskLibraryService,
  ) { }

  /**
   * Auto-promote the newest estimate to primary when no primary exists for an inquiry.
   */
  private async ensurePrimaryEstimate(inquiryId: number, tx?: any): Promise<void> {
    const db = tx || this.prisma;
    const hasPrimary = await db.estimates.findFirst({
      where: { inquiry_id: inquiryId, is_primary: true },
      select: { id: true },
    });
    if (hasPrimary) return;

    const newest = await db.estimates.findFirst({
      where: { inquiry_id: inquiryId },
      orderBy: { updated_at: 'desc' },
      select: { id: true },
    });
    if (newest) {
      await db.estimates.update({
        where: { id: newest.id },
        data: { is_primary: true },
      });
    }
  }

  /**
   * Generate a random memorable estimate number: EST-L1L2 (letter-digit-letter-digit).
   * Collision-checked against existing estimate numbers.
   */
  private async generateEstimateNumber(tx?: any): Promise<string> {
    const db = tx || this.prisma;
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // no I or O (ambiguous)
    const digits = '23456789'; // no 0 or 1 (ambiguous)

    for (let attempt = 0; attempt < 50; attempt++) {
      const code =
        letters[Math.floor(Math.random() * letters.length)] +
        digits[Math.floor(Math.random() * digits.length)] +
        letters[Math.floor(Math.random() * letters.length)] +
        digits[Math.floor(Math.random() * digits.length)];
      const candidate = `EST-${code}`;
      const exists = await db.estimates.findFirst({
        where: { estimate_number: candidate },
        select: { id: true },
      });
      if (!exists) return candidate;
    }
    // Fallback: timestamp-based suffix
    return `EST-${Date.now().toString(36).slice(-6).toUpperCase()}`;
  }

  async create(inquiryId: number, createEstimateDto: CreateEstimateDto): Promise<Estimate> {
    // Calculate total amount from items using Decimal for precision
    const totalAmount = createEstimateDto.items
      .reduce((sum, item) => sum.add(new Decimal(item.quantity).mul(new Decimal(item.unit_price))), new Decimal(0))
      .toNumber();

    return await this.prisma.$transaction(async (tx) => {
      // Resolve brand currency from inquiry → contact → brand
      const inquiry = await tx.inquiries.findUnique({
        where: { id: inquiryId },
        select: { contact: { select: { brand: { select: { currency: true } } } } },
      });
      const currency = inquiry?.contact?.brand?.currency || 'USD';

      // Handle Primary Exclusivity
      if (createEstimateDto.is_primary) {
        await tx.estimates.updateMany({
          where: { inquiry_id: inquiryId, is_primary: true },
          data: { is_primary: false }
        });
      }

      // Create the estimate — accept client-provided or auto-generate random code
      const estimateNumber = createEstimateDto.estimate_number
        ? createEstimateDto.estimate_number
        : await this.generateEstimateNumber(tx);

      const estimate = await tx.estimates.create({
        data: {
          inquiry_id: inquiryId,
          project_id: createEstimateDto.project_id || null,
          estimate_number: estimateNumber,
          title: createEstimateDto.title,
          is_primary: createEstimateDto.is_primary || false,
          issue_date: new Date(createEstimateDto.issue_date),
          expiry_date: new Date(createEstimateDto.expiry_date),
          total_amount: new Decimal(totalAmount),
          status: createEstimateDto.status || 'Draft',
          tax_rate: createEstimateDto.tax_rate ? new Decimal(createEstimateDto.tax_rate) : new Decimal(0),
          deposit_required: createEstimateDto.deposit_required ? new Decimal(createEstimateDto.deposit_required) : null,
          notes: createEstimateDto.notes,
          terms: createEstimateDto.terms,
          payment_method: createEstimateDto.payment_method,
          installments: createEstimateDto.installments,
          currency,
        },
      });

      // Create estimate items
      if (createEstimateDto.items && createEstimateDto.items.length > 0) {
        await tx.estimate_items.createMany({
          data: createEstimateDto.items.map(item => ({
            estimate_id: estimate.id,
            category: item.category,
            description: item.description,
            service_date: item.service_date ? new Date(item.service_date) : null,
            start_time: item.start_time,
            end_time: item.end_time,
            quantity: new Decimal(item.quantity),
            unit: item.unit,
            unit_price: new Decimal(item.unit_price),
          })),
        });
      }

      // Auto-promote if no primary exists
      await this.ensurePrimaryEstimate(inquiryId, tx);

      // Return estimate with converted total_amount for Estimate interface
      return {
        ...estimate,
        total_amount: totalAmount,
      } as unknown as Estimate;
    });
  }

  async findAll(inquiryId: number) {
    const [estimates, latestDataChange] = await Promise.all([
      this.prisma.estimates.findMany({
        where: { inquiry_id: inquiryId },
        include: {
          items: true,
        },
        orderBy: { created_at: 'desc' },
      }),
      this.getLatestDataChange(inquiryId),
    ]);

    // Convert Decimal to number for the interface
    return estimates.map(estimate => {
      const totalAmount = Number(estimate.total_amount);
      const taxRate = estimate.tax_rate ? Number(estimate.tax_rate) : 0;
      // Mark estimate as stale if inquiry or its schedule clone was updated after the estimate
      const isStale = latestDataChange > new Date(estimate.updated_at);
      return {
        ...estimate,
        total_amount: totalAmount,
        total_with_tax: Math.round((totalAmount + totalAmount * (taxRate / 100)) * 100) / 100,
        version: estimate.version ?? 1,
        tax_rate: taxRate || undefined,
        deposit_required: estimate.deposit_required ? Number(estimate.deposit_required) : undefined,
        is_stale: isStale,
        items: estimate.items.map(item => ({
          ...item,
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
        })),
      };
    });
  }

  async findOne(inquiryId: number, id: number) {
    const [estimate, latestDataChange] = await Promise.all([
      this.prisma.estimates.findFirst({
        where: {
          id: id,
          inquiry_id: inquiryId,
        },
        include: {
          items: true,
        },
      }),
      this.getLatestDataChange(inquiryId),
    ]);

    if (!estimate) {
      throw new NotFoundException(`Estimate with ID ${id} not found for inquiry ${inquiryId}`);
    }

    // Mark estimate as stale if inquiry or its schedule clone was updated after the estimate
    const isStale = latestDataChange > new Date(estimate.updated_at);

    // Convert Decimal to number for the interface
    return {
      ...estimate,
      total_amount: Number(estimate.total_amount),
      total_with_tax: Math.round((Number(estimate.total_amount) + Number(estimate.total_amount) * (Number(estimate.tax_rate || 0) / 100)) * 100) / 100,
      version: estimate.version ?? 1,
      is_stale: isStale,
      items: estimate.items.map(item => ({
        ...item,
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
      })),
    };
  }

  async update(inquiryId: number, id: number, updateEstimateDto: UpdateEstimateDto) {
    // First verify the estimate exists and belongs to the inquiry
    const existing = await this.findOne(inquiryId, id);
    const becomingSent = updateEstimateDto.status === 'Sent' && existing.status !== 'Sent';

    const result = await this.prisma.$transaction(async (tx) => {
      let totalAmount: number | undefined;

      // If items are being updated, calculate new total
      if (updateEstimateDto.items) {
        totalAmount = updateEstimateDto.items
          .reduce((sum, item) => sum.add(new Decimal(item.quantity || 0).mul(new Decimal(item.unit_price || 0))), new Decimal(0))
          .toNumber();

        // Delete existing items
        await tx.estimate_items.deleteMany({
          where: { estimate_id: id },
        });

        // Create new items
        await Promise.all(
          updateEstimateDto.items.map(item =>
            tx.estimate_items.create({
              data: {
                estimate_id: id,
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
        estimate_number?: string;
        issue_date?: Date;
        expiry_date?: Date;
        status?: string;
        tax_rate?: Decimal;
        deposit_required?: Decimal | null;
        notes?: string;
        terms?: string;
        payment_method?: string;
        installments?: number;
        is_primary?: boolean;
        title?: string;
        project_id?: number | null;
        total_amount?: Decimal;
        version?: number;
      } = {};

      if (updateEstimateDto.estimate_number) updateData.estimate_number = updateEstimateDto.estimate_number;
      if (updateEstimateDto.title !== undefined) updateData.title = updateEstimateDto.title;
      if (updateEstimateDto.issue_date) updateData.issue_date = new Date(updateEstimateDto.issue_date);
      if (updateEstimateDto.expiry_date) updateData.expiry_date = new Date(updateEstimateDto.expiry_date);
      if (updateEstimateDto.status) updateData.status = updateEstimateDto.status;
      if (updateEstimateDto.tax_rate !== undefined) updateData.tax_rate = new Decimal(updateEstimateDto.tax_rate);
      if (updateEstimateDto.deposit_required !== undefined) updateData.deposit_required = updateEstimateDto.deposit_required ? new Decimal(updateEstimateDto.deposit_required) : null;
      if (updateEstimateDto.notes !== undefined) updateData.notes = updateEstimateDto.notes;
      if (updateEstimateDto.terms !== undefined) updateData.terms = updateEstimateDto.terms;
      if (updateEstimateDto.payment_method !== undefined) updateData.payment_method = updateEstimateDto.payment_method;
      if (updateEstimateDto.installments !== undefined) updateData.installments = updateEstimateDto.installments;
      if (updateEstimateDto.is_primary !== undefined) {
        updateData.is_primary = updateEstimateDto.is_primary;
        if (updateEstimateDto.is_primary) {
          await tx.estimates.updateMany({
            where: { inquiry_id: inquiryId, id: { not: id }, is_primary: true },
            data: { is_primary: false }
          });
        }
      }
      if (updateEstimateDto.project_id !== undefined) updateData.project_id = updateEstimateDto.project_id;
      if (totalAmount !== undefined) updateData.total_amount = new Decimal(totalAmount);

      // Auto-increment version on meaningful updates
      const hasContentChange = updateEstimateDto.items || totalAmount !== undefined || updateEstimateDto.title !== undefined;
      if (hasContentChange) {
        updateData.version = (existing.version ?? 1) + 1;
      }

      // Handle items update
      if (updateEstimateDto.items) {
        // Simple strategy: Delete all and recreate based on the complexity of syncing
        await tx.estimate_items.deleteMany({
          where: { estimate_id: id },
        });

        await tx.estimate_items.createMany({
          data: updateEstimateDto.items.map(item => ({
            estimate_id: id,
            category: item.category,
            description: item.description || '',
            service_date: item.service_date ? new Date(item.service_date) : null,
            start_time: item.start_time,
            end_time: item.end_time,
            quantity: new Decimal(item.quantity || 1),
            unit: item.unit,
            unit_price: new Decimal(item.unit_price || 0),
          })),
        });
      }

      const updatedEstimate = await tx.estimates.update({
        where: { id },
        data: updateData,
        include: {
          items: true,
        },
      });

      // Auto-promote if no primary exists
      await this.ensurePrimaryEstimate(inquiryId, tx);

      // Convert Decimal to number for the interface
      return {
        ...updatedEstimate,
        total_amount: Number(updatedEstimate.total_amount),
        total_with_tax: Math.round((Number(updatedEstimate.total_amount) + Number(updatedEstimate.total_amount) * (Number(updatedEstimate.tax_rate || 0) / 100)) * 100) / 100,
        version: updatedEstimate.version ?? 1,
        tax_rate: updatedEstimate.tax_rate ? Number(updatedEstimate.tax_rate) : undefined,
        deposit_required: updatedEstimate.deposit_required ? Number(updatedEstimate.deposit_required) : undefined,
        items: updatedEstimate.items.map(item => ({
          ...item,
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
        })),
      };
    });

    // Auto-complete 'Review Estimate' pipeline task when estimate becomes Sent
    if (becomingSent) {
      try {
        await this.inquiryTasksService.autoCompleteByName(inquiryId, 'Review Estimate', undefined, true);
      } catch (err) {
        this.logger.error(`Failed to auto-complete 'Review Estimate' for inquiry ${inquiryId}: ${err}`);
      }
    }

    return result;
  }

  async remove(inquiryId: number, id: number) {
    // First verify the estimate exists and belongs to the inquiry
    await this.findOne(inquiryId, id);

    const deleted = await this.prisma.estimates.delete({
      where: { id },
    });

    // If the deleted estimate was primary, promote the newest remaining one
    await this.ensurePrimaryEstimate(inquiryId);

    return deleted;
  }

  async send(inquiryId: number, id: number) {
    // First verify the estimate exists and belongs to the inquiry
    const estimate = await this.findOne(inquiryId, id);

    // Snapshot the Draft before marking as Sent
    await this.snapshotEstimate(id, estimate.version ?? 1, 'Before sending');

    const updatedEstimate = await this.prisma.estimates.update({
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

    // Auto-complete the 'Review Estimate' pipeline task when an estimate is sent
    try {
      await this.inquiryTasksService.autoCompleteByName(inquiryId, 'Review Estimate', undefined, true);
    } catch (err) {
      this.logger.error(`Failed to auto-complete 'Review Estimate' for inquiry ${inquiryId}: ${err}`);
    }

    // Convert Decimal to number for the interface
    return {
      ...updatedEstimate,
      total_amount: Number(updatedEstimate.total_amount),
      total_with_tax: Math.round((Number(updatedEstimate.total_amount) + Number(updatedEstimate.total_amount) * (Number(updatedEstimate.tax_rate || 0) / 100)) * 100) / 100,
      items: updatedEstimate.items.map(item => ({
        ...item,
        unit_price: Number(item.unit_price),
      })),
    };
  }

  /**
   * Rebuild the line items for a Draft estimate from the live schedule snapshot.
   * Replaces all existing items with freshly-computed costs based on current
   * crew assignments and equipment. Only Draft estimates may be refreshed.
   */
  async refreshItems(inquiryId: number, id: number) {
    const estimate = await this.findOne(inquiryId, id);
    if (estimate.status !== 'Draft') {
      throw new BadRequestException('Only Draft estimates can be refreshed');
    }

    // Snapshot current state before overwriting
    await this.snapshotEstimate(id, estimate.version ?? 1, 'Before cost refresh');

    const inquiry = await this.prisma.inquiries.findUnique({
      where: { id: inquiryId },
      select: {
        selected_package_id: true,
        contact: { select: { brand: { select: { id: true } } } },
      },
    });
    if (!inquiry?.selected_package_id || !inquiry.contact?.brand?.id) {
      throw new BadRequestException('Inquiry has no package or brand associated');
    }

    const newItems = await this.buildAutoEstimateItems(
      inquiryId,
      inquiry.selected_package_id,
      inquiry.contact.brand.id,
    );

    const total = newItems.reduce(
      (sum, item) => sum + Math.round(item.quantity * item.unit_price * 100) / 100,
      0,
    );

    await this.prisma.$transaction([
      this.prisma.estimate_items.deleteMany({ where: { estimate_id: id } }),
      ...(newItems.length > 0
        ? [this.prisma.estimate_items.createMany({
            data: newItems.map(item => ({
              estimate_id: id,
              description: item.description,
              category: item.category ?? null,
              quantity: item.quantity,
              unit: item.unit,
              unit_price: item.unit_price,
            })),
          })]
        : []),
    ]);

    const updated = await this.prisma.estimates.update({
      where: { id },
      data: { total_amount: total, version: { increment: 1 } },
      include: { items: true },
    });

    return {
      ...updated,
      total_amount: Number(updated.total_amount),
      items: updated.items.map(item => ({
        ...item,
        unit_price: Number(item.unit_price),
        quantity: Number(item.quantity),
      })),
    };
  }

  /** Retrieve the version history snapshots for an estimate. */
  async getSnapshots(inquiryId: number, id: number) {
    // Verify ownership
    await this.findOne(inquiryId, id);

    const snapshots = await this.prisma.estimate_snapshots.findMany({
      where: { estimate_id: id },
      orderBy: { snapshotted_at: 'desc' },
    });

    return snapshots.map(s => ({
      ...s,
      total_amount: Number(s.total_amount),
    }));
  }

  /**
   * Save a point-in-time copy of the estimate's current line items.
   * Called before any destructive update (refresh, send).
   */
  private async snapshotEstimate(estimateId: number, versionNumber: number, label: string) {
    const current = await this.prisma.estimates.findUnique({
      where: { id: estimateId },
      select: { total_amount: true, items: true },
    });
    if (!current) return;

    await this.prisma.estimate_snapshots.create({
      data: {
        estimate_id: estimateId,
        version_number: versionNumber,
        total_amount: current.total_amount,
        items_snapshot: current.items.map(item => ({
          description: item.description,
          category: item.category,
          quantity: Number(item.quantity),
          unit: item.unit,
          unit_price: Number(item.unit_price),
        })),
        label,
      },
    });
  }

  /**
   * Return the latest timestamp from data sources that feed into estimate costs:
   * the inquiry record itself, crew operators, and films.
   */
  private async getLatestDataChange(inquiryId: number): Promise<Date> {
    const [inquiry, latestOperator, latestFilm] = await Promise.all([
      this.prisma.inquiries.findUnique({
        where: { id: inquiryId },
        select: { updated_at: true },
      }),
      this.prisma.projectDayOperator.findFirst({
        where: { inquiry_id: inquiryId },
        orderBy: { updated_at: 'desc' },
        select: { updated_at: true },
      }),
      this.prisma.projectFilm.findFirst({
        where: { inquiry_id: inquiryId },
        orderBy: { updated_at: 'desc' },
        select: { updated_at: true },
      }),
    ]);

    const dates = [
      inquiry?.updated_at,
      latestOperator?.updated_at,
      latestFilm?.updated_at,
    ].filter(Boolean) as Date[];

    return dates.length > 0
      ? new Date(Math.max(...dates.map(d => d.getTime())))
      : new Date(0);
  }

  private async buildAutoEstimateItems(
    inquiryId: number,
    packageId: number,
    brandId: number,
  ): Promise<AutoEstimateItem[]> {
    const [scheduleFilms, operators, taskPreview] = await Promise.all([
      this.snapshotService.getFilms({ inquiryId }).catch(() => [] as any[]),
      this.snapshotService.getOperators({ inquiryId }).catch(() => [] as any[]),
      this.taskLibraryService.previewAutoGenerationForSystem(packageId, brandId, inquiryId).catch(() => null),
    ]);

    const items: AutoEstimateItem[] = [];
    const filmNames = scheduleFilms.map((pf: any) => pf.film?.name || `Film #${pf.film_id}`);
    const roundMoney = (value: number) => Math.round(value * 100) / 100;

    const resolveHourlyRate = (op: any): number => {
      const contributorRoles = op.contributor?.contributor_job_roles || [];
      if (op.job_role_id) {
        const match = contributorRoles.find(
          (role: any) => role.job_role_id === op.job_role_id && role.payment_bracket?.hourly_rate,
        );
        if (match?.payment_bracket?.hourly_rate) return Number(match.payment_bracket.hourly_rate);
      }
      const primary = contributorRoles.find((role: any) => role.is_primary && role.payment_bracket?.hourly_rate);
      if (primary?.payment_bracket?.hourly_rate) return Number(primary.payment_bracket.hourly_rate);
      const anyRole = contributorRoles.find((role: any) => role.payment_bracket?.hourly_rate);
      if (anyRole?.payment_bracket?.hourly_rate) return Number(anyRole.payment_bracket.hourly_rate);
      if (op.contributor?.default_hourly_rate) return Number(op.contributor.default_hourly_rate);
      return 0;
    };

    const resolveDayRate = (op: any): number => {
      const contributorRoles = op.contributor?.contributor_job_roles || [];
      if (op.job_role_id) {
        const match = contributorRoles.find(
          (role: any) => role.job_role_id === op.job_role_id && role.payment_bracket?.day_rate,
        );
        if (match?.payment_bracket?.day_rate) return Number(match.payment_bracket.day_rate);
      }
      const primary = contributorRoles.find((role: any) => role.is_primary && role.payment_bracket?.day_rate);
      if (primary?.payment_bracket?.day_rate) return Number(primary.payment_bracket.day_rate);
      return 0;
    };

    const usesDayRate = (op: any): boolean => {
      const contributorRoles = op.contributor?.contributor_job_roles || [];
      if (op.job_role_id) {
        const match = contributorRoles.find((role: any) => role.job_role_id === op.job_role_id);
        if (match?.payment_bracket) {
          return Number(match.payment_bracket.day_rate || 0) > 0
            && Number(match.payment_bracket.hourly_rate || 0) === 0;
        }
      }
      return false;
    };

    const planningCategories = new Set(['creative', 'production']);
    const postProductionCategories = new Set(['post-production']);
    const taskExcludedPhases = new Set(['Lead', 'Inquiry', 'Booking']);

    type CrewAccum = {
      name: string;
      role: string;
      hours: number;
      days: number;
      hourlyRate: number;
      dayRate: number;
      useDayRate: boolean;
    };

    const planningCrew = new Map<string, CrewAccum>();
    const coverageCrew = new Map<string, CrewAccum>();
    const postProdCrew = new Map<string, CrewAccum>();

    for (const op of operators) {
      if (!op.contributor_id && !op.job_role_id) continue;
      const key = `${op.contributor_id ?? 0}|${op.job_role_id ?? 0}`;
      const name = op.contributor
        ? `${op.contributor.contact?.first_name || ''} ${op.contributor.contact?.last_name || ''}`.trim()
        : (op.job_role?.display_name || op.job_role?.name || 'TBC');
      const role = op.job_role?.display_name || op.job_role?.name || '';
      const hours = Number(op.hours || 0);
      const category = op.job_role?.category?.toLowerCase() || '';
      const bucket = planningCategories.has(category)
        ? planningCrew
        : postProductionCategories.has(category)
          ? postProdCrew
          : coverageCrew;
      const existing = bucket.get(key);

      if (existing) {
        existing.hours += hours;
        existing.days += 1;
        continue;
      }

      bucket.set(key, {
        name,
        role,
        hours,
        days: 1,
        hourlyRate: resolveHourlyRate(op),
        dayRate: resolveDayRate(op),
        useDayRate: usesDayRate(op),
      });
    }

    if (taskPreview?.tasks) {
      const allCrewMap = new Map<string, {
        name: string;
        role: string;
        category: string;
        hours: number;
        cost: number;
        rate: number;
        ppFilmCosts: Map<string, { hours: number; cost: number }>;
      }>();

      for (const task of taskPreview.tasks) {
        if (taskExcludedPhases.has(task.phase) || !task.assigned_to_name) continue;

        const cost = Number(task.estimated_cost ?? 0);
        const key = `${task.assigned_to_name}|${task.role_name ?? ''}`;
        const existing = allCrewMap.get(key);

        if (existing) {
          existing.hours += Number(task.total_hours || 0);
          existing.cost += cost;
          if (task.phase === 'Post_Production') {
            const filmKey = filmNames.find((filmName) => task.name?.includes(filmName)) || 'General';
            const filmCost = existing.ppFilmCosts.get(filmKey);
            if (filmCost) {
              filmCost.hours += Number(task.total_hours || 0);
              filmCost.cost += cost;
            } else {
              existing.ppFilmCosts.set(filmKey, { hours: Number(task.total_hours || 0), cost });
            }
          }
          continue;
        }

        const matchingOperator = operators.find((op: any) => {
          const name = op.contributor
            ? `${op.contributor.contact?.first_name || ''} ${op.contributor.contact?.last_name || ''}`.trim()
            : '';
          return name === task.assigned_to_name
            && (op.job_role?.display_name === task.role_name || op.job_role?.name === task.role_name);
        });
        const category = matchingOperator?.job_role?.category?.toLowerCase() || '';
        const lineCategory = planningCategories.has(category)
          ? 'Planning'
          : postProductionCategories.has(category)
            ? 'Post-Production'
            : 'Coverage';
        const ppFilmCosts = new Map<string, { hours: number; cost: number }>();
        if (task.phase === 'Post_Production') {
          const filmKey = filmNames.find((filmName) => task.name?.includes(filmName)) || 'General';
          ppFilmCosts.set(filmKey, { hours: Number(task.total_hours || 0), cost });
        }

        allCrewMap.set(key, {
          name: task.assigned_to_name,
          role: task.role_name ?? '',
          category: lineCategory,
          hours: Number(task.total_hours || 0),
          cost,
          rate: Number(task.hourly_rate ?? 0),
          ppFilmCosts,
        });
      }

      for (const entry of allCrewMap.values()) {
        if (entry.category !== 'Planning' && entry.category !== 'Coverage') continue;
        const derivedRate = entry.rate > 0
          ? entry.rate
          : entry.hours > 0
            ? entry.cost / entry.hours
            : entry.cost;
        items.push({
          description: entry.role ? `${entry.name} - ${entry.role}` : entry.name,
          category: entry.category,
          quantity: roundMoney(entry.hours),
          unit: 'Hours',
          unit_price: roundMoney(derivedRate),
        });
      }

      const postProductionEntries = Array.from(allCrewMap.values()).filter(e => e.category === 'Post-Production');
      if (postProductionEntries.length > 0) {
        const postProductionByFilm = new Map<string, Map<string, { name: string; role: string; hours: number; cost: number; rate: number }>>();

        for (const entry of postProductionEntries) {
          const ppFilmHours = Array.from(entry.ppFilmCosts.values()).reduce((s, v) => s + v.hours, 0);
          const ppFilmCost = Array.from(entry.ppFilmCosts.values()).reduce((s, v) => s + v.cost, 0);
          const deliveryHours = entry.hours - ppFilmHours;
          const deliveryCost = entry.cost - ppFilmCost;

          for (const [filmKey, filmCost] of entry.ppFilmCosts) {
            if (!postProductionByFilm.has(filmKey)) postProductionByFilm.set(filmKey, new Map());
            const crewKey = `${entry.name}|${entry.role}`;
            const existing = postProductionByFilm.get(filmKey)?.get(crewKey);
            if (existing) {
              existing.hours += filmCost.hours;
              existing.cost += filmCost.cost;
            } else {
              postProductionByFilm.get(filmKey)?.set(crewKey, {
                name: entry.name, role: entry.role,
                hours: filmCost.hours, cost: filmCost.cost, rate: entry.rate,
              });
            }
          }

          if (deliveryCost > 0.001) {
            if (!postProductionByFilm.has('General')) postProductionByFilm.set('General', new Map());
            const crewKey = `${entry.name}|${entry.role}`;
            const existing = postProductionByFilm.get('General')?.get(crewKey);
            if (existing) {
              existing.hours += deliveryHours;
              existing.cost += deliveryCost;
            } else {
              postProductionByFilm.get('General')?.set(crewKey, {
                name: entry.name, role: entry.role,
                hours: deliveryHours, cost: deliveryCost, rate: entry.rate,
              });
            }
          }
        }

        for (const [filmKey, filmMap] of postProductionByFilm) {
          const category = filmKey === 'General' ? 'Post-Production' : `Post-Production:${filmKey}`;
          for (const entry of filmMap.values()) {
            const derivedRate = entry.rate > 0
              ? entry.rate
              : entry.hours > 0
                ? entry.cost / entry.hours
                : entry.cost;
            items.push({
              description: entry.role ? `${entry.name} - ${entry.role}` : entry.name,
              category,
              quantity: roundMoney(entry.hours),
              unit: 'Hours',
              unit_price: roundMoney(derivedRate),
            });
          }
        }
      }
    } else {
      const pushFallback = (crewMap: Map<string, CrewAccum>, category: string) => {
        for (const crew of crewMap.values()) {
          items.push({
            description: crew.role ? `${crew.name} - ${crew.role}` : crew.name,
            category,
            quantity: crew.useDayRate && crew.dayRate > 0 ? crew.days : roundMoney(crew.hours),
            unit: crew.useDayRate && crew.dayRate > 0 ? 'Days' : 'Hours',
            unit_price: roundMoney(crew.useDayRate && crew.dayRate > 0 ? crew.dayRate : crew.hourlyRate),
          });
        }
      };
      pushFallback(planningCrew, 'Planning');
      pushFallback(coverageCrew, 'Coverage');
      pushFallback(postProdCrew, 'Post-Production');
    }

    const equipmentSeen = new Set<number>();
    for (const op of operators) {
      for (const equipmentRelation of op.equipment || []) {
        const equipmentId = equipmentRelation.equipment_id ?? equipmentRelation.equipment?.id;
        if (!equipmentId || equipmentSeen.has(equipmentId)) continue;
        equipmentSeen.add(equipmentId);
        const price = Number(equipmentRelation.equipment?.rental_price_per_day || 0);
        const name = [equipmentRelation.equipment?.item_name, equipmentRelation.equipment?.model]
          .filter(Boolean)
          .join(' ');
        items.push({
          description: name || `Equipment #${equipmentId}`,
          category: 'Equipment',
          quantity: 1,
          unit: 'Day',
          unit_price: roundMoney(price),
        });
      }
    }

    return items
      .filter(item => item.description.trim().length > 0)
      .map(item => ({
        ...item,
        quantity: roundMoney(item.quantity),
        unit_price: roundMoney(item.unit_price),
      }));
  }
}
