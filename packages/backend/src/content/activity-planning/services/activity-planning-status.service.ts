import { Injectable } from '@nestjs/common';
import { PlanningStatus } from '@prisma/client';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { PLANNING_CANCELLED_BY_USER_MESSAGE } from '../package-planning-cancel.constants';

@Injectable()
export class ActivityPlanningStatusService {
  constructor(private readonly prisma: PrismaService) {}

  async markPlanning(packageId: number): Promise<void> {
    await this.prisma.service_packages.update({
      where: { id: packageId },
      data: {
        planning_status: PlanningStatus.PLANNING,
        planning_error: null,
      },
    });
  }

  async setStatus(packageId: number, status: PlanningStatus, error?: string): Promise<void> {
    await this.prisma.service_packages.update({
      where: { id: packageId },
      data: {
        planning_status: status,
        planning_cancel_requested_at: null,
        ...(error ? { planning_error: error.slice(0, 500) } : {}),
      },
    });
  }

  /** Throws when POST cancel set `planning_cancel_requested_at` for this package. */
  async assertPlanningNotCancelled(packageId: number): Promise<void> {
    const row = await this.prisma.service_packages.findUnique({
      where: { id: packageId },
      select: { planning_cancel_requested_at: true },
    });
    if (row?.planning_cancel_requested_at != null) {
      throw new Error(PLANNING_CANCELLED_BY_USER_MESSAGE);
    }
  }
}