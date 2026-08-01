import { NotFoundException } from '@nestjs/common';
import { SchedulePackageAccessService } from './schedule-package-access.service';

describe('SchedulePackageAccessService', () => {
  function createService(findFirstImpl: jest.Mock) {
    const prisma = {
      service_packages: { findFirst: findFirstImpl },
      packageFilm: { findFirst: jest.fn() },
      packageActivity: { findFirst: jest.fn() },
      packageActivityMoment: { findFirst: jest.fn() },
    };
    return { service: new SchedulePackageAccessService(prisma as never), prisma };
  }

  it('allows access when package belongs to brand', async () => {
    const findFirst = jest.fn().mockResolvedValue({ id: 7 });
    const { service } = createService(findFirst);

    await expect(service.assertPackage(7, 2)).resolves.toBeUndefined();
    expect(findFirst).toHaveBeenCalledWith({
      where: { id: 7, brand_id: 2 },
      select: { id: true },
    });
  });

  it('rejects access when package belongs to another brand', async () => {
    const findFirst = jest.fn().mockResolvedValue(null);
    const { service } = createService(findFirst);

    await expect(service.assertPackage(7, 2)).rejects.toBeInstanceOf(NotFoundException);
  });
});
