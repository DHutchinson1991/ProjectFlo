import { SchedulePackageService } from './schedule-package.service';

describe('SchedulePackageService.setPackageEventDays', () => {
  it('rolls back event day wipe when a template create fails', async () => {
    const tx = {
      packageEventDay: {
        deleteMany: jest.fn(),
        create: jest
          .fn()
          .mockResolvedValueOnce({ id: 1 })
          .mockRejectedValueOnce(new Error('FK constraint')),
      },
    };

    const prisma = {
      $transaction: jest.fn(async (fn: (inner: typeof tx) => Promise<void>) => fn(tx)),
      packageEventDay: {
        findMany: jest.fn(),
      },
    };

    const service = new SchedulePackageService(
      prisma as never,
      {} as never,
      {} as never,
    );

    await expect(
      service.setPackageEventDays(5, { event_day_template_ids: [1, 99999] }),
    ).rejects.toThrow('FK constraint');

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(tx.packageEventDay.deleteMany).toHaveBeenCalledWith({ where: { package_id: 5 } });
    expect(tx.packageEventDay.create).toHaveBeenCalledTimes(2);
  });
});
