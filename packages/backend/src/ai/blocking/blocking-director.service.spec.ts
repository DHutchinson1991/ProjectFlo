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
});