import { Injectable } from '@nestjs/common';
import { PlanningStatus } from '@prisma/client';
import { PrismaService } from '../../../platform/prisma/prisma.service';

@Injectable()
export class ActivityPlanningStatusService {
  constructor(private readonly prisma: PrismaService) {}

  async markPlanning(packageId: number): Promise<void> {
    await this.prisma.service_packages.update({
      where: { id: packageId },
      data: { planning_status: PlanningStatus.PLANNING, planning_error: null },
    });
  }

  async setStatus(packageId: number, status: PlanningStatus, error?: string): Promise<void> {
    await this.prisma.service_packages.update({
      where: { id: packageId },
      data: { planning_status: status, ...(error ? { planning_error: error.slice(0, 500) } : {}) },
    });
  }
}