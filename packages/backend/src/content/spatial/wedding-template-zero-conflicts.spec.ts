import {
  buildSandboxRoomLayout,
  coordinatesFromBlueprintPlacement,
  deriveSandboxAnchors,
  inferShotTypeFromDistances,
  resolveSpatialCollisions,
} from '@projectflo/shared';
import { BlockingDirectorService } from '../../ai/blocking/blocking-director.service';
import { SpatialTranslatorService } from '../spatial-engine/services/spatial-translator.service';

/**
 * End-to-end smoke for the seeded wedding template, asserting zero conflicts
 * "by construction": positions come from the deterministic seed path
 * (anchors → coordinates → collision resolver), cameras are aimed/validated
 * by the blocking guardrails, and the read-time conflict math
 * (SpatialTranslatorService — the same code the Content Builder conflict
 * panel uses) must then report every targeted subject visible and a shot
 * type that agrees with the shared shot-framing module.
 */
describe('wedding template end-to-end zero conflicts', () => {
  const blocking = new BlockingDirectorService(
    {} as never,
    {} as never,
    {} as never,
    { load: jest.fn().mockReturnValue('') } as never,
  );
  const translator = new SpatialTranslatorService();

  const cast: Array<{ role: string; daySubjectId: number; hint?: string }> = [
    { role: 'Officiant', daySubjectId: 1, hint: 'ALTAR_FRONT' },
    { role: 'Bride', daySubjectId: 2, hint: 'ALTAR_FRONT' },
    { role: 'Groom', daySubjectId: 3, hint: 'ALTAR_FRONT' },
    { role: 'Best Man', daySubjectId: 4, hint: 'ALTAR_FRONT' },
    { role: 'Maid of Honor', daySubjectId: 5, hint: 'ALTAR_FRONT' },
    { role: 'Father of the Bride', daySubjectId: 6 },
    { role: 'Mother of the Bride', daySubjectId: 7 },
  ];

  it('targeted subjects are visible and shot types agree for every camera', () => {
    // 1. Seed path: layout → anchors → coordinates → collision resolution.
    const layout = buildSandboxRoomLayout({ label: 'Ceremony Space', activityName: 'Ceremony' });
    const anchors = deriveSandboxAnchors(layout.objects);

    const positioned = cast.map((member, index) => {
      const coords = coordinatesFromBlueprintPlacement(
        member.hint ? { position_hint: member.hint, facing_hint: 'TOWARD_AUDIENCE' } : {},
        index,
        cast.length,
        'ceremony',
        member.role,
        0,
        undefined,
        { momentName: 'Vows', anchors },
      );
      return { ...member, x: coords.x, y: coords.y, rotation: coords.rotation, seated: false };
    });

    resolveSpatialCollisions(
      positioned,
      layout.objects.map((o) => ({
        object_type: o.object_type,
        x: o.x,
        y: o.y,
        width: o.width,
        height: o.height,
      })),
    );

    // 2. Blocking guardrails: aim + FOV-validate cameras at their targets.
    const cameraDefs = [
      { label: 'CAM1', cameraPositionId: 1, x: 500, y: 700, fov: 60, targets: ['Bride', 'Groom', 'Officiant'] },
      { label: 'CAM2', cameraPositionId: 2, x: 220, y: 420, fov: 40, targets: ['Bride', 'Maid of Honor'] },
      { label: 'CAM3', cameraPositionId: 3, x: 780, y: 430, fov: 40, targets: ['Groom', 'Best Man'] },
    ];

    const subjectResults = positioned.map((p) => ({
      name: p.role,
      x: p.x,
      y: p.y,
      rotation: p.rotation,
      actionDescription: '',
      positionId: p.daySubjectId,
      daySubjectId: p.daySubjectId,
    }));

    const fittedCameras = blocking['postProcessCameras'](
      cameraDefs.map((c) => ({
        label: c.label,
        cameraPositionId: c.cameraPositionId,
        x: c.x,
        y: c.y,
        rotation: 0,
        subjectNames: c.targets,
      })) as never,
      subjectResults as never,
      cameraDefs.map((c) => ({
        label: c.label,
        cameraPositionId: c.cameraPositionId,
        prevX: c.x,
        prevY: c.y,
        prevRotation: 0,
        fovAngle: c.fov,
        isUnmanned: false,
        baseX: c.x,
        baseY: c.y,
        baseRotation: 0,
      })),
    );

    // 3. Read-time conflict math: the same translation the conflict panel runs.
    const floorSubjects = positioned.map((p) => ({
      name: p.role,
      x: p.x,
      y: p.y,
      rotation: p.rotation,
      isGroup: false,
      daySubjectId: p.daySubjectId,
      seated: false,
    }));
    const nameToId = new Map(positioned.map((p) => [p.role, p.daySubjectId]));

    for (let i = 0; i < fittedCameras.length; i++) {
      const cam = fittedCameras[i];
      const fov = cam.fovAngle ?? cameraDefs[i].fov;
      const targetedIds = cameraDefs[i].targets.map((t) => nameToId.get(t)!);

      const frame = translator.translate(
        { x: cam.x, y: cam.y, rotation: cam.rotation, fovDegrees: fov },
        floorSubjects,
        targetedIds,
      );

      // TARGET_NOT_VISIBLE must be impossible for freshly generated plans.
      const visibleIds = new Set(
        frame.visibleSubjects.map((s) => s.daySubjectId).filter((id): id is number => id != null),
      );
      const notVisible = targetedIds.filter((id) => !visibleIds.has(id));
      expect({ camera: cam.label, notVisible }).toEqual({ camera: cam.label, notVisible: [] });

      // SHOT_TYPE_MISMATCH guard: read-time inference must agree with the
      // shared shot-framing module fed with the same visible distances.
      const expected = inferShotTypeFromDistances(
        frame.visibleSubjects.map((s) => s.distance),
        fov,
      );
      expect(frame.inferredShotType).toBe(expected);
    }
  });
});
