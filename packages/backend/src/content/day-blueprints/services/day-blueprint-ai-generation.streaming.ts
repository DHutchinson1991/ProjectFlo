import { type GemmaService } from '../../../ai/gemma/gemma.service';
import { type DayBlueprintAiEventsService } from './day-blueprint-ai-events.service';
import { type DayBlueprintAiRunLogger } from './day-blueprint-ai-run-logger';
import { DayPlanStreamParser } from './day-blueprint-stream-parser';
import { type DayBlueprintGemmaRequest } from './day-blueprint-ai.types';

export async function callGemmaStreaming(args: {
  gemma: GemmaService;
  aiEvents: DayBlueprintAiEventsService;
  request: DayBlueprintGemmaRequest;
  runLogger: DayBlueprintAiRunLogger;
  versionId: number;
  runId: number;
  dayId: number;
  signal?: AbortSignal;
  onParserError?: (message: string) => void;
}): Promise<{ reply: string; response: Awaited<ReturnType<GemmaService['chat']>> }> {
  const { gemma, aiEvents, request, runLogger, versionId, runId, dayId, signal, onParserError } = args;
  const seenActivities = new Set<number>();
  const seenMoments = new Set<string>();
  const previewKeyFor = (activityIndex: number, momentIndex: number) =>
    `${runId}:a0:s:${activityIndex}:i${momentIndex}`;
  const parser = new DayPlanStreamParser({
    onActivityStart: ({ index, name }) => {
      if (seenActivities.has(index)) return;
      seenActivities.add(index);
      aiEvents.emit({
        versionId,
        runId,
        step: 'outline-streaming',
        label: `Outlining: ${name}`,
        status: 'started',
        stepIndex: 0,
        totalSteps: 4,
        data: {
          eventKind: 'activity-streaming',
          dayId,
          activityName: name,
          generationAttempt: 0,
        },
      });
    },
    onMomentStart: ({ activityIndex, activityName, index, name }) => {
      const key = `${activityIndex}:${index}`;
      if (seenMoments.has(key)) return;
      seenMoments.add(key);
      aiEvents.emit({
        versionId,
        runId,
        step: 'moment-streaming',
        label: `Streaming moment: ${name}`,
        status: 'started',
        stepIndex: 0,
        totalSteps: 4,
        data: {
          eventKind: 'moment-streaming',
          dayId,
          activityName,
          momentName: name,
          momentOrderIndex: index,
          previewKey: previewKeyFor(activityIndex, index),
          generationAttempt: 0,
        },
      });
    },
    onMomentDuration: ({ activityIndex, activityName, index, durationSeconds }) => {
      aiEvents.emit({
        versionId,
        runId,
        step: 'moment-streaming',
        label: `Streaming duration: ${activityName} → ${index + 1}`,
        status: 'started',
        stepIndex: 0,
        totalSteps: 4,
        data: {
          eventKind: 'moment-streaming-duration',
          dayId,
          activityName,
          momentOrderIndex: index,
          previewDurationSeconds: durationSeconds,
          previewKey: previewKeyFor(activityIndex, index),
          generationAttempt: 0,
        },
      });
    },
  });

  const response = await gemma.chatStream(request.chat, {
    signal,
    onTextDelta: (delta) => {
      try {
        parser.feed(delta);
      } catch (err) {
        onParserError?.((err as Error).message);
      }
    },
  });
  runLogger.writeLlmResponse(response);
  return { reply: response.reply, response };
}
