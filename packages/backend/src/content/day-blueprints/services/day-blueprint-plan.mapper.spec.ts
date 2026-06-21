import { markKeyMomentByLongest } from './day-blueprint-plan.mapper';
import { type GeneratedActivity } from './day-blueprint-ai.types';

describe('markKeyMomentByLongest', () => {
  it('marks the longest moment as the key moment, earliest wins on tie', () => {
    const activity: GeneratedActivity = {
      name: 'Ceremony',
      moments: [
        { name: 'A', duration_seconds: 200 },
        { name: 'B', duration_seconds: 600 },
        { name: 'C', duration_seconds: 600 },
      ],
    };
    const result = markKeyMomentByLongest(activity);
    expect(result.moments?.map((m) => m.is_key_moment)).toEqual([false, true, false]);
  });

  it('handles activities with no moments without throwing', () => {
    expect(() => markKeyMomentByLongest({ name: 'Empty' })).not.toThrow();
  });
});
