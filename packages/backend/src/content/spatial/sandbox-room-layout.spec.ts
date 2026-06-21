import { buildSandboxRoomLayout } from '@projectflo/shared';

describe('buildSandboxRoomLayout', () => {
  it('builds ceremony geometry with chair rows and altar', () => {
    const layout = buildSandboxRoomLayout({
      label: 'Ceremony Space',
      activityName: 'Ceremony',
    });
    expect(layout.typeTags).toContain('CEREMONY_AREA');
    expect(layout.objects.some((object) => object.object_type === 'ALTAR')).toBe(true);
    expect(layout.objects.filter((object) => object.object_type === 'CHAIR_ROW').length).toBeGreaterThanOrEqual(2);
    expect(layout.objects).toEqual(expect.arrayContaining([
      expect.objectContaining({
        object_type: 'CHAIR_ROW',
        metadata: expect.objectContaining({ side: 'L', row_index: 0, seat_cols: 5, capacity: 5 }),
      }),
      expect.objectContaining({
        object_type: 'CHAIR_ROW',
        metadata: expect.objectContaining({ side: 'R', row_index: 0, seat_cols: 5, capacity: 5 }),
      }),
    ]));
    const zoneNames = layout.zones.map((zone) => zone.name);
    expect(zoneNames).toEqual(
      expect.arrayContaining(['altar_area', 'aisle', 'left_seating', 'right_seating', 'entrance']),
    );
    expect(layout.anchors.map((anchor) => anchor.name)).toEqual(
      expect.arrayContaining(['altar_center', 'couple_position', 'aisle_start', 'front_row_left', 'front_row_right']),
    );
  });

  it('builds reception tables and dance floor', () => {
    const layout = buildSandboxRoomLayout({
      label: 'Reception Hall',
      activityName: 'Reception dinner',
    });
    expect(layout.typeTags).toContain('RECEPTION_HALL');
    expect(layout.objects.some((object) => object.object_type === 'DANCE_FLOOR')).toBe(true);
    expect(layout.objects.some((object) => object.object_type === 'TABLE_ROUND')).toBe(true);
  });
});
