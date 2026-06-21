import { buildPendingMomentsByActivity } from './day-blueprint-pending-moments';
import { sanitizeStreamingMomentDisplayName } from './day-blueprint-streaming-moment-name';
import type { DayBlueprintAiProgressEvent } from '../hooks/ai';
import type { DayBlueprintVersionDetail } from '../types';

const VERSION = {
  days: [
    {
      id: 1,
      activities: [
        { id: 101, name: 'Ceremony' },
        { id: 102, name: 'Reception' },
      ],
    },
  ],
} as unknown as DayBlueprintVersionDetail;

function streamingEvent(overrides: Partial<DayBlueprintAiProgressEvent['data']> = {}, base: Partial<DayBlueprintAiProgressEvent> = {}): DayBlueprintAiProgressEvent {
  return {
    versionId: 20,
    runId: 999,
    step: 'moment-streaming',
    label: 'streaming',
    status: 'started',
    emittedAt: new Date().toISOString(),
    stepIndex: 1,
    totalSteps: 4,
    data: {
      eventKind: 'moment-streaming',
      activityName: 'Ceremony',
      momentOrderIndex: 0,
      momentName: 'Processional',
      previewKey: '999:a0:s:0:i0',
      generationAttempt: 0,
      ...overrides,
    },
    ...base,
  };
}

describe('sanitizeStreamingMomentDisplayName', () => {
  it('strips trailing (Generating...) style suffixes', () => {
    expect(sanitizeStreamingMomentDisplayName('Guests arrive (Generating...)')).toBe('Guests arrive');
    expect(sanitizeStreamingMomentDisplayName('Vows (Generating…)')).toBe('Vows');
    expect(sanitizeStreamingMomentDisplayName('  Plain title  ')).toBe('Plain title');
  });
});

describe('buildPendingMomentsByActivity', () => {
  it('returns empty when not generating', () => {
    expect(buildPendingMomentsByActivity([streamingEvent()], VERSION, false)).toEqual({});
  });

  it('keys rows by (activityId, momentOrderIndex) so retries replace prior attempts', () => {
    const events: DayBlueprintAiProgressEvent[] = [
      streamingEvent({ momentOrderIndex: 0, momentName: 'Processional', previewKey: '999:a0:s:0:i0', generationAttempt: 0 }),
      streamingEvent({ momentOrderIndex: 1, momentName: 'Vows', previewKey: '999:a0:s:0:i1', generationAttempt: 0 }),
      // attempt 1 retries with different names for the same slots.
      streamingEvent({ momentOrderIndex: 0, momentName: 'Processional Start', previewKey: '999:a1:s:0:i0', generationAttempt: 1 }),
      streamingEvent({ momentOrderIndex: 1, momentName: 'Vows Exchange', previewKey: '999:a1:s:0:i1', generationAttempt: 1 }),
    ];

    const pending = buildPendingMomentsByActivity(events, VERSION, true);
    expect(pending[101]?.length).toBe(2);
    expect(pending[101]?.map((row) => row.name)).toEqual(['Processional Start', 'Vows Exchange']);
  });

  it('discards out-of-order events from a stale attempt', () => {
    const events: DayBlueprintAiProgressEvent[] = [
      streamingEvent({ momentOrderIndex: 0, momentName: 'Processional', previewKey: '999:a0:s:0:i0', generationAttempt: 0 }),
      streamingEvent({ momentOrderIndex: 0, momentName: 'Processional Start', previewKey: '999:a1:s:0:i0', generationAttempt: 1 }),
      // late-arriving attempt-0 event should NOT clobber attempt 1.
      streamingEvent({ momentOrderIndex: 0, momentName: 'Processional', previewKey: '999:a0:s:0:i0', generationAttempt: 0 }),
    ];
    const pending = buildPendingMomentsByActivity(events, VERSION, true);
    expect(pending[101]?.[0]?.name).toBe('Processional Start');
  });

  it('absorbs moment-streaming-duration events to update the duration cell', () => {
    const events: DayBlueprintAiProgressEvent[] = [
      streamingEvent({ momentOrderIndex: 0, momentName: 'Processional', previewKey: '999:a0:s:0:i0', generationAttempt: 0 }),
      streamingEvent(
        {
          eventKind: 'moment-streaming-duration',
          momentOrderIndex: 0,
          momentName: undefined,
          previewKey: '999:a0:s:0:i0',
          previewDurationSeconds: 240,
          generationAttempt: 0,
        },
      ),
    ];
    const pending = buildPendingMomentsByActivity(events, VERSION, true);
    expect(pending[101]?.[0]?.name).toBe('Processional');
    expect(pending[101]?.[0]?.durationSeconds).toBe(240);
  });

  it('ignores duration-only events for slots we have not seen yet', () => {
    const events: DayBlueprintAiProgressEvent[] = [
      streamingEvent(
        {
          eventKind: 'moment-streaming-duration',
          momentOrderIndex: 0,
          momentName: undefined,
          previewKey: '999:a0:s:0:i0',
          previewDurationSeconds: 240,
          generationAttempt: 0,
        },
      ),
    ];
    expect(buildPendingMomentsByActivity(events, VERSION, true)[101]).toBeUndefined();
  });

  it('strips (Generating...) from streamed moment names', () => {
    const events: DayBlueprintAiProgressEvent[] = [
      streamingEvent({ momentOrderIndex: 0, momentName: 'Processional (Generating...)', previewKey: 'k0', generationAttempt: 0 }),
    ];
    const pending = buildPendingMomentsByActivity(events, VERSION, true);
    expect(pending[101]?.[0]?.name).toBe('Processional');
  });

  it('orders rows by orderIndex within each activity', () => {
    const events: DayBlueprintAiProgressEvent[] = [
      streamingEvent({ momentOrderIndex: 2, momentName: 'C', previewKey: 'k2', generationAttempt: 0 }),
      streamingEvent({ momentOrderIndex: 0, momentName: 'A', previewKey: 'k0', generationAttempt: 0 }),
      streamingEvent({ momentOrderIndex: 1, momentName: 'B', previewKey: 'k1', generationAttempt: 0 }),
    ];
    const pending = buildPendingMomentsByActivity(events, VERSION, true);
    expect(pending[101]?.map((row) => row.name)).toEqual(['A', 'B', 'C']);
  });
});
