import { Injectable, NotFoundException } from '@nestjs/common';
import { DEFAULT_CURRENCY } from '@projectflo/shared';
import { PrismaService } from '../../platform/prisma/prisma.service';
import { CreateEstimateDto } from './dto/create-estimate.dto';
import { UpdateEstimateDto } from './dto/update-estimate.dto';
import { Estimate } from './entities/estimate.entity';
import { Decimal } from '@prisma/client/runtime/library';
import { computeItemsTotalDecimal } from '../shared/pricing.utils';
import {
  mapEstimateResponse,
  buildEstimateUpdateData,
  generateEstimateNumber,
  getEstimateLatestDataChange,
} from './estimate.mapper';

@Injectable()
export class EstimatesService {
  constructor(private prisma: PrismaService) {}

  async create(
    inquiryId: number,
    createEstimateDto: CreateEstimateDto,
  ): Promise<Estimate> {
    const totalAmount = computeItemsTotalDecimal(createEstimateDto.items).toNumber();

    return await this.prisma.$transaction(async (tx) => {
      const inquiry = await tx.inquiries.findUnique({
        where: { id: inquiryId },
        select: { contact: { select: { brand: { select: { currency: true } } } } },
      });
      const currency = inquiry?.contact?.brand?.currency ?? DEFAULT_CURRENCY;

      if (createEstimateDto.is_primary) {
        await tx.estimates.updateMany({
          where: { inquiry_id: inquiryId, is_primary: true },
          data: { is_primary: false },
        });
      }

      const estimateNumber = createEstimateDto.estimate_number
        ? createEstimateDto.estimate_number
        : await generateEstimateNumber(tx);

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
          tax_rate: createEstimateDto.tax_rate
            ? new Decimal(createEstimateDto.tax_rate)
            : new Decimal(0),
          deposit_required: createEstimateDto.deposit_required
            ? new Decimal(createEstimateDto.deposit_required)
            : null,
          notes: createEstimateDto.notes,
          terms: createEstimateDto.terms,
          payment_method: createEstimateDto.payment_method,
          installments: createEstimateDto.installments,
          currency,
        },
      });

      if (createEstimateDto.items?.length) {
        await tx.estimate_items.createMany({
          data: createEstimateDto.items.map((item) => ({
            estimate_id: estimate.id,
            category: item.category,
            description: item.description,
            service_date: item.service_date
              ? new Date(item.service_date)
              : null,
            start_time: item.start_time,
            end_time: item.end_time,
            quantity: new Decimal(item.quantity),
            unit: item.unit,
            unit_price: new Decimal(item.unit_price),
          })),
        });
      }

      await this.ensurePrimaryEstimate(inquiryId, tx);

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
        include: { items: true },
        orderBy: { created_at: 'desc' },
      }),
      getEstimateLatestDataChange(this.prisma, inquiryId),
    ]);
    return estimates.map((e) => mapEstimateResponse(e, { latestDataChange }));
  }

  async findOne(inquiryId: number, id: number) {
    const [estimate, latestDataChange] = await Promise.all([
      this.prisma.estimates.findFirst({
        where: { id, inquiry_id: inquiryId },
        include: { items: true },
      }),
      getEstimateLatestDataChange(this.prisma, inquiryId),
    ]);

    if (!estimate) {
      throw new NotFoundException(
        `Estimate with ID ${id} not found for inquiry ${inquiryId}`,
      );
    }

    return mapEstimateResponse(estimate, { latestDataChange });
  }

  async update(
    inquiryId: number,
    id: number,
    updateEstimateDto: UpdateEstimateDto,
  ) {
    const existing = await this.findOne(inquiryId, id);

    const result = await this.prisma.$transaction(async (tx) => {
      let totalAmount: number | undefined;

      if (updateEstimateDto.items) {
        const normalizedItems = updateEstimateDto.items.map((item) => ({
          ...item,
          quantity: item.quantity ?? 1,
          unit_price: item.unit_price ?? 0,
        }));

        totalAmount = computeItemsTotalDecimal(normalizedItems).toNumber();

        await tx.estimate_items.deleteMany({ where: { estimate_id: id } });
        await tx.estimate_items.createMany({
          data: normalizedItems.map((item) => ({
            estimate_id: id,
            category: item.category,
            description: item.description || '',
            service_date: item.service_date
              ? new Date(item.service_date)
              : null,
            start_time: item.start_time,
            end_time: item.end_time,
            quantity: new Decimal(item.quantity),
            unit: item.unit,
            unit_price: new Decimal(item.unit_price),
          })),
        });
      }

      const updateData = buildEstimateUpdateData(
        updateEstimateDto,
        existing.version ?? 1,
        totalAmount,
      );

      if (updateEstimateDto.is_primary) {
        await tx.estimates.updateMany({
          where: { inquiry_id: inquiryId, id: { not: id }, is_primary: true },
          data: { is_primary: false },
        });
      }

      const updatedEstimate = await tx.estimates.update({
        where: { id },
        data: updateData,
        include: { items: true },
      });

      await this.ensurePrimaryEstimate(inquiryId, tx);

      return mapEstimateResponse(updatedEstimate);
    });

    return result;
  }

  async remove(inquiryId: number, id: number) {
    await this.findOne(inquiryId, id);
    const deleted = await this.prisma.estimates.delete({ where: { id } });
    await this.ensurePrimaryEstimate(inquiryId);
    return deleted;
  }

  private async ensurePrimaryEstimate(
    inquiryId: number,
    tx?: Pick<PrismaService, 'estimates'>,
  ): Promise<void> {
    const db = (tx ?? this.prisma).estimates;
    const hasPrimary = await db.findFirst({
      where: { inquiry_id: inquiryId, is_primary: true },
      select: { id: true },
    });
    if (hasPrimary) return;

    const newest = await db.findFirst({
      where: { inquiry_id: inquiryId },
      orderBy: { updated_at: 'desc' },
      select: { id: true },
    });
    if (newest) {
      await db.update({
        where: { id: newest.id },
        data: { is_primary: true },
      });
    }
  }

}

