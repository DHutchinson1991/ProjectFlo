import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { InquiryTasksService } from '../../../workflow/tasks/inquiry/services/inquiry-tasks.service';
import { EstimatesService } from '../estimates.service';
import { EstimateSnapshotService } from './estimate-snapshot.service';
import { EstimateAutoGenerationService } from './estimate-auto-generation.service';
import { computeItemsTotal, computeTaxBreakdown } from '../../shared/pricing.utils';

@Injectable()
export class EstimateLifecycleService {
  constructor(
    private prisma: PrismaService,
    private estimatesService: EstimatesService,
    private snapshotService: EstimateSnapshotService,
    private autoGenerationService: EstimateAutoGenerationService,
    private inquiryTasksService: InquiryTasksService,
  ) {}

  async send(inquiryId: number, id: number) {
    const estimate = await this.estimatesService.findOne(inquiryId, id);

    await this.snapshotService.snapshotEstimate(
      id,
      estimate.version ?? 1,
      'Before sending',
    );

    const updatedEstimate = await this.prisma.estimates.update({
      where: { id },
      data: { status: 'Sent' },
      include: { items: { select: { id: true, description: true, quantity: true, unit_price: true } } },
    });

    return {
      ...updatedEstimate,
      total_amount: Number(updatedEstimate.total_amount),
      total_with_tax: computeTaxBreakdown(
        Number(updatedEstimate.total_amount),
        Number(updatedEstimate.tax_rate ?? 0),
      ).total,
      items: updatedEstimate.items.map((item) => ({
        ...item,
        unit_price: Number(item.unit_price),
      })),
    };
  }

  /**
   * Rebuild line items for a Draft estimate from the live schedule snapshot.
   * Replaces all existing items with freshly-computed costs.
   */
  async refreshItems(inquiryId: number, id: number) {
    const estimate = await this.estimatesService.findOne(inquiryId, id);
    if (estimate.status !== 'Draft') {
      throw new BadRequestException('Only Draft estimates can be refreshed');
    }

    await this.snapshotService.snapshotEstimate(
      id,
      estimate.version ?? 1,
      'Before cost refresh',
    );

    const inquiry = await this.loadInquiryForAutoGen(inquiryId);
    const newItems = await this.autoGenerationService.buildAutoEstimateItems(
      inquiryId,
      inquiry.selected_package_id!,
      inquiry.contact!.brand!.id,
    );

    const total = computeItemsTotal(newItems);
    await this.replaceItems(id, newItems, total, inquiry.selected_package?.name);

    await this.inquiryTasksService.setAutoSubtaskStatus(
      inquiryId,
      'review_estimate',
      true,
    );

    return this.loadEstimateResponse(id);
  }

  /**
   * Revise a Sent estimate: snapshot, rebuild from live data, reset to Draft,
   * bump version.
   */
  async revise(inquiryId: number, id: number) {
    const estimate = await this.estimatesService.findOne(inquiryId, id);
    if (estimate.status !== 'Sent') {
      throw new BadRequestException('Only Sent estimates can be revised');
    }

    await this.snapshotService.snapshotEstimate(
      id,
      estimate.version ?? 1,
      'Before revision',
    );

    const inquiry = await this.loadInquiryForAutoGen(inquiryId);
    const newItems = await this.autoGenerationService.buildAutoEstimateItems(
      inquiryId,
      inquiry.selected_package_id!,
      inquiry.contact!.brand!.id,
    );

    const total = computeItemsTotal(newItems);
    await this.replaceItems(id, newItems, total, inquiry.selected_package?.name, 'Draft');

    return this.loadEstimateResponse(id);
  }

  private async loadInquiryForAutoGen(inquiryId: number) {
    const inquiry = await this.prisma.inquiries.findUnique({
      where: { id: inquiryId },
      select: {
        selected_package_id: true,
        selected_package: { select: { name: true } },
        contact: { select: { brand: { select: { id: true } } } },
      },
    });
    if (!inquiry?.selected_package_id || !inquiry.contact?.brand?.id) {
      throw new BadRequestException(
        'Inquiry has no package or brand associated',
      );
    }
    return inquiry;
  }

  private async replaceItems(
    estimateId: number,
    newItems: Array<{
      description: string;
      category?: string;
      quantity: number;
      unit: string;
      unit_price: number;
    }>,
    total: number,
    packageName?: string | null,
    status?: string,
  ): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.estimate_items.deleteMany({ where: { estimate_id: estimateId } }),
      ...(newItems.length > 0
        ? [
            this.prisma.estimate_items.createMany({
              data: newItems.map((item) => ({
                estimate_id: estimateId,
                description: item.description,
                category: item.category ?? null,
                quantity: item.quantity,
                unit: item.unit,
                unit_price: item.unit_price,
              })),
            }),
          ]
        : []),
    ]);

    await this.prisma.estimates.update({
      where: { id: estimateId },
      data: {
        total_amount: total,
        version: { increment: 1 },
        ...(packageName ? { title: packageName } : {}),
        ...(status ? { status } : {}),
      },
    });
  }

  private async loadEstimateResponse(estimateId: number) {
    const updated = await this.prisma.estimates.findUniqueOrThrow({
      where: { id: estimateId },
      include: { items: true },
    });
    return {
      ...updated,
      total_amount: Number(updated.total_amount),
      items: updated.items.map((item) => ({
        ...item,
        unit_price: Number(item.unit_price),
        quantity: Number(item.quantity),
      })),
    };
  }
}
