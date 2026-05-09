import { DayPlanStreamParser } from './day-blueprint-stream-parser';

describe('DayPlanStreamParser', () => {
  function feedInChunks(parser: DayPlanStreamParser, text: string, chunkSize: number) {
    for (let i = 0; i < text.length; i += chunkSize) {
      parser.feed(text.slice(i, i + chunkSize));
    }
  }

  const sample = JSON.stringify({
    activities: [
      {
        name: 'Morning Preparation',
        description: 'Bride and groom prepare separately',
        moments: [
          { name: 'Hair and Makeup', duration_seconds: 1200 },
          { name: 'First Look', duration_seconds: 600 },
        ],
      },
      {
        name: 'Ceremony Coverage',
        moments: [{ name: 'Vows', duration_seconds: 900 }],
      },
    ],
  });

  it('emits activity and moment names as the JSON streams in', () => {
    const activities: { index: number; name: string }[] = [];
    const moments: { activityIndex: number; activityName: string; index: number; name: string }[] = [];
    const parser = new DayPlanStreamParser({
      onActivityStart: (a) => activities.push(a),
      onMomentStart: (m) => moments.push(m),
    });

    feedInChunks(parser, sample, 7);

    expect(activities).toEqual([
      { index: 0, name: 'Morning Preparation' },
      { index: 1, name: 'Ceremony Coverage' },
    ]);
    expect(moments).toEqual([
      { activityIndex: 0, activityName: 'Morning Preparation', index: 0, name: 'Hair and Makeup' },
      { activityIndex: 0, activityName: 'Morning Preparation', index: 1, name: 'First Look' },
      { activityIndex: 1, activityName: 'Ceremony Coverage', index: 0, name: 'Vows' },
    ]);
  });

  it('handles escapes and braces inside strings without false matches', () => {
    const tricky = JSON.stringify({
      activities: [
        {
          name: 'Trick "{}" }] activity',
          moments: [{ name: 'Has\nnewline', duration_seconds: 30 }],
        },
      ],
    });
    const moments: string[] = [];
    const activities: string[] = [];
    const parser = new DayPlanStreamParser({
      onActivityStart: (a) => activities.push(a.name),
      onMomentStart: (m) => moments.push(m.name),
    });
    feedInChunks(parser, tricky, 3);
    expect(activities).toEqual(['Trick "{}" }] activity']);
    expect(moments).toEqual(['Has\nnewline']);
  });

  it('does not emit duplicates when reordered keys appear before name', () => {
    const reordered = JSON.stringify({
      activities: [
        {
          description: 'desc first',
          moments: [{ duration_seconds: 60, name: 'Late name' }],
          name: 'Activity Name Last',
        },
      ],
    });
    const activities: string[] = [];
    const moments: string[] = [];
    const parser = new DayPlanStreamParser({
      onActivityStart: (a) => activities.push(a.name),
      onMomentStart: (m) => moments.push(m.name),
    });
    feedInChunks(parser, reordered, 5);
    expect(activities).toEqual(['Activity Name Last']);
    expect(moments).toEqual(['Late name']);
  });
});
