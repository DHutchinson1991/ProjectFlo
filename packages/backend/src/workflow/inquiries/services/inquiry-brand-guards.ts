import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';

export async function assertServicePackageBelongsToBrand(
  prisma: PrismaService,
  packageId: number,
  brandId: number,
): Promise<void> {
  const pkg = await prisma.service_packages.findUnique({
    where: { id: packageId },
    select: { brand_id: true },
  });
  if (!pkg) {
    throw new BadRequestException('Selected package not found');
  }
  if (pkg.brand_id !== brandId) {
    throw new ForbiddenException('Selected package does not belong to this brand');
  }
}

export async function assertPaymentScheduleBelongsToBrand(
  prisma: PrismaService,
  scheduleId: number,
  brandId: number,
): Promise<void> {
  const schedule = await prisma.payment_schedule_templates.findUnique({
    where: { id: scheduleId },
    select: { brand_id: true },
  });
  if (!schedule) {
    throw new BadRequestException('Payment schedule template not found');
  }
  if (schedule.brand_id !== brandId) {
    throw new ForbiddenException('Payment schedule template does not belong to this brand');
  }
}
