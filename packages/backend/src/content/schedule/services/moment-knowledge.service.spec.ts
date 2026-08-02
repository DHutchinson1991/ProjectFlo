import { MomentKnowledgeService } from './moment-knowledge.service';

describe('MomentKnowledgeService', () => {
  it('filters getting-ready templates to the subjects assigned to the activity', async () => {
    const prisma = {
      packageActivity: {
        findUnique: jest
          .fn()
          .mockResolvedValueOnce({
            id: 7,
            name: 'Groom Prep',
            description: 'Groom prep in the suite',
            duration_minutes: 30,
            package_id: 44,
            package: { brand_id: 1 },
          }),
      },
      packageActivityMoment: {
        findMany: jest.fn().mockResolvedValue([]),
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      momentKnowledgeBase: {
        findMany: jest
          .fn()
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([
            {
              category: 'Getting Ready',
              variant: 'Traditional',
              reference_duration_minutes: 75,
              entries: [
                {
                  name: "Bride's Hair & Makeup",
                  description: 'Bride getting ready',
                  subject_actions: { Bride: 'hair and makeup' },
                  default_duration_seconds: 1200,
                  min_duration_seconds: 600,
                  max_duration_seconds: 1800,
                },
                {
                  name: 'Groom Getting Ready',
                  description: 'Groom adjusts tie',
                  subject_actions: { Groom: 'adjusting tie' },
                  default_duration_seconds: 900,
                  min_duration_seconds: 300,
                  max_duration_seconds: 1200,
                },
              ],
            },
          ]),
      },
      packageDaySubjectActivity: {
        findMany: jest.fn().mockResolvedValue([
          {
            package_day_subject: {
              id: 101,
              name: 'Groom',
              role_template: { role_name: 'Groom', is_group: false },
            },
          },
          {
            package_day_subject: {
              id: 102,
              name: 'Best Man',
              role_template: { role_name: 'Best Man', is_group: false },
            },
          },
        ]),
      },
    };

    const service = new MomentKnowledgeService(prisma as any, undefined as any);

    await service.ensureActivityMoments(7);

    expect(prisma.packageActivityMoment.createMany).toHaveBeenCalledTimes(1);
    const payload = prisma.packageActivityMoment.createMany.mock.calls[0][0].data;
    expect(payload).toHaveLength(1);
    expect(payload[0].name).toBe('Groom Getting Ready');
  });

  it('mirrors legacy subject_actions JSON when normalized actions are absent', async () => {
    const tx = {
      sceneMoment: {
        create: jest.fn().mockResolvedValue({ id: 501 }),
      },
      filmSceneMomentSubject: {
        createMany: jest.fn().mockResolvedValue({ count: 2 }),
      },
    };

    const prisma = {
      filmScene: {
        findUnique: jest.fn().mockResolvedValue({ id: 9, mode: 'SCENE' }),
      },
      sceneMoment: {
        count: jest.fn().mockResolvedValue(0),
      },
      packageActivityMoment: {
        count: jest.fn().mockResolvedValue(1),
        findMany: jest.fn().mockResolvedValue([
          {
            id: 88,
            name: 'First Look',
            description: 'Couple sees each other',
            order_index: 0,
            duration_seconds: 300,
            subject_actions: {
              Bride: { action: 'walks toward groom', focal: 'PRIMARY' },
              Groom: { action: 'turns to see bride', focal: 'SECONDARY' },
            },
            actions: [],
          },
        ]),
      },
      packageActivity: {
        findUnique: jest.fn().mockResolvedValue({ id: 7, package_id: 44 }),
      },
      packageDaySubjectActivity: {
        findMany: jest.fn().mockResolvedValue([
          {
            package_day_subject: {
              id: 101,
              name: 'Bride',
              role_template: { role_name: 'Bride', is_group: false },
            },
          },
          {
            package_day_subject: {
              id: 102,
              name: 'Groom',
              role_template: { role_name: 'Groom', is_group: false },
            },
          },
        ]),
      },
      $transaction: jest.fn(async (callback: (client: typeof tx) => Promise<void>) => callback(tx)),
    };

    const service = new MomentKnowledgeService(prisma as any, undefined as any);

    await service.ensureSceneMomentsForActivity(9, 7);

    expect(tx.filmSceneMomentSubject.createMany).toHaveBeenCalledTimes(1);
    const payload = tx.filmSceneMomentSubject.createMany.mock.calls[0][0].data;
    expect(payload).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          subject_id: 101,
          action_description: 'walks toward groom',
          priority: 'PRIMARY',
        }),
        expect.objectContaining({
          subject_id: 102,
          action_description: 'turns to see bride',
          priority: 'SECONDARY',
        }),
      ]),
    );
  });
});
