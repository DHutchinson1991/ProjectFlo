import { ActivitySubjectAssignmentStep, type SubjectAssignmentInput } from './activity-subject-assignment.step';

describe('ActivitySubjectAssignmentStep', () => {
  it('keeps ceremony activities universal even when the model omits wedding-party members', async () => {
    const gemma = {
      chat: jest.fn().mockResolvedValue({
        reply: JSON.stringify({
          activities: [
            {
              activityId: 2,
              activityName: 'Ceremony',
              reasoning: 'Everyone important is present.',
              assignedSubjects: ['Bride', 'Groom', 'Best Man', 'Officiant', 'Guests'],
            },
          ],
        }),
        model: 'test-model',
        usage: {},
      }),
    };

    const skills = {
      load: jest.fn().mockReturnValue('skill prompt'),
    };

    const step = new ActivitySubjectAssignmentStep(gemma as any, skills as any);

    const input: SubjectAssignmentInput = {
      eventType: 'Wedding',
      activities: [{ id: 2, name: 'Ceremony', description: 'Traditional wedding ceremony', durationMinutes: 45 }],
      subjects: [
        { name: 'Bride', role: 'Bride', isGroup: false },
        { name: 'Groom', role: 'Groom', isGroup: false },
        { name: 'Best Man', role: 'Best Man', isGroup: false },
        { name: 'Maid of Honor', role: 'Maid of Honor', isGroup: false },
        { name: 'Groomsmen', role: 'Groomsmen', isGroup: true },
        { name: 'Guests', role: 'Guests', isGroup: true },
        { name: 'Officiant', role: 'Officiant', isGroup: false },
      ],
    };

    const result = await step.execute(input);
    expect(result.activities).toHaveLength(1);
    expect(result.activities[0].assignedSubjects).toEqual(
      expect.arrayContaining(['Bride', 'Groom', 'Best Man', 'Maid of Honor', 'Groomsmen', 'Guests', 'Officiant']),
    );
  });
});
