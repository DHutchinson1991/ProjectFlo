import type { SpaceSlotObject } from '@/features/workflow/locations/types/floor-plan.types';
import type { DayBlueprintSubjectRoleLink } from '../types';
import {
  assignCeremonySyntheticSeats,
  CeremonySeatLayoutMode,
  classifyCeremonySeatTier,
  findNearestChairSeatMeta,
  inferParentSeatSidePreference,
  resolveChairSeatCoordinates,
  type CeremonyRoleInstanceInput,
} from '@projectflo/shared';

function chairRow(side: 'L' | 'R', rowIndex: number, y: number): SpaceSlotObject {
  return {
    id: rowIndex * 10 + (side === 'L' ? 1 : 2),
    package_space_slot_id: 1,
    object_type: 'CHAIR_ROW',
    label: `Row ${rowIndex} ${side}`,
    x: side === 'L' ? 100 : 600,
    y,
    width: 220,
    height: 24,
    rotation: 0,
    metadata: { side, row_index: rowIndex, seat_cols: 1, capacity: 1 },
    order_index: rowIndex,
    created_at: '',
    updated_at: '',
  };
}

function roleLink(orderIndex: number): DayBlueprintSubjectRoleLink {
  return {
    id: orderIndex + 1,
    order_index: orderIndex,
  } as DayBlueprintSubjectRoleLink;
}

describe('ceremony-seat-layout', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    (global as typeof global & { fetch: jest.Mock }).fetch = jest.fn().mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    (global as typeof global & { fetch: typeof originalFetch }).fetch = originalFetch;
  });

  it('classifies parent labels as other even when guest language appears', () => {
    expect(classifyCeremonySeatTier('Mother of Bride Guest Escort')).toBe('other');
  });

  it('infers parent side preference from common parent labels', () => {
    expect(inferParentSeatSidePreference("Bride's Father")).toBe('left');
    expect(inferParentSeatSidePreference('MOG')).toBe('right');
  });

  it('prioritizes parent roles ahead of non-parent other roles', () => {
    const objects: SpaceSlotObject[] = [
      chairRow('L', 1, 120),
      chairRow('L', 2, 180),
      chairRow('R', 1, 120),
      chairRow('R', 2, 180),
    ];

    const instances: CeremonyRoleInstanceInput[] = [
      {
        roleId: 99,
        copyIndex: 0,
        copyCount: 1,
        roleLink: roleLink(0),
        roleLabel: 'Reader',
        skipSeatSnap: false,
      },
      {
        roleId: 5,
        copyIndex: 0,
        copyCount: 1,
        roleLink: roleLink(10),
        roleLabel: 'Father of Bride',
        skipSeatSnap: false,
      },
    ];

    const result = assignCeremonySyntheticSeats(objects, instances);
    const parentSeat = result.seatByInstanceKey.get('5:0');
    const readerSeat = result.seatByInstanceKey.get('99:0');

    expect(parentSeat).toBeDefined();
    expect(readerSeat).toBeDefined();
    expect(parentSeat!.y).toBeLessThan(readerSeat!.y);
  });

  it('does not assign guests to the front two rows when there is no wedding party', () => {
    const objects: SpaceSlotObject[] = [
      chairRow('L', 0, 80),
      chairRow('R', 0, 80),
      chairRow('L', 1, 120),
      chairRow('R', 1, 120),
      chairRow('L', 2, 180),
      chairRow('R', 2, 180),
    ];

    const instances: CeremonyRoleInstanceInput[] = [
      {
        roleId: 13,
        copyIndex: 0,
        copyCount: 2,
        roleLink: roleLink(5),
        roleLabel: 'Guests',
        skipSeatSnap: false,
      },
      {
        roleId: 13,
        copyIndex: 1,
        copyCount: 2,
        roleLink: roleLink(5),
        roleLabel: 'Guests',
        skipSeatSnap: false,
      },
    ];

    const result = assignCeremonySyntheticSeats(objects, instances);
    const meta0 = result.seatMetaByInstanceKey.get('13:0');
    const meta1 = result.seatMetaByInstanceKey.get('13:1');
    expect(meta0?.rowIndex).toBeGreaterThanOrEqual(2);
    expect(meta1?.rowIndex).toBeGreaterThanOrEqual(2);
  });

  it('keeps front party rows vacant for guests when party roles are in motion', () => {
    const objects: SpaceSlotObject[] = [
      chairRow('L', 0, 80),
      chairRow('R', 0, 80),
      chairRow('L', 1, 120),
      chairRow('R', 1, 120),
      chairRow('L', 2, 180),
      chairRow('R', 2, 180),
    ];

    const instances: CeremonyRoleInstanceInput[] = [
      {
        roleId: 9,
        copyIndex: 0,
        copyCount: 1,
        roleLink: roleLink(0),
        roleLabel: 'Bridesmaids',
        skipSeatSnap: true,
      },
      {
        roleId: 13,
        copyIndex: 0,
        copyCount: 3,
        roleLink: roleLink(5),
        roleLabel: 'Guests',
        skipSeatSnap: false,
      },
      {
        roleId: 13,
        copyIndex: 1,
        copyCount: 3,
        roleLink: roleLink(5),
        roleLabel: 'Guests',
        skipSeatSnap: false,
      },
      {
        roleId: 13,
        copyIndex: 2,
        copyCount: 3,
        roleLink: roleLink(5),
        roleLabel: 'Guests',
        skipSeatSnap: false,
      },
    ];

    const result = assignCeremonySyntheticSeats(objects, instances);
    const guestSeats = ['13:0', '13:1', '13:2']
      .map((k) => result.seatByInstanceKey.get(k))
      .filter((seat): seat is { x: number; y: number; rotation: number } => Boolean(seat));

    expect(guestSeats.length).toBeGreaterThan(0);
    expect(guestSeats.every((seat) => seat.y >= 180)).toBe(true);
  });

  it('findNearestChairSeatMeta returns stable seat identity and resolveChairSeatCoordinates round-trips', () => {
    const objects: SpaceSlotObject[] = [
      chairRow('L', 0, 80),
      chairRow('L', 1, 140),
    ];
    const snap = findNearestChairSeatMeta(objects, 105, 82, { width: 1000, height: 1000 });
    expect(snap.meta).toEqual({ side: 'L', rowIndex: 0, seatIndex: 0 });
    const roundTrip = resolveChairSeatCoordinates(objects, snap.meta!);
    expect(roundTrip).toEqual({ x: snap.x, y: snap.y, rotation: 0 });
  });

  it('fluid mode places party in front rows and guests only in back two rows', () => {
    const objects: SpaceSlotObject[] = [
      chairRow('L', 0, 80),
      chairRow('R', 0, 80),
      chairRow('L', 1, 140),
      chairRow('R', 1, 140),
      chairRow('L', 2, 200),
      chairRow('R', 2, 200),
      chairRow('L', 3, 260),
      chairRow('R', 3, 260),
      chairRow('L', 4, 320),
      chairRow('R', 4, 320),
      chairRow('L', 5, 380),
      chairRow('R', 5, 380),
      chairRow('L', 6, 440),
      chairRow('R', 6, 440),
    ];

    const instances: CeremonyRoleInstanceInput[] = [
      {
        roleId: 1,
        copyIndex: 0,
        copyCount: 1,
        roleLink: roleLink(0),
        roleLabel: 'Bridesmaids',
        skipSeatSnap: false,
      },
      {
        roleId: 2,
        copyIndex: 0,
        copyCount: 1,
        roleLink: roleLink(1),
        roleLabel: 'Father of Bride',
        skipSeatSnap: false,
      },
      {
        roleId: 13,
        copyIndex: 0,
        copyCount: 2,
        roleLink: roleLink(5),
        roleLabel: 'Guests',
        skipSeatSnap: false,
      },
      {
        roleId: 13,
        copyIndex: 1,
        copyCount: 2,
        roleLink: roleLink(5),
        roleLabel: 'Guests',
        skipSeatSnap: false,
      },
    ];

    const result = assignCeremonySyntheticSeats(objects, instances, {
      seatLayout: CeremonySeatLayoutMode.FLUID,
    });

    const partyMeta = result.seatMetaByInstanceKey.get('1:0');
    const parentMeta = result.seatMetaByInstanceKey.get('2:0');
    const guest0 = result.seatMetaByInstanceKey.get('13:0');
    const guest1 = result.seatMetaByInstanceKey.get('13:1');

    expect(partyMeta?.rowIndex).toBeLessThanOrEqual(1);
    expect(parentMeta?.rowIndex).toBeLessThanOrEqual(3);
    expect(guest0?.rowIndex).toBeGreaterThanOrEqual(5);
    expect(guest1?.rowIndex).toBeGreaterThanOrEqual(5);
  });

  it('fluid mode reports overflow when guests exceed back-row capacity', () => {
    const objects: SpaceSlotObject[] = [
      chairRow('L', 0, 80),
      chairRow('R', 0, 80),
      chairRow('L', 1, 140),
      chairRow('R', 1, 140),
      chairRow('L', 5, 380),
      chairRow('R', 5, 380),
      chairRow('L', 6, 440),
      chairRow('R', 6, 440),
    ];

    const instances: CeremonyRoleInstanceInput[] = Array.from({ length: 5 }, (_, copyIndex) => ({
      roleId: 13,
      copyIndex,
      copyCount: 5,
      roleLink: roleLink(5),
      roleLabel: 'Guests',
      skipSeatSnap: false,
    }));

    const result = assignCeremonySyntheticSeats(objects, instances, {
      seatLayout: CeremonySeatLayoutMode.FLUID,
    });

    expect(result.seatedSubjectCount).toBe(4);
    expect(result.overflowSubjectCount).toBe(1);
  });
});
