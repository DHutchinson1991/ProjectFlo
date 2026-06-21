import { DayBlueprintPlacementFacing, DayBlueprintPlacementPosition } from '@prisma/client';
import { deriveSpatialHints } from './day-blueprint-spatial-heuristics';

describe('deriveSpatialHints', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    (global as typeof global & { fetch: jest.Mock }).fetch = jest.fn().mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    (global as typeof global & { fetch: typeof originalFetch }).fetch = originalFetch;
  });

  it('keeps officiant anchored at altar front during ceremony processional context', () => {
    const hints = deriveSpatialHints({
      roleName: 'Wedding Officiant',
      activityName: 'Ceremony',
      momentName: "Processional: Bride's Entrance",
      actionText: 'welcoming guests at the front',
      roleId: 14,
    });

    expect(hints.position).toBe(DayBlueprintPlacementPosition.ALTAR_FRONT);
    expect(hints.facing).toBe(DayBlueprintPlacementFacing.TOWARD_AUDIENCE);
  });

  it('keeps groom at altar when bride entrance moment is not groom-focused', () => {
    const hints = deriveSpatialHints({
      roleName: 'Groom',
      activityName: 'Ceremony',
      momentName: "Processional: Bride's Entrance",
      actionText: 'waiting at altar for the bride',
      roleId: 2,
    });

    expect(hints.position).toBe(DayBlueprintPlacementPosition.ALTAR_FRONT);
    expect(hints.facing).toBe(DayBlueprintPlacementFacing.TOWARD_PARTNER);
  });

  it('still places groom on aisle start for explicit groom entrance moments', () => {
    const hints = deriveSpatialHints({
      roleName: 'Groom',
      activityName: 'Ceremony',
      momentName: "Processional: Groom's Entrance",
      actionText: 'walking down the aisle',
      roleId: 2,
    });

    expect(hints.position).toBe(DayBlueprintPlacementPosition.AISLE_START);
    expect(hints.facing).toBe(DayBlueprintPlacementFacing.TOWARD_ALTAR);
  });

  it('keeps groom-side party near stage when bridal-party moment is not groom-side focused', () => {
    const hints = deriveSpatialHints({
      roleName: 'Groomsmen',
      activityName: 'Ceremony',
      momentName: 'Processional: Bridal Party Entry',
      actionText: 'standing near the altar and watching',
      roleId: 10,
    });

    expect(hints.position).toBe(DayBlueprintPlacementPosition.STAGE_RIGHT);
    expect(hints.facing).toBe(DayBlueprintPlacementFacing.TOWARD_ALTAR);
  });
});
