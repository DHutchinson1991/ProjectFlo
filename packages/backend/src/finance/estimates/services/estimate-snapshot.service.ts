import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';

@Injectable()
export class EstimateSnapshotService {
  constructor(private prisma: PrismaService) {}

  /**
   * Save a point-in-time copy of the estimate's current line items.
   * Called before any destructive update (refresh, send, revise).
   */
  async snapshotEstimate(
    estimateId: number,
    versionNumber: number,
    label: string,
  ): Promise<void> {
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
        items_snapshot: current.items.map((item) => ({
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

  /** Retrieve the version history snapshots for an estimate. */
  async getSnapshots(estimateId: number) {
    const snapshots = await this.prisma.estimate_snapshots.findMany({
      where: { estimate_id: estimateId },
      orderBy: { snapshotted_at: 'desc' },
    });
    return snapshots.map((s) => ({
      ...s,
      total_amount: Number(s.total_amount),
    }));
  }
}
