import { angleToPointDeg } from '@projectflo/shared';
import { BlockingDirectorService } from './blocking-director.service';

describe('BlockingDirectorService', () => {
  const buildService = () => new BlockingDirectorService(
    {} as never,
    {} as never,
    {} as never,
    { load: jest.fn().mockReturnValue('') } as never,
  );

  const fixedGuests = {
    name: 'Guests',
    role: 'Guests',
    isGroup: true,
    count: 100,
    isFixedContextGroup: true,
    daySubjectId: 79,
    positionId: 101,
    prevX: 450,
    prevY: 390,
    prevRotation: 180,
    prevSeated: true,
  };

  const cameraOne = {
    label: 'Camera 1',
    cameraPositionId: 201,
    prevX: 500,
    prevY: 420,
    prevRotation: 0,
    fovAngle: 60,
    isUnmanned: false,
    baseX: 500,
    baseY: 420,
    baseRotation: 0,
  };

  const bride = {
    name: 'Bride',
    role: 'Bride',
    isGroup: false,
    count: 1,
    isFixedContextGroup: false,
    daySubjectId: 1,
    positionId: 1,
    prevX: 450,
    prevY: 255,
    prevRotation: 180,
    prevSeated: false,
  };

  const groom = {
    name: 'Groom',
    role: 'Groom',
    isGroup: false,
    count: 1,
    isFixedContextGroup: false,
    daySubjectId: 2,
    positionId: 2,
    prevX: 500,
    prevY: 250,
    prevRotation: 180,
    prevSeated: false,
  };

  const officiant = {
    name: 'Officiant',
    role: 'Officiant',
    isGroup: false,
    count: 1,
    isFixedContextGroup: false,
    daySubjectId: 3,
    positionId: 3,
    prevX: 550,
    prevY: 255,
    prevRotation: 180,
    prevSeated: false,
  };

  it('recovers camera rows misplaced into the AI subjects array', () => {
    const service = buildService();

    const result = service['parseResponse'](
      JSON.stringify({
        momentDescription: 'Guests are settling in.',
        durationSeconds: 120,
        subjects: [
          {
            name: 'Guests',
            x: 450,
            y: 390,
            rotation: 180,
            seated: true,
            actionDescription: 'Guests take their seats.',
          },
          {
            name: 'Camera 1',
            x: 500,
            y: 420,
            rotation: 0,
            subjectNames: ['Guests'],
          },
        ],
        cameras: [],
      }),
      [fixedGuests],
      [cameraOne],
    );

    expect(result.subjects).toHaveLength(1);
    expect(result.subjects[0]).toEqual(
      expect.objectContaining({
        name: 'Guests',
        daySubjectId: 79,
        x: 450,
        y: 390,
      }),
    );
    expect(result.cameras).toEqual([
      expect.objectContaining({
        label: 'Camera 1',
        cameraPositionId: 201,
        subjectNames: ['Guests'],
      }),
    ]);
  });

  it('keeps fixed context groups on their base position while preserving action text and camera targeting', () => {
    const service = buildService();

    const result = service['parseResponse'](
      JSON.stringify({
        momentDescription: 'Guests settle while the couple waits.',
        durationSeconds: 150,
        subjects: [
          {
            name: 'Guests',
            x: 500,
            y: 130,
            rotation: 90,
            seated: true,
            actionDescription: 'settling into the pews and watching the aisle fill',
          },
        ],
        cameras: [
          {
            label: 'Camera 1',
            x: 500,
            y: 420,
            rotation: 0,
            subjectNames: ['Guests'],
          },
        ],
      }),
      [fixedGuests],
      [cameraOne],
    );

    expect(result.subjects).toEqual([
      expect.objectContaining({
        name: 'Guests',
        x: 450,
        y: 390,
        rotation: 180,
        actionDescription: 'settling into the pews and watching the aisle fill',
      }),
    ]);
    expect(result.cameras).toEqual([
      expect.objectContaining({
        label: 'Camera 1',
        subjectNames: ['Guests'],
      }),
    ]);
  });

  it('reuses base rows when a fixed context group is omitted from AI subjects', () => {
    const service = buildService();

    const result = service['parseResponse'](
      JSON.stringify({
        momentDescription: 'The crowd watches quietly.',
        durationSeconds: 120,
        subjects: [],
        cameras: [
          {
            label: 'Camera 1',
            x: 500,
            y: 420,
            rotation: 0,
            subjectNames: ['Guests'],
          },
        ],
      }),
      [fixedGuests],
      [cameraOne],
    );

    expect(result.subjects).toEqual([
      expect.objectContaining({
        name: 'Guests',
        x: 450,
        y: 390,
        rotation: 180,
      }),
    ]);
    expect(result.cameras).toEqual([
      expect.objectContaining({
        label: 'Camera 1',
        cameraPositionId: 201,
        subjectNames: ['Guests'],
      }),
    ]);
  });

  it('caps narrow FOV cameras more aggressively than wide cameras at the same distance', () => {
    const service = buildService();
    const wideCamera = {
      ...cameraOne,
      prevX: 500,
      prevY: 500,
      baseX: 500,
      baseY: 500,
      fovAngle: 60,
    };
    const tightCamera = {
      ...wideCamera,
      fovAngle: 24,
    };
    const reply = JSON.stringify({
      momentDescription: 'Vows at the altar.',
      durationSeconds: 90,
      subjects: [
        {
          name: 'Bride',
          x: 450,
          y: 255,
          rotation: 180,
          actionDescription: 'speaks vows',
        },
        {
          name: 'Groom',
          x: 500,
          y: 250,
          rotation: 180,
          actionDescription: 'listens closely',
        },
        {
          name: 'Officiant',
          x: 550,
          y: 255,
          rotation: 180,
          actionDescription: 'leads the vows',
        },
      ],
      cameras: [
        {
          label: 'Camera 1',
          x: 500,
          y: 500,
          rotation: 0,
          subjectNames: ['Bride', 'Groom', 'Officiant'],
        },
      ],
    });

    const wideResult = service['parseResponse'](reply, [bride, groom, officiant], [wideCamera]);
    const tightResult = service['parseResponse'](reply, [bride, groom, officiant], [tightCamera]);

    const wideTelemetry = service['applyBlockingGuardrails'](wideResult, [bride, groom, officiant], [wideCamera], []);
    const tightTelemetry = service['applyBlockingGuardrails'](tightResult, [bride, groom, officiant], [tightCamera], []);

    expect(wideResult.cameras[0].subjectNames).toEqual(['Bride', 'Groom', 'Officiant']);
    expect(tightResult.cameras[0].subjectNames).toEqual(['Bride', 'Groom']);
    expect(wideTelemetry.cappedCameraCount).toBe(0);
    expect(tightTelemetry.cappedCameraCount).toBe(1);
  });

  it('includes named anchors in the user message when provided', () => {
    const service = buildService();

    const message = service['buildUserMessage']({
      momentName: 'Vows',
      activityName: 'Ceremony',
      floorplanObjects: [],
      subjects: [bride],
      cameras: [cameraOne],
      zones: [],
      anchors: [
        { name: 'altar_center', label: 'Altar', x: 500, y: 180, rotation: 180 },
        { name: 'aisle_start', label: 'Aisle entrance', x: 500, y: 820, rotation: 0 },
      ],
    });

    expect(message).toContain('Named anchors');
    expect(message).toContain('altar_center');
    expect(message).toContain('(500, 180)');
    expect(message).toContain('aisle_start');
  });

  it('synthesizes omitted movable subjects at their previous positions', () => {
    const service = buildService();

    const result = service['parseResponse'](
      JSON.stringify({
        momentDescription: 'Vows at the altar.',
        durationSeconds: 90,
        subjects: [
          { name: 'Bride', x: 450, y: 255, rotation: 180, actionDescription: 'speaks vows' },
        ],
        cameras: [
          { label: 'Camera 1', x: 500, y: 500, rotation: 0, subjectNames: ['Bride', 'Groom'] },
        ],
      }),
      [bride, groom],
      [cameraOne],
    );

    const synthesized = result.subjects.find((s) => s.name === 'Groom');
    expect(synthesized).toBeDefined();
    expect(synthesized).toEqual(
      expect.objectContaining({
        x: groom.prevX,
        y: groom.prevY,
        positionId: groom.positionId,
        daySubjectId: groom.daySubjectId,
      }),
    );
  });

  it('pushes subjects out of solid furniture via the shared collision resolver', () => {
    const service = buildService();
    const parsed = {
      momentDescription: '',
      durationSeconds: 60,
      subjects: [
        {
          name: 'Bride',
          x: 500,
          y: 250,
          rotation: 180,
          actionDescription: '',
          positionId: 1,
          daySubjectId: 1,
        },
      ],
      cameras: [] as never[],
    };
    const altar = { type: 'ALTAR', label: 'Altar', x: 440, y: 200, width: 120, height: 100, rotation: 0 };

    const telemetry = service['applyBlockingGuardrails'](
      parsed as never,
      [bride],
      [],
      [],
      [altar],
    );

    const subject = (parsed.subjects as Array<{ x: number; y: number }>)[0];
    const insideAltar =
      subject.x > altar.x && subject.x < altar.x + altar.width &&
      subject.y > altar.y && subject.y < altar.y + altar.height;
    expect(insideAltar).toBe(false);
    expect(telemetry.notices.some((n) => n.includes('Collision resolver'))).toBe(true);
  });

  it('leaves seeded subject positions untouched in blueprint mode', () => {
    const service = buildService();
    const parsed = {
      momentDescription: '',
      durationSeconds: 60,
      subjects: [
        {
          name: 'Bride',
          x: 500,
          y: 250,
          rotation: 180,
          actionDescription: '',
          positionId: 1,
          daySubjectId: 1,
        },
      ],
      cameras: [] as never[],
    };
    const altar = { type: 'ALTAR', label: 'Altar', x: 440, y: 200, width: 120, height: 100, rotation: 0 };

    service['applyBlockingGuardrails'](parsed as never, [bride], [], [], [altar], { isBlueprintMode: true });

    expect((parsed.subjects as Array<{ x: number; y: number }>)[0]).toEqual(
      expect.objectContaining({ x: 500, y: 250 }),
    );
  });

  it('widens camera FOV so every assigned subject fits inside the cone', () => {
    const service = buildService();
    // Subjects spread very wide relative to a close, narrow camera.
    const leftSubject = { ...bride, prevX: 200, prevY: 300 };
    const rightSubject = { ...groom, prevX: 800, prevY: 300 };
    const narrowCamera = { ...cameraOne, fovAngle: 30, prevX: 500, prevY: 420, baseX: 500, baseY: 420 };

    const cameras = service['postProcessCameras'](
      [
        {
          label: 'Camera 1',
          cameraPositionId: 201,
          x: 500,
          y: 420,
          rotation: 0,
          subjectNames: ['Bride', 'Groom'],
        },
      ] as never,
      [
        { name: 'Bride', x: 200, y: 300, rotation: 0, actionDescription: '', positionId: 1, daySubjectId: 1 },
        { name: 'Groom', x: 800, y: 300, rotation: 0, actionDescription: '', positionId: 2, daySubjectId: 2 },
      ] as never,
      [narrowCamera],
    );

    const cam = cameras[0];
    expect(cam.fovAngle).toBeDefined();
    expect(cam.fovAngle!).toBeGreaterThan(30);

    // Every subject must now sit inside the cone (with margin).
    const halfFov = cam.fovAngle! / 2;
    for (const s of [leftSubject, rightSubject]) {
      const angle = angleToPointDeg(cam.x, cam.y, s.prevX, s.prevY);
      const dev = Math.abs(((angle - cam.rotation + 540) % 360) - 180);
      expect(dev).toBeLessThanOrEqual(halfFov);
    }
  });

  it('filters blueprint blocking inputs to the authored moment cast', () => {
    const service = buildService();
    const filtered = service['filterSubjectsToBlueprintCast'](
      [bride, groom, officiant],
      [
        { roleName: 'Bride', actionText: 'exchanges vows' },
        { roleName: 'Groom', actionText: 'exchanges vows' },
        { roleName: 'Officiant', actionText: 'leads vows' },
      ],
    );
    expect(filtered.map((s) => s.name)).toEqual(['Bride', 'Groom', 'Officiant']);

    const processionalCast = service['filterSubjectsToBlueprintCast'](
      [bride, groom, officiant],
      [
        { roleName: 'Groom', actionText: 'waits at front' },
        { roleName: 'Officiant', actionText: 'welcomes party' },
      ],
    );
    expect(processionalCast.map((s) => s.name)).toEqual(['Groom', 'Officiant']);
  });

  it('skips blueprint narrative writes but persists subject positions in package mode', async () => {
    const tx = {
      packageActivityMoment: { update: jest.fn().mockResolvedValue(undefined) },
      spaceSlotMomentSubject: { upsert: jest.fn().mockResolvedValue(undefined) },
      spaceSlotMomentCamera: {
        upsert: jest.fn().mockResolvedValue(undefined),
        deleteMany: jest.fn().mockResolvedValue(undefined),
      },
      spaceSlotSubjectPosition: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const prisma = {
      $transaction: jest.fn(async (fn: (inner: typeof tx) => Promise<void>) => fn(tx)),
    };
    const service = new BlockingDirectorService(
      prisma as never,
      {} as never,
      {} as never,
      { load: jest.fn().mockReturnValue('') } as never,
    );
    const runLog = { log: jest.fn() };

    await service['writePackageMomentResults'](
      10,
      20,
      'Guests Arrive',
      {
        momentDescription: 'new description from blocking',
        durationSeconds: 90,
        subjects: [
          {
            name: 'Bride',
            x: 500,
            y: 200,
            rotation: 180,
            actionDescription: 'walks in',
            daySubjectId: 1,
            positionId: 11,
          },
        ],
        cameras: [
          {
            label: 'Camera 1',
            x: 700,
            y: 700,
            rotation: 0,
            subjectNames: ['Bride'],
            cameraPositionId: 21,
          },
        ],
      },
      [{ ...cameraOne, cameraPositionId: 21 }],
      runLog as any,
      { isBlueprintMode: true },
    );

    expect(tx.packageActivityMoment.update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: {
        camera_subject_plan: { 'Camera 1': ['Bride'] },
      },
    });
    expect(tx.spaceSlotMomentSubject.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          subject_position_id_moment_id: {
            subject_position_id: 11,
            moment_id: 10,
          },
        },
        create: expect.objectContaining({
          x: 500,
          y: 200,
          rotation: 180,
          present: true,
        }),
      }),
    );
  });

  it('keeps legacy package writes in full mode', async () => {
    const tx = {
      packageActivityMoment: { update: jest.fn().mockResolvedValue(undefined) },
      spaceSlotMomentSubject: { upsert: jest.fn().mockResolvedValue(undefined) },
      spaceSlotMomentCamera: {
        upsert: jest.fn().mockResolvedValue(undefined),
        deleteMany: jest.fn().mockResolvedValue(undefined),
      },
      spaceSlotSubjectPosition: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const prisma = {
      $transaction: jest.fn(async (fn: (inner: typeof tx) => Promise<void>) => fn(tx)),
    };
    const service = new BlockingDirectorService(
      prisma as never,
      {} as never,
      {} as never,
      { load: jest.fn().mockReturnValue('') } as never,
    );
    const runLog = { log: jest.fn() };

    await service['writePackageMomentResults'](
      11,
      20,
      'Guests Arrive',
      {
        momentDescription: 'new description from blocking',
        durationSeconds: 90,
        subjects: [
          {
            name: 'Bride',
            x: 500,
            y: 200,
            rotation: 180,
            actionDescription: 'walks in',
            daySubjectId: 1,
            positionId: 11,
          },
        ],
        cameras: [
          {
            label: 'Camera 1',
            x: 700,
            y: 700,
            rotation: 0,
            subjectNames: ['Bride'],
            cameraPositionId: 21,
          },
        ],
      },
      [{ ...cameraOne, cameraPositionId: 21 }],
      runLog as any,
      { isBlueprintMode: false },
    );

    expect(tx.packageActivityMoment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 11 },
        data: expect.objectContaining({
          description: 'new description from blocking',
          duration_seconds: 90,
          subject_actions: { Bride: 'walks in' },
          camera_subject_plan: { 'Camera 1': ['Bride'] },
        }),
      }),
    );
    expect(tx.spaceSlotMomentSubject.upsert).toHaveBeenCalled();
  });

  const unmannedDetailCam = {
    label: 'Camera 3',
    cameraPositionId: 203,
    prevX: 200,
    prevY: 500,
    prevRotation: 90,
    fovAngle: 60,
    isUnmanned: true,
    baseX: 200,
    baseY: 500,
    baseRotation: 90,
    shotType: 'MEDIUM_SHOT',
  };

  it('caps medium-shot editorial assignments to three subjects', () => {
    const service = buildService();
    const roster = Array.from({ length: 14 }, (_, i) => `Subject ${i + 1}`);

    const capped = service['capSubjectsByShot'](
      roster,
      { x: 500, y: 420, fovAngle: 60 },
      roster.map((name, index) => ({
        name,
        role: name,
        isGroup: false,
        count: 1,
        isFixedContextGroup: false,
        daySubjectId: index + 1,
        positionId: index + 1,
        prevX: 500,
        prevY: 200,
        prevRotation: 180,
        prevSeated: false,
      })),
      'MEDIUM_SHOT',
    );

    expect(capped).toHaveLength(3);
  });

  it('trims out-of-FOV targets on unmanned cameras instead of widening aim', () => {
    const service = buildService();
    const parsed = {
      momentDescription: 'Processional',
      durationSeconds: 120,
      subjects: [
        { name: 'Bride', x: 800, y: 300, rotation: 180, actionDescription: '', positionId: 1, daySubjectId: 1 },
        { name: 'Groom', x: 850, y: 300, rotation: 180, actionDescription: '', positionId: 2, daySubjectId: 2 },
        { name: 'Guests', x: 450, y: 390, rotation: 180, actionDescription: '', positionId: 3, daySubjectId: 79, seated: true },
      ],
      cameras: [
        {
          label: 'Camera 3',
          cameraPositionId: 203,
          x: 200,
          y: 500,
          rotation: 90,
          subjectNames: ['Bride', 'Groom', 'Guests', 'Officiant', 'Best Man', 'Maid of Honor', 'Father of Bride', 'Mother of Bride', 'Father of Groom', 'Mother of Groom', 'Bridesmaid 1', 'Bridesmaid 2', 'Groomsman 1', 'Groomsman 2'],
        },
      ],
    };

    service['applyBlockingGuardrails'](
      parsed,
      [bride, groom, fixedGuests, officiant],
      [unmannedDetailCam],
      [],
      [],
      { isBlueprintMode: true },
    );
    service['refineMomentAwareTargeting'](
      parsed,
      'Wedding Party Processional',
      [
        { roleName: 'Bride', actionText: 'Walks down the aisle' },
        { roleName: 'Groom', actionText: 'Walks down the aisle' },
      ],
      [bride, groom, fixedGuests, officiant],
      [unmannedDetailCam],
    );

    expect(parsed.cameras[0].subjectNames.length).toBeLessThanOrEqual(3);
    expect(parsed.cameras[0].subjectNames).not.toContain('Guests');
    expect(parsed.cameras[0].x).toBe(200);
    expect(parsed.cameras[0].y).toBe(500);
    expect(parsed.cameras[0].rotation).toBe(90);
  });

  it('refines processional targeting to moving subjects visible in FOV', () => {
    const service = buildService();
    const motherOfBride = {
      name: 'Mother of Bride',
      role: 'Mother of Bride',
      isGroup: false,
      count: 1,
      isFixedContextGroup: false,
      daySubjectId: 10,
      positionId: 10,
      prevX: 300,
      prevY: 600,
      prevRotation: 180,
      prevSeated: true,
    };
    const parsed = {
      momentDescription: 'Wedding Party Processional',
      durationSeconds: 120,
      subjects: [
        { name: 'Bride', x: 500, y: 400, rotation: 180, actionDescription: 'walks', positionId: 1, daySubjectId: 1 },
        { name: 'Groom', x: 540, y: 400, rotation: 180, actionDescription: 'walks', positionId: 2, daySubjectId: 2 },
        { name: 'Mother of Bride', x: 300, y: 600, rotation: 180, actionDescription: 'watches from pew', positionId: 10, daySubjectId: 10, seated: true },
      ],
      cameras: [
        {
          label: 'Camera 3',
          cameraPositionId: 203,
          x: 200,
          y: 500,
          rotation: 45,
          subjectNames: ['Bride', 'Groom', 'Mother of Bride'],
        },
      ],
    };

    service['refineMomentAwareTargeting'](
      parsed,
      'Wedding Party Processional',
      [
        { roleName: 'Bride', actionText: 'Walks down the aisle with escort' },
        { roleName: 'Groom', actionText: 'Waits at altar then joins processional' },
        { roleName: 'Mother of Bride', actionText: 'Observes from seated pew' },
      ],
      [bride, groom, motherOfBride],
      [unmannedDetailCam],
    );

    expect(parsed.cameras[0].subjectNames).not.toContain('Mother of Bride');
    expect(parsed.cameras[0].subjectNames.length).toBeGreaterThan(0);
    expect(parsed.cameras[0].subjectNames.length).toBeLessThanOrEqual(3);
  });

  it('validateAndTrimCameraVisibility attaches inferredShotType when unlocked', () => {
    const service = buildService();
    const inputCam = { ...cameraOne, shotType: null, shotTypeLocked: false };
    const subjectResult = {
      name: 'Bride',
      x: 502,
      y: 410,
      rotation: 180,
      actionDescription: '',
      positionId: 1,
      daySubjectId: 1,
    };

    const [trimmed] = service['validateAndTrimCameraVisibility'](
      [{
        label: 'Camera 1',
        cameraPositionId: 201,
        x: 500,
        y: 420,
        rotation: 0,
        subjectNames: ['Bride'],
      }],
      [subjectResult],
      [inputCam],
      [bride],
    );

    expect(trimmed.inferredShotType).toBeTruthy();
    expect(trimmed.inferredShotType).not.toBe('ESTABLISHING_SHOT');
  });

  it('validateAndTrimCameraVisibility keeps locked editorial shot for caps', () => {
    const service = buildService();
    const inputCam = { ...cameraOne, shotType: 'WIDE_SHOT', shotTypeLocked: true };
    const subjectResults = [
      { name: 'Bride', x: 502, y: 410, rotation: 180, actionDescription: '', positionId: 1, daySubjectId: 1 },
      { name: 'Groom', x: 498, y: 412, rotation: 180, actionDescription: '', positionId: 2, daySubjectId: 2 },
    ];

    const [trimmed] = service['validateAndTrimCameraVisibility'](
      [{
        label: 'Camera 1',
        cameraPositionId: 201,
        x: 500,
        y: 420,
        rotation: 0,
        subjectNames: ['Bride', 'Groom'],
      }],
      subjectResults,
      [inputCam],
      [bride, groom],
    );

    expect(trimmed.inferredShotType).toBe('WIDE_SHOT');
    expect(trimmed.subjectNames).toEqual(['Bride', 'Groom']);
  });

  it('writeResults persists inferred shot_type when assignment is unlocked', async () => {
    const update = jest.fn().mockResolvedValue(undefined);
    const tx = {
      sceneMoment: { update: jest.fn().mockResolvedValue(undefined) },
      filmSceneMomentSubject: { upsert: jest.fn().mockResolvedValue(undefined) },
      spaceSlotMomentCamera: { upsert: jest.fn().mockResolvedValue(undefined), deleteMany: jest.fn() },
      momentRecordingSetup: {
        findUnique: jest.fn().mockResolvedValue({
          id: 1,
          camera_assignments: [{
            id: 99,
            track_id: 1,
            shot_type: null,
            shot_type_locked: false,
            track: { name: 'Camera 1' },
          }],
        }),
      },
      cameraSubjectAssignment: { update },
    };
    const prisma = {
      $transaction: jest.fn(async (fn: (inner: typeof tx) => Promise<void>) => fn(tx)),
    };
    const service = new BlockingDirectorService(
      prisma as never,
      {} as never,
      {} as never,
      { load: jest.fn().mockReturnValue('') } as never,
    );
    const runLog = { log: jest.fn(), warn: jest.fn() };

    await service['writeResults'](
      5,
      null,
      {
        momentDescription: 'Test',
        durationSeconds: 60,
        subjects: [{ name: 'Bride', x: 500, y: 200, rotation: 180, actionDescription: '', daySubjectId: 1, positionId: 1 }],
        cameras: [{
          label: 'Camera 1',
          x: 500,
          y: 420,
          rotation: 0,
          subjectNames: ['Bride'],
          cameraPositionId: 201,
          inferredShotType: 'CLOSE_UP',
        }],
      },
      [cameraOne],
      runLog as any,
    );

    expect(update).toHaveBeenCalledWith({
      where: { id: 99 },
      data: {
        subject_ids: [1],
        shot_type: 'CLOSE_UP',
      },
    });
  });

  it('writeResults skips shot_type when assignment is locked', async () => {
    const update = jest.fn().mockResolvedValue(undefined);
    const tx = {
      sceneMoment: { update: jest.fn().mockResolvedValue(undefined) },
      filmSceneMomentSubject: { upsert: jest.fn().mockResolvedValue(undefined) },
      spaceSlotMomentCamera: { upsert: jest.fn().mockResolvedValue(undefined), deleteMany: jest.fn() },
      momentRecordingSetup: {
        findUnique: jest.fn().mockResolvedValue({
          id: 1,
          camera_assignments: [{
            id: 99,
            track_id: 1,
            shot_type: 'MEDIUM_SHOT',
            shot_type_locked: true,
            track: { name: 'Camera 1' },
          }],
        }),
      },
      cameraSubjectAssignment: { update },
    };
    const prisma = {
      $transaction: jest.fn(async (fn: (inner: typeof tx) => Promise<void>) => fn(tx)),
    };
    const service = new BlockingDirectorService(
      prisma as never,
      {} as never,
      {} as never,
      { load: jest.fn().mockReturnValue('') } as never,
    );
    const runLog = { log: jest.fn(), warn: jest.fn() };

    await service['writeResults'](
      5,
      null,
      {
        momentDescription: 'Test',
        durationSeconds: 60,
        subjects: [{ name: 'Bride', x: 500, y: 200, rotation: 180, actionDescription: '', daySubjectId: 1, positionId: 1 }],
        cameras: [{
          label: 'Camera 1',
          x: 500,
          y: 420,
          rotation: 0,
          subjectNames: ['Bride'],
          cameraPositionId: 201,
          inferredShotType: 'CLOSE_UP',
        }],
      },
      [cameraOne],
      runLog as any,
    );

    expect(update).toHaveBeenCalledWith({
      where: { id: 99 },
      data: { subject_ids: [1] },
    });
  });
});