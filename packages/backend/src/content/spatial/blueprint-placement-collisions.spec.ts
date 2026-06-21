import {
  buildSandboxRoomLayout,
  coordinatesFromBlueprintPlacement,
  deriveSandboxAnchors,
  resolveSpatialCollisions,
  SOLID_OBJECT_TYPES,
  SUBJECT_MIN_SEPARATION,
} from '@projectflo/shared';

/**
 * Seed-path regression: the deterministic placement seed (anchors +
 * coordinatesFromBlueprintPlacement + resolveSpatialCollisions) must produce
 * positions that are already collision-free for the standard wedding-ceremony
 * cast used by the Moonrise blueprint template.
 */
describe('blueprint placement seed collisions (wedding ceremony)', () => {
  const ceremonyRoles = [
    'Bride',
    'Groom',
    'Officiant',
    'Best Man',
    'Maid of Honor',
    'Father of the Bride',
    'Mother of the Bride',
    'Father of the Groom',
    'Mother of the Groom',
  ];

  it('produces collision-free positions for the ceremony cast', () => {
    const layout = buildSandboxRoomLayout({
      label: 'Ceremony Space',
      activityName: 'Ceremony',
    });
    const anchors = deriveSandboxAnchors(layout.objects);

    const subjects = ceremonyRoles.map((roleLabel, index) => {
      const coords = coordinatesFromBlueprintPlacement(
        {},
        index,
        ceremonyRoles.length,
        'ceremony',
        roleLabel,
        0,
        undefined,
        { momentName: 'Vows', anchors },
      );
      return { name: roleLabel, x: coords.x, y: coords.y, seated: false };
    });

    const rects = layout.objects.map((o) => ({
      object_type: o.object_type,
      x: o.x,
      y: o.y,
      width: o.width,
      height: o.height,
    }));

    // Run the shared resolver exactly like DayBlueprintPlacementSeedService.
    const points = subjects.map((s) => ({ ...s }));
    resolveSpatialCollisions(points, rects);

    // After resolution: pairwise separation holds.
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const dist = Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y);
        expect(dist).toBeGreaterThanOrEqual(SUBJECT_MIN_SEPARATION - 1);
      }
    }

    // After resolution: nobody stands inside solid furniture.
    for (const p of points) {
      for (const rect of rects) {
        if (!SOLID_OBJECT_TYPES.has(rect.object_type)) continue;
        const inside =
          p.x > rect.x && p.x < rect.x + rect.width &&
          p.y > rect.y && p.y < rect.y + rect.height;
        expect(inside).toBe(false);
      }
    }
  });

  it('anchors resolve key wedding-party roles near the altar', () => {
    const layout = buildSandboxRoomLayout({
      label: 'Ceremony Space',
      activityName: 'Ceremony',
    });
    const anchors = deriveSandboxAnchors(layout.objects);
    const couplePosition = anchors.find((a) => a.name === 'couple_position');
    expect(couplePosition).toBeDefined();

    const couple = ['Bride', 'Groom'].map((role, index) =>
      coordinatesFromBlueprintPlacement(
        { position_hint: 'ALTAR_FRONT', facing_hint: 'TOWARD_AUDIENCE' },
        index,
        2,
        'ceremony',
        role,
        0,
        undefined,
        { momentName: 'Vows', anchors },
      ),
    );

    for (const coords of couple) {
      const dist = Math.hypot(coords.x - couplePosition!.x, coords.y - couplePosition!.y);
      expect(dist).toBeLessThan(150);
    }
  });
});
