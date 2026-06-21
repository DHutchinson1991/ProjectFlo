import { BadRequestException } from '@nestjs/common';
import { DayBlueprintAuthoringMomentDetailsService } from './day-blueprint-authoring-moment-details.service';

describe('DayBlueprintAuthoringMomentDetailsService', () => {
  describe('createMoment', () => {
    it('rejects inherit_from_moment_id when blueprint is not blank_authoring', async () => {
      const prisma = {
        dayBlueprintActivity: {
          findUnique: jest.fn().mockResolvedValue({
            id: 7,
            day: {
              day_blueprint_version_id: 99,
              version: {
                day_blueprint: { variant_tags: {} },
              },
            },
          }),
        },
        $transaction: jest.fn(async (cb: (tx: unknown) => Promise<unknown>) =>
          cb({
            dayBlueprintMoment: {
              create: jest.fn().mockResolvedValue({
                id: 100,
                day_blueprint_activity_id: 7,
                order_index: 2,
              }),
            },
          }),
        ),
      };
      const versions = { assertDraft: jest.fn().mockResolvedValue(undefined) };
      const service = new DayBlueprintAuthoringMomentDetailsService(prisma as never, versions as never);
      await expect(
        service.createMoment(7, {
          name: 'Next',
          order_index: 2,
          inherit_from_moment_id: 50,
        } as never),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
