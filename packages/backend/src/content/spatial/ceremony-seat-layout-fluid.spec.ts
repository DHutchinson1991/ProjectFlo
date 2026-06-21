import {
  assignCeremonySyntheticSeats,
  buildCeremonyBlueprintSubjectRoleInstances,
  computeCeremonyGuestSeatCapacity,
  CeremonySeatLayoutMode,
  type CeremonyRoleInstanceInput,
  type FloorPlanChairObject,
} from '@projectflo/shared';

function chairRow(side: 'L' | 'R', rowIndex: number, y: number): FloorPlanChairObject {
  return {
    object_type: 'CHAIR_ROW',
    x: side === 'L' ? 100 : 600,
    y,
    width: 220,
    height: 24,
    metadata: { side, row_index: rowIndex, seat_cols: 1, capacity: 1 },
  };
}

function roleLink(orderIndex: number) {
  return { order_index: orderIndex };
}

describe('assignCeremonySyntheticSeats fluid mode', () => {
  it('places party in front rows and guests only in back two rows', () => {
    const objects: FloorPlanChairObject[] = [
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

    expect(result.seatMetaByInstanceKey.get('1:0')?.rowIndex).toBeLessThanOrEqual(1);
    expect(result.seatMetaByInstanceKey.get('2:0')?.rowIndex).toBeLessThanOrEqual(3);
    expect(result.seatMetaByInstanceKey.get('13:0')?.rowIndex).toBeGreaterThanOrEqual(5);
    expect(result.seatMetaByInstanceKey.get('13:1')?.rowIndex).toBeGreaterThanOrEqual(5);
  });

  it('reports overflow when guests exceed back-row capacity', () => {
    const objects: FloorPlanChairObject[] = [
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

describe('computeCeremonyGuestSeatCapacity', () => {
  it('counts only back-two guest rows in fluid mode', () => {
    const objects: FloorPlanChairObject[] = Array.from({ length: 7 }, (_, rowIndex) => [
      chairRow('L', rowIndex, 80 + rowIndex * 60),
      chairRow('R', rowIndex, 80 + rowIndex * 60),
    ]).flat();

    expect(computeCeremonyGuestSeatCapacity(objects, CeremonySeatLayoutMode.FLUID)).toBe(4);
  });
});

describe('buildCeremonyBlueprintSubjectRoleInstances', () => {
  it('caps guest copies to guest pew capacity', () => {
    const instances = buildCeremonyBlueprintSubjectRoleInstances(
      [
        { roleId: 1, roleLabel: 'Bride', typicalCount: 1, orderIndex: 0 },
        { roleId: 2, roleLabel: 'Guests', typicalCount: 100, orderIndex: 5 },
      ],
      { guestSeatCapacity: 4 },
    );

    const guestCopies = instances.filter((instance) => instance.roleLabel === 'Guests');
    expect(guestCopies).toHaveLength(4);
    expect(guestCopies.map((instance) => instance.copyIndex)).toEqual([0, 1, 2, 3]);
  });
});
