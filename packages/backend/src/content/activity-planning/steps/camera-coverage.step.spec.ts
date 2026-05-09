import { CameraCoverageInput, CameraCoverageStep } from './camera-coverage.step';

describe('CameraCoverageStep', () => {
  const buildInput = (): CameraCoverageInput => ({
    activityName: 'Ceremony',
    cameras: [
      { trackLabel: 'Camera 1', isUnmanned: true },
      { trackLabel: 'Camera 2', isUnmanned: true },
    ],
    moments: [
      {
        momentIndex: 0,
        momentName: 'Vows',
        description: 'Bride and groom exchange vows',
        subjects: [
          { name: 'Bride', focal: 'PRIMARY', isGroup: false },
          { name: 'Groom', focal: 'PRIMARY', isGroup: false },
          { name: 'Guests', focal: 'BACKGROUND', isGroup: true },
        ],
      },
    ],
  });

  it('keeps static close ups for unmanned cameras and remaps tracking to a static equivalent', async () => {
    const gemma = {
      chat: jest.fn().mockResolvedValue({
        reply: JSON.stringify({
          moments: [
            {
              momentIndex: 0,
              cameras: [
                {
                  trackLabel: 'Camera 1',
                  active: true,
                  shotType: 'CLOSE_UP',
                  coverageNotes: 'Lock on the bride during vows.',
                  targetSubjects: ['Bride'],
                },
                {
                  trackLabel: 'Camera 2',
                  active: true,
                  shotType: 'TRACKING',
                  coverageNotes: 'Follow the groom reaction.',
                  targetSubjects: ['Groom'],
                },
              ],
            },
          ],
        }),
        model: 'test-model',
        usage: {},
      }),
    };
    const skills = {
      load: jest.fn().mockReturnValue('camera coverage prompt'),
    };
    const step = new CameraCoverageStep(gemma as never, skills as never);

    const result = await step.execute(buildInput());

    expect(result.moments).toHaveLength(1);
    expect(result.moments[0].cameras).toEqual([
      expect.objectContaining({
        trackLabel: 'Camera 1',
        active: true,
        shotType: 'CLOSE_UP',
        targetSubjects: ['Bride'],
      }),
      expect.objectContaining({
        trackLabel: 'Camera 2',
        active: true,
        shotType: 'CLOSE_UP',
        targetSubjects: ['Groom'],
      }),
    ]);
  });
});
