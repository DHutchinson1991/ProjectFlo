import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import {
  assertPaymentScheduleBelongsToBrand,
  assertServicePackageBelongsToBrand,
} from './inquiry-brand-guards';

describe('inquiry-brand-guards', () => {
  const servicePackagesFindUnique = jest.fn();
  const paymentScheduleFindUnique = jest.fn();
  const prisma = {
    service_packages: { findUnique: servicePackagesFindUnique },
    payment_schedule_templates: { findUnique: paymentScheduleFindUnique },
  } as unknown as PrismaService;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('assertServicePackageBelongsToBrand', () => {
    it('rejects missing packages', async () => {
      servicePackagesFindUnique.mockResolvedValue(null);

      await expect(assertServicePackageBelongsToBrand(prisma, 9, 1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects cross-brand packages', async () => {
      servicePackagesFindUnique.mockResolvedValue({ brand_id: 2 });

      await expect(assertServicePackageBelongsToBrand(prisma, 9, 1)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('allows same-brand packages', async () => {
      servicePackagesFindUnique.mockResolvedValue({ brand_id: 1 });

      await expect(assertServicePackageBelongsToBrand(prisma, 9, 1)).resolves.toBeUndefined();
    });
  });

  describe('assertPaymentScheduleBelongsToBrand', () => {
    it('rejects missing schedules', async () => {
      paymentScheduleFindUnique.mockResolvedValue(null);

      await expect(assertPaymentScheduleBelongsToBrand(prisma, 4, 1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects cross-brand schedules', async () => {
      paymentScheduleFindUnique.mockResolvedValue({
        brand_id: 2,
      });

      await expect(assertPaymentScheduleBelongsToBrand(prisma, 4, 1)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('allows same-brand schedules', async () => {
      paymentScheduleFindUnique.mockResolvedValue({
        brand_id: 1,
      });

      await expect(assertPaymentScheduleBelongsToBrand(prisma, 4, 1)).resolves.toBeUndefined();
    });
  });
});
