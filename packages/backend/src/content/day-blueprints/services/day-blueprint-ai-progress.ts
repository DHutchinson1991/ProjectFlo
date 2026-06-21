import { type PrismaService } from '../../../platform/prisma/prisma.service';
import { type DayBlueprintAiEventData, type DayBlueprintAiEventsService } from './day-blueprint-ai-events.service';

export async function updateRunProgress(
  prisma: PrismaService,
  aiEvents: DayBlueprintAiEventsService,
  versionId: number,
  runId: number,
  event: { step: string; label: string; status: 'started' | 'completed' | 'failed'; stepIndex: number; totalSteps: number; data?: DayBlueprintAiEventData },
): Promise<void> {
  await prisma.dayBlueprintAiRun.update({
    where: { id: runId },
    data: { prompt_summary: event.label },
  });
  aiEvents.emit({ versionId, runId, ...event });
}
