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
});
