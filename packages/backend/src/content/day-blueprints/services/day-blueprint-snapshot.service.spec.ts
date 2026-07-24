import { BadRequestException } from '@nestjs/common';
import { DayBlueprintSnapshotService } from './day-blueprint-snapshot.service';

describe('DayBlueprintSnapshotService positional day mapping', () => {
  it('rejects when blueprint has more days than the package', async () => {
    const prisma = {
      dayBlueprintVersion: {
        findUnique: jest.fn().mockResolvedValue({
          id: 1,
          status: 'PUBLISHED',
          day_blueprint: { id: 1 },
          days: [
            { id: 10, order_index: 0, activities: [] },
            { id: 11, order_index: 1, activities: [] },
          ],
          space_slots: [],
          subject_roles: [],
        }),
      },
      service_packages: {
        findUnique: jest.fn().mockResolvedValue({
          id: 5,
          created_from_package_template_id: 1,
          package_event_days: [{ id: 50, event_day_template_id: 100, order_index: 0 }],
        }),
      },
      $transaction: jest.fn(),
    };

    const service = new DayBlueprintSnapshotService(
      prisma as never,
      { applySandboxLayout: jest.fn() } as never,
    );

    await expect(
      service.consumeIntoPackage({
        packageId: 5,
        blueprintVersionId: 1,
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
