import { DayBlueprintPlacementFacing, DayBlueprintPlacementPosition } from '@prisma/client';
import { DayBlueprintSpatialGeneratorService } from './day-blueprint-spatial-generator.service';

describe('DayBlueprintSpatialGeneratorService', () => {
  it('places ceremony processional roles on aisle hints', async () => {
    const prisma = {
      dayBlueprintDay: {
        findUnique: jest.fn().mockResolvedValue({
          id: 20,
          day_blueprint_version_id: 10,
          version: {
            subject_roles: [
              { subject_role_id: 1, subject_role: { role_name: 'Bride' } },
              { subject_role_id: 2, subject_role: { role_name: 'Bridesmaids' } },
              { subject_role_id: 3, subject_role: { role_name: 'Guests' } },
            ],
            space_slots: [
              { id: 99, day_blueprint_location_role_id: 7, key: 'ceremony_space', label: 'Ceremony Space' },
            ],
          },
          activities: [
            {
              id: 30,
              name: 'Ceremony',
              activity_locations: [{ day_blueprint_location_role_id: 7 }],
              moments: [
                {
                  id: 40,
                  name: 'Processional: Wedding Party Entry',
                  lock_flags: null,
                  actions: [
                    { subject_role_id: 1, action_text: 'Bride walks down the aisle', notes: null },
                    { subject_role_id: 2, action_text: 'Bridesmaids process down the aisle', notes: null },
                    { subject_role_id: 3, action_text: 'Guests are seated', notes: null },
                  ],
                  placements: [],
                },
              ],
            },
          ],
        }),
      },
      dayBlueprintMomentPlacement: {
        deleteMany: jest.fn(),
        create: jest.fn().mockResolvedValue({ id: 1 }),
      },
    };
    const versions = { assertDraft: jest.fn().mockResolvedValue(undefined) };
    const aiEvents = { emit: jest.fn() };
    const service = new DayBlueprintSpatialGeneratorService(
      prisma as never,
      versions as never,
      aiEvents as never,
    );

    await service.generateForDay(10, 20, {});

    expect(prisma.dayBlueprintMomentPlacement.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        subject_role_id: 1,
        position_hint: DayBlueprintPlacementPosition.AISLE_START,
        facing_hint: DayBlueprintPlacementFacing.TOWARD_ALTAR,
      }),
    });
    expect(prisma.dayBlueprintMomentPlacement.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        subject_role_id: 2,
        position_hint: DayBlueprintPlacementPosition.AISLE_START,
        facing_hint: DayBlueprintPlacementFacing.TOWARD_ALTAR,
      }),
    });
    expect(prisma.dayBlueprintMomentPlacement.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        subject_role_id: 3,
        position_hint: DayBlueprintPlacementPosition.FIRST_ROW_RIGHT,
        facing_hint: DayBlueprintPlacementFacing.TOWARD_ALTAR,
      }),
    });
  });
});
