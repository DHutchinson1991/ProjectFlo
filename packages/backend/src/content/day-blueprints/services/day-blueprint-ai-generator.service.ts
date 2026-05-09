import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DayBlueprintActionEmphasis, DayBlueprintPlacementFacing, DayBlueprintPlacementPosition, Prisma } from '@prisma/client';
import { GemmaService } from '../../../ai/gemma/gemma.service';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { DayBlueprintVersionsService } from './day-blueprint-versions.service';
import { DayBlueprintAiEventData, DayBlueprintAiEventsService } from './day-blueprint-ai-events.service';
import { DayBlueprintSpatialGeneratorService } from './day-blueprint-spatial-generator.service';
import { DayPlanStreamParser } from './day-blueprint-stream-parser';
import {
  DayBlueprintAiKnowledgeReport,
  DayBlueprintAiRunLogger,
  DayBlueprintAiRunLoggerFactory,
} from './day-blueprint-ai-run-logger';

type GemmaChatRequest = Parameters<GemmaService['chat']>[0];

/**
 * Server-side AI generator for a single Day inside a DayBlueprint
 * version. Calls Gemma with a strict JSON schema, then fills
 * moments, subject actions, and spatial placements for the day's
 * existing activities. Activity rows are never created or deleted by
 * the AI — they are always authored manually. Records a
 * `DayBlueprintAiRun` row so the AI runs panel reflects history.
 */
@Injectable()
export class DayBlueprintAiGeneratorService {
  private readonly logger = new Logger(DayBlueprintAiGeneratorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly versions: DayBlueprintVersionsService,
    private readonly gemma: GemmaService,
    private readonly aiEvents: DayBlueprintAiEventsService,
    private readonly spatialGenerator: DayBlueprintSpatialGeneratorService,
    private readonly runLoggerFactory: DayBlueprintAiRunLoggerFactory = new DayBlueprintAiRunLoggerFactory(),
  ) {}

  async generateDay(
    versionId: number,
    dayId: number,
    options: { prompt?: string; activityId?: number },
  ): Promise<{
    runId: number;
    momentsCreated: number;
    actionsCreated: number;
    placementsCreated: number;
    momentsWithCoverage: number;
  }> {
    await this.versions.assertDraft(versionId);

    const day = await this.prisma.dayBlueprintDay.findUnique({
      where: { id: dayId },
      include: {
        version: {
          include: {
            day_blueprint: true,
            subject_roles: {
              include: { subject_role: true },
              orderBy: { order_index: 'asc' },
            },
          },
        },
        activities: {
          select: { id: true, name: true, order_index: true, default_duration_minutes: true },
          orderBy: { order_index: 'asc' },
        },
      },
    });
    if (!day) throw new NotFoundException('Day not found');
    if (day.day_blueprint_version_id !== versionId) {
      throw new BadRequestException('Day does not belong to this version');
    }
    if (options.activityId && !day.activities.some((activity) => activity.id === options.activityId)) {
      throw new BadRequestException('Selected activity does not belong to this day');
    }
    if (day.activities.length === 0) {
      throw new BadRequestException(
        'Add at least one activity before running AI — the AI fills moments for existing activities only.',
      );
    }

    const blueprint = day.version.day_blueprint;
    const promptSummary = (options.prompt ?? '').slice(0, 2000) || `Generate ${day.name}`;
    const runLogger = this.runLoggerFactory.create({
      brandId: blueprint.brand_id,
      blueprintId: blueprint.id,
      blueprintName: blueprint.display_name,
      versionId,
      dayId,
      dayName: day.name,
      route: `/api/day-blueprints/versions/${versionId}/days/${dayId}/ai-generate`,
    });

    const run = await this.prisma.dayBlueprintAiRun.create({
      data: {
        day_blueprint_version_id: versionId,
        run_kind: 'GENERATE',
        status: 'RUNNING',
        run_key: runLogger.getRunId(),
        prompt_summary: `${promptSummary} · Filling moments, subject actions, and spatial placements`,
        started_at: new Date(),
      },
    });
    runLogger.attachDatabaseRun(run.id);

    const cancelController = this.aiEvents.registerRun(run.id);
    const checkCancelled = () => {
      if (cancelController.signal.aborted) {
        const err = new Error('CANCELLED_BY_USER');
        (err as Error & { isCancellation?: boolean }).isCancellation = true;
        throw err;
      }
    };

    try {
      await this.updateRunProgress(versionId, run.id, {
        step: 'llm-request',
        label: 'Calling Day Designer AI for complete moment coverage',
        status: 'started',
        stepIndex: 0,
        totalSteps: 4,
      });
      const gemmaContext = {
        eventCategory: blueprint.event_category,
        blueprintName: blueprint.display_name,
        dayName: day.name,
        dayDescription: day.description,
        existingActivities: day.activities.map((a) => ({
          name: a.name,
          durationSeconds: a.default_duration_minutes != null ? a.default_duration_minutes * 60 : null,
        })),
        subjectRoles: day.version.subject_roles.map((link) => link.subject_role.role_name),
        userPrompt: options.prompt,
      };

      const activityQualityTargets = buildActivityQualityTargets(day.activities, options.activityId ?? null);
      let gemmaRequest = this.buildGemmaRequest(gemmaContext);
      let generation: DayBlueprintGemmaResult | null = null;
      let coverageIssues: ActivityCoverageIssue[] = [];

      for (let attempt = 0; attempt < 2; attempt += 1) {
        runLogger.writeRequest({
          context: {
            ...gemmaContext,
            attempt,
            coverageTargets: activityQualityTargets,
          },
          request: gemmaRequest.chat,
          userMessageChars: gemmaRequest.userMessage.length,
        });

        generation = await this.callGemma(gemmaRequest, runLogger, {
          versionId,
          runId: run.id,
          dayId,
          signal: cancelController.signal,
        });
        coverageIssues = collectCoverageIssues(generation.plan.activities, activityQualityTargets);
        if (coverageIssues.length === 0) break;
        if (attempt === 1) break;

        const retryHint = buildCoverageRetryHint(coverageIssues);
        this.logger.warn(`AI coverage retry requested for day ${dayId}: ${retryHint}`);

        await this.updateRunProgress(versionId, run.id, {
          step: 'llm-request',
          label: `Retrying Day Designer AI for fuller coverage (${coverageIssues.length} gap${coverageIssues.length === 1 ? '' : 's'})`,
          status: 'started',
          stepIndex: 0,
          totalSteps: 4,
          data: {
            eventKind: 'summary',
            dayId,
            activityId: options.activityId,
          },
        });

        gemmaRequest = this.buildGemmaRequest({
          ...gemmaContext,
          qualityRetryHint: retryHint,
        });
      }

      if (!generation) {
        throw new Error('Day Designer AI did not return a generation payload');
      }

      await this.updateRunProgress(versionId, run.id, {
        step: 'normalize',
        label: 'Preparing activity slots and building subject role map',
        status: 'started',
        stepIndex: 1,
        totalSteps: 4,
      });
      const aiActivities = generation.plan.activities;

      if (coverageIssues.length > 0) {
        this.logger.warn(
          `AI coverage still below target for day ${dayId} after retry: ${buildCoverageRetryHint(coverageIssues)}`,
        );
      }

      const plannedReport = buildKnowledgeReport({
        runLogger,
        dbRunId: run.id,
        status: 'running',
        brandId: blueprint.brand_id,
        blueprintId: blueprint.id,
        blueprintName: blueprint.display_name,
        versionId,
        dayId,
        dayName: day.name,
        promptSummary,
        promptChars: gemmaRequest.userMessage.length,
        response: generation.response,
        activities: aiActivities,
      });
      runLogger.writeReport(plannedReport);

      const result = await this.prisma.$transaction(async (tx) => {
        let momentsCreated = 0;
        let actionsCreated = 0;
        let placementsCreated = 0;
        let momentsWithCoverage = 0;
        let wroteSelectedActivity = false;

        const roleCatalog = await tx.dayBlueprintSubjectRole.findMany({
          where: { day_blueprint_version_id: versionId },
          include: { subject_role: true },
          orderBy: { order_index: 'asc' },
        });
        const roleByName = new Map(roleCatalog.map((link) => [normalizeRoleName(link.subject_role.role_name), link]));
        const fallbackRoles = roleCatalog.slice(0, 4);

        // Build lookup so AI activity names can be matched to DB rows.
        const activityByName = new Map(
          day.activities.map((a) => [normalizeRoleName(a.name), a]),
        );

        const targetActivityIds = options.activityId
          ? [options.activityId]
          : day.activities.map((activity) => activity.id);

        // Replace existing moments in scope before writing new ones.
        await tx.dayBlueprintMoment.deleteMany({
          where: { day_blueprint_activity_id: { in: targetActivityIds } },
        });

        for (const a of aiActivities) {
          const existing = activityByName.get(normalizeRoleName(a.name));
          if (!existing) {
            this.logger.warn(`AI returned unknown activity "${a.name}" for day ${dayId} — skipping`);
            continue;
          }
          if (options.activityId && existing.id !== options.activityId) {
            continue;
          }
          if (options.activityId && existing.id === options.activityId) {
            wroteSelectedActivity = true;
          }

          // Update description if the AI provided one; leave other fields untouched.
          if (a.description) {
            await tx.dayBlueprintActivity.update({
              where: { id: existing.id },
              data: { description: a.description.slice(0, 2000) },
            });
          }

          const activitySpaceSlot = await this.findActivitySpaceSlot(tx, versionId, existing.id, a.name);

          const moments = a.moments ?? [];
          for (let j = 0; j < moments.length; j++) {
            checkCancelled();
            const m = moments[j];
            const momentNoSpatial = Boolean(m.no_spatial);
            const coverage = resolveMomentCoverage(m, roleByName, fallbackRoles);
            const previewDurationSeconds = clampInt(m.duration_seconds, 5, 3600) ?? 60;
            const previewKey = `${run.id}:${existing.id}:${j}:${stableKey(m.name).slice(0, 40)}`;

            this.aiEvents.emit({
              versionId,
              runId: run.id,
              step: 'moment-preview',
              label: `Planning ${a.name} → ${m.name}`,
              status: 'started',
              stepIndex: 2,
              totalSteps: 4,
              data: {
                eventKind: 'moment-preview',
                dayId,
                activityId: existing.id,
                activityName: a.name,
                momentName: m.name,
                momentOrderIndex: j,
                previewDurationSeconds,
                previewActionCount: coverage.length,
                previewPlacementCount: activitySpaceSlot && !momentNoSpatial ? coverage.length : 0,
                previewKey,
                momentsCreated,
                actionsCreated,
                placementsCreated,
                momentsWithCoverage,
              },
            });

            const createdMoment = await tx.dayBlueprintMoment.create({
              data: {
                day_blueprint_activity_id: existing.id,
                name: m.name.slice(0, 200),
                description: m.description?.slice(0, 2000),
                duration_seconds: previewDurationSeconds,
                order_index: j,
                is_key_moment: Boolean(m.is_key_moment),
                criticality: 'STANDARD',
                lock_flags: momentNoSpatial ? ({ no_spatial: true } as Prisma.InputJsonValue) : undefined,
              },
            });
            momentsCreated += 1;
            if (coverage.length > 0) momentsWithCoverage += 1;

            for (let k = 0; k < coverage.length; k++) {
              const item = coverage[k];
              await tx.dayBlueprintMomentAction.create({
                data: {
                  day_blueprint_moment_id: createdMoment.id,
                  subject_role_id: item.subjectRoleId,
                  action_text: item.actionText.slice(0, 2000),
                  emphasis: item.emphasis,
                  notes: item.notes?.slice(0, 1000),
                  order_index: k,
                },
              });
              actionsCreated += 1;

              if (activitySpaceSlot && !momentNoSpatial) {
                await tx.dayBlueprintMomentPlacement.create({
                  data: {
                    day_blueprint_moment_id: createdMoment.id,
                    day_blueprint_space_slot_id: activitySpaceSlot.id,
                    subject_role_id: item.subjectRoleId,
                    position_hint: item.positionHint,
                    facing_hint: item.facingHint,
                    notes: item.placementNotes?.slice(0, 1000),
                    order_index: k,
                  },
                });
                placementsCreated += 1;
              }
            }

            this.aiEvents.emit({
              versionId,
              runId: run.id,
              step: 'moment-persisted',
              label: `Wrote ${a.name} → ${m.name}`,
              status: 'completed',
              stepIndex: 2,
              totalSteps: 4,
              data: {
                eventKind: 'moment-persisted',
                dayId,
                activityId: existing.id,
                activityName: a.name,
                momentName: m.name,
                momentOrderIndex: j,
                previewDurationSeconds,
                previewActionCount: coverage.length,
                previewPlacementCount: activitySpaceSlot && !momentNoSpatial ? coverage.length : 0,
                previewKey,
                momentsCreated,
                actionsCreated,
                placementsCreated,
                momentsWithCoverage,
              },
            });
          }

          await tx.dayBlueprintAiRun.update({
            where: { id: run.id },
            data: {
              prompt_summary: `Writing ${a.name}: ${momentsCreated} moments, ${actionsCreated} actions, ${placementsCreated} placements so far`,
            },
          });
          this.aiEvents.emit({
            versionId,
            runId: run.id,
            step: 'persist-coverage',
            label: `Writing ${a.name}: ${momentsCreated} moments, ${actionsCreated} actions, ${placementsCreated} placements`,
            status: 'started',
            stepIndex: 2,
            totalSteps: 4,
            data: {
              eventKind: 'summary',
              dayId,
              activityId: existing.id,
              activityName: a.name,
              momentsCreated,
              actionsCreated,
              placementsCreated,
              momentsWithCoverage,
            },
          });
        }

        if (options.activityId && !wroteSelectedActivity) {
          throw new BadRequestException('AI response did not include the selected activity');
        }

        return { momentsCreated, actionsCreated, placementsCreated, momentsWithCoverage };
      });

      // Per-subject spatial post-pass — re-runs spatial placement so the
      // People gallery can animate one subject at a time via SSE. The
      // initial pass inside the transaction already wrote placements with
      // the same heuristics, so this is a no-result-change refresh whose
      // value is the live UX. Skipped when nothing was generated or when
      // the user already cancelled.
      if (result.momentsCreated > 0) {
        try {
          checkCancelled();
          await this.spatialGenerator.generateForDay(versionId, dayId, {
            activityId: options.activityId,
            runId: run.id,
          });
        } catch (spatialErr) {
          if ((spatialErr as Error & { isCancellation?: boolean })?.isCancellation) {
            throw spatialErr;
          }
          // Non-fatal: spatial animation pass failed but the main run already
          // wrote valid placements inside the transaction.
          this.logger.warn(
            `Spatial post-pass failed for version=${versionId} day=${dayId} run=${run.id}: ${
              spatialErr instanceof Error ? spatialErr.message : String(spatialErr)
            }`,
          );
        }
      }

      await this.prisma.dayBlueprintAiRun.update({
        where: { id: run.id },
        data: {
          status: 'SUCCESS',
          finished_at: new Date(),
          prompt_summary: `${promptSummary} → ${result.momentsCreated} moments, ${result.actionsCreated} actions, ${result.placementsCreated} placements, ${result.momentsWithCoverage}/${result.momentsCreated} moments covered`,
        },
      });
      this.aiEvents.emit({
        versionId,
        runId: run.id,
        step: 'done',
        label: `Generated ${result.momentsCreated} moments, ${result.actionsCreated} actions, ${result.placementsCreated} placements`,
        status: 'completed',
        stepIndex: 3,
        totalSteps: 4,
        data: {
          eventKind: 'summary',
          dayId,
          activityId: options.activityId,
          ...result,
          totalMoments: result.momentsCreated,
        },
      });
      runLogger.writeReport({
        ...plannedReport,
        status: 'completed',
        persisted: toPersistedReport(result),
      });
      runLogger.complete(result);

      return { runId: run.id, ...result };
    } catch (err) {
      const isCancel = Boolean((err as Error & { isCancellation?: boolean })?.isCancellation);
      const message = err instanceof Error ? err.message : String(err);
      if (isCancel) {
        this.logger.log(`generateDay cancelled by user for version=${versionId} day=${dayId} run=${run.id}`);
        await this.prisma.dayBlueprintAiRun.update({
          where: { id: run.id },
          data: {
            status: 'CANCELLED',
            error: 'Cancelled by user',
            finished_at: new Date(),
          },
        });
        this.aiEvents.emit({
          versionId,
          runId: run.id,
          step: 'cancelled',
          label: 'Cancelled by user — moments restored',
          status: 'failed',
          stepIndex: 3,
          totalSteps: 4,
          data: { eventKind: 'cancelled', dayId, activityId: options.activityId },
        });
        // Emit terminal `done` so the SSE stream closes cleanly for clients.
        this.aiEvents.emit({
          versionId,
          runId: run.id,
          step: 'done',
          label: 'Run cancelled',
          status: 'failed',
          stepIndex: 3,
          totalSteps: 4,
          data: { eventKind: 'cancelled', dayId },
        });
        runLogger.fail('Cancelled by user', { error: 'CANCELLED_BY_USER' });
        return { runId: run.id, momentsCreated: 0, actionsCreated: 0, placementsCreated: 0, momentsWithCoverage: 0 };
      }
      this.logger.warn(`generateDay failed for version=${versionId} day=${dayId}: ${message}`);
      await this.prisma.dayBlueprintAiRun.update({
        where: { id: run.id },
        data: { status: 'FAILED', error: message.slice(0, 2000), finished_at: new Date() },
      });
      this.aiEvents.emit({
        versionId,
        runId: run.id,
        step: 'error',
        label: 'Day Designer AI generation failed',
        status: 'failed',
        stepIndex: 3,
        totalSteps: 4,
        error: message.slice(0, 2000),
        data: {
          eventKind: 'summary',
          dayId,
          activityId: options.activityId,
        },
      });
      runLogger.writeReport(buildKnowledgeReport({
        runLogger,
        dbRunId: run.id,
        status: 'failed',
        brandId: blueprint.brand_id,
        blueprintId: blueprint.id,
        blueprintName: blueprint.display_name,
        versionId,
        dayId,
        dayName: day.name,
        promptSummary,
        promptChars: promptSummary.length,
        error: message.slice(0, 2000),
      }));
      runLogger.fail('Day Designer AI generation failed', { error: message.slice(0, 2000) });
      throw new BadRequestException(`Day generation failed: ${message}`);
    } finally {
      this.aiEvents.releaseRun(run.id);
    }
  }

  /**
   * User-initiated cancel for an in-flight generate run. Signals the
   * AbortController registered at run start so the per-moment loop
   * throws inside the open Prisma transaction — Prisma rolls the
   * destructive delete + any partial writes back automatically. The
   * catch handler then marks the run CANCELLED.
   *
   * If the AbortController is no longer registered (process restart,
   * or the run is blocked inside a long LLM call before the first
   * checkCancelled() point), the run is force-marked CANCELLED in the
   * DB immediately so the UI reflects the cancellation even when the
   * generator loop cannot be interrupted.
   */
  async cancelRun(runId: number): Promise<{ runId: number; status: 'CANCEL_REQUESTED' | 'NOT_RUNNING' }> {
    const run = await this.prisma.dayBlueprintAiRun.findUnique({ where: { id: runId } });
    if (!run) throw new NotFoundException('AI run not found');
    if (run.status !== 'RUNNING') {
      return { runId, status: 'NOT_RUNNING' };
    }

    const now = new Date();
    const signalled = this.aiEvents.signalCancel(runId);
    this.logger.log(`cancelRun runId=${runId} signalled=${signalled}`);

    if (signalled) {
      // Controller is live — set the flag so the generator loop picks it up.
      await this.prisma.dayBlueprintAiRun.update({
        where: { id: runId },
        data: { cancel_requested_at: now },
      });
    } else {
      // No active controller (orphaned run, server restart, or blocked in LLM call).
      // Force-terminate immediately so the UI is unblocked.
      await this.prisma.dayBlueprintAiRun.update({
        where: { id: runId },
        data: {
          status: 'CANCELLED',
          cancel_requested_at: now,
          finished_at: now,
          error: 'Cancelled by user (run was not resumable)',
        },
      });
      this.logger.warn(`cancelRun runId=${runId} force-cancelled (no active controller)`);
    }

    return { runId, status: 'CANCEL_REQUESTED' };
  }

  private buildGemmaRequest(ctx: {
    eventCategory: string;
    blueprintName: string;
    dayName: string;
    dayDescription: string | null;
    existingActivities: Array<{ name: string; durationSeconds: number | null }>;
    subjectRoles: string[];
    userPrompt?: string;
    qualityRetryHint?: string;
  }): DayBlueprintGemmaRequest {
    const activityList = ctx.existingActivities
      .map((a) => {
        if (!a.durationSeconds) return a.name;
        const mins = Math.round(a.durationSeconds / 60);
        return `${a.name} (${mins} min)`;
      })
      .join(', ');

    const userMessage = [
      `Event category: ${ctx.eventCategory}`,
      `Blueprint: ${ctx.blueprintName}`,
      `Day: ${ctx.dayName}`,
      ctx.dayDescription ? `Day description: ${ctx.dayDescription}` : null,
      `You MUST return EXACTLY these activities in this order: ${activityList}. Do not add, remove, or rename any activity.`,
      ctx.subjectRoles.length > 0
        ? `Available subject roles: ${ctx.subjectRoles.join(', ')}`
        : 'No subject roles are available; still include semantic subject role names for fallback matching.',
      ctx.userPrompt ? `Director's brief: ${ctx.userPrompt}` : null,
      ctx.qualityRetryHint ? `Quality gate for this retry: ${ctx.qualityRetryHint}` : null,
      '',
      'For each activity, update the description to reflect what happens during it. One sentence only.',
      'For each activity, include enough moments to realistically cover its full duration. The moment duration_seconds values must sum to approximately the activity duration. Use 30–120s for fast beats, 60–600s for sustained scenes. A 45-minute activity should have 8–15 moments; a 15-minute activity 3–6 moments; a 90-minute activity 15–25 moments. Mark the key narrative beat with is_key_moment=true.',
      'Every moment must include 1-2 subject_actions. Only include subject_placements when spatial placement should exist; set no_spatial=true when that moment should stay unplaced in floor plan.',
      'Do not compress long activities into a short highlight reel. Cover the full timeline with meaningful sequential beats.',
      'Use only subject role names from the available subject roles list when possible.',
      'Each subject action should say what that subject is doing in that exact moment.',
      'Each subject placement should include a position_hint and facing_hint from the schema enums.',
      'Keep JSON compact; omit optional notes unless essential.',
      'Durations in seconds for moments.',
    ]
      .filter(Boolean)
      .join('\n');

    const chat: GemmaChatRequest = {
      requestLabel: 'day-blueprint-generate',
      messages: [
        {
          role: 'system',
          content:
            'You design event-day blueprints for a wedding/event film studio. You return strict JSON only — no prose, no markdown. Names are concise (2–6 words). Descriptions are one sentence.',
        },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.4,
      maxTokens: 16000,
      responseFormat: {
        type: 'json_schema',
        json_schema: {
          name: 'day_plan',
          schema: {
            type: 'object',
            additionalProperties: false,
            required: ['activities'],
            properties: {
              activities: {
                type: 'array',
                items: {
                  type: 'object',
                  additionalProperties: false,
                  required: ['name', 'moments'],
                  properties: {
                    name: { type: 'string' },
                    description: { type: 'string' },
                    moments: {
                      type: 'array',
                      minItems: 3,
                      items: {
                        type: 'object',
                        additionalProperties: false,
                        required: ['name', 'duration_seconds', 'subject_actions'],
                        properties: {
                          name: { type: 'string' },
                          description: { type: 'string' },
                          duration_seconds: { type: 'number' },
                          is_key_moment: { type: 'boolean' },
                          no_spatial: { type: 'boolean' },
                          subject_actions: {
                            type: 'array',
                            items: {
                              type: 'object',
                              additionalProperties: false,
                              required: ['subject_role', 'action_text'],
                              properties: {
                                subject_role: { type: 'string' },
                                action_text: { type: 'string' },
                                emphasis: { type: 'string', enum: ['PRIMARY', 'SECONDARY', 'OPTIONAL'] },
                                notes: { type: 'string' },
                              },
                            },
                          },
                          subject_placements: {
                            type: 'array',
                            items: {
                              type: 'object',
                              additionalProperties: false,
                              required: ['subject_role', 'position_hint', 'facing_hint'],
                              properties: {
                                subject_role: { type: 'string' },
                                position_hint: { type: 'string', enum: ['CENTER', 'STAGE_LEFT', 'STAGE_RIGHT', 'ALTAR_FRONT', 'ALTAR_BACK', 'AISLE_START', 'AISLE_END', 'FIRST_ROW_LEFT', 'FIRST_ROW_RIGHT', 'BACK', 'OFF_STAGE', 'UNSPECIFIED'] },
                                facing_hint: { type: 'string', enum: ['TOWARD_ALTAR', 'TOWARD_AISLE', 'TOWARD_AUDIENCE', 'TOWARD_PARTNER', 'TOWARD_CAMERA', 'UNSPECIFIED'] },
                                notes: { type: 'string' },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    };

    return { chat, userMessage };
  }

  private async callGemma(
    request: DayBlueprintGemmaRequest,
    runLogger: DayBlueprintAiRunLogger,
    streamCtx?: { versionId: number; runId: number; dayId: number; signal?: AbortSignal },
  ): Promise<DayBlueprintGemmaResult> {
    if (!streamCtx) {
      const response = await this.gemma.chat(request.chat);
      runLogger.writeLlmResponse(response);
      return { plan: parsePlan(response.reply), response };
    }

    // Stream the LLM output and emit incremental moment/activity events
    // so the frontend table fills in token-by-token without waiting
    // for the full plan to arrive and persist.
    const { versionId, runId, dayId, signal } = streamCtx;
    const seenActivities = new Set<number>();
    const seenMoments = new Set<string>();
    const parser = new DayPlanStreamParser({
      onActivityStart: ({ index, name }) => {
        if (seenActivities.has(index)) return;
        seenActivities.add(index);
        this.aiEvents.emit({
          versionId,
          runId,
          step: 'moment-streaming',
          label: `Streaming activity: ${name}`,
          status: 'started',
          stepIndex: 1,
          totalSteps: 4,
          data: {
            eventKind: 'activity-streaming',
            dayId,
            activityName: name,
          },
        });
      },
      onMomentStart: ({ activityIndex, activityName, index, name }) => {
        const key = `${activityIndex}:${index}:${name}`;
        if (seenMoments.has(key)) return;
        seenMoments.add(key);
        this.aiEvents.emit({
          versionId,
          runId,
          step: 'moment-streaming',
          label: `Streaming moment: ${name}`,
          status: 'started',
          stepIndex: 1,
          totalSteps: 4,
          data: {
            eventKind: 'moment-streaming',
            dayId,
            activityName,
            momentName: name,
            momentOrderIndex: index,
            previewKey: `${runId}:streaming:${activityIndex}:${index}:${name}`,
          },
        });
      },
    });

    const response = await this.gemma.chatStream(request.chat, {
      signal,
      onTextDelta: (delta) => {
        try {
          parser.feed(delta);
        } catch (err) {
          this.logger.warn(`Stream parser error: ${(err as Error).message}`);
        }
      },
    });
    runLogger.writeLlmResponse(response);
    return { plan: parsePlan(response.reply), response };
  }

  private async updateRunProgress(
    versionId: number,
    runId: number,
    event: { step: string; label: string; status: 'started' | 'completed' | 'failed'; stepIndex: number; totalSteps: number; data?: DayBlueprintAiEventData },
  ) {
    await this.prisma.dayBlueprintAiRun.update({
      where: { id: runId },
      data: { prompt_summary: event.label },
    });
    this.aiEvents.emit({ versionId, runId, ...event });
  }

  private async findActivitySpaceSlot(
    tx: Parameters<Parameters<PrismaService['$transaction']>[0]>[0],
    versionId: number,
    activityId: number,
    activityName: string,
  ) {
    const activityLocation = await tx.dayBlueprintActivityLocation.findFirst({
      where: { day_blueprint_activity_id: activityId },
      orderBy: { order_index: 'asc' },
    });
    if (!activityLocation) return null;

    const stableActivityKey = stableKey(`${activityName} space`);
    const activitySlot = await tx.dayBlueprintSpaceSlot.findFirst({
      where: {
        day_blueprint_version_id: versionId,
        day_blueprint_location_role_id: activityLocation.day_blueprint_location_role_id,
        OR: [
          { key: stableActivityKey },
          { label: `${activityName} Space` },
        ],
      },
      orderBy: { order_index: 'asc' },
    });
    if (activitySlot) return activitySlot;

    return tx.dayBlueprintSpaceSlot.findFirst({
      where: {
        day_blueprint_version_id: versionId,
        day_blueprint_location_role_id: activityLocation.day_blueprint_location_role_id,
      },
      orderBy: { order_index: 'asc' },
    });
  }
}

interface GeneratedMoment {
  name: string;
  description?: string;
  duration_seconds?: number;
  is_key_moment?: boolean;
  no_spatial?: boolean;
  subject_actions?: GeneratedSubjectAction[];
  subject_placements?: GeneratedSubjectPlacement[];
}

interface GeneratedSubjectAction {
  subject_role: string;
  action_text: string;
  emphasis?: string;
  notes?: string;
}

interface GeneratedSubjectPlacement {
  subject_role: string;
  position_hint?: string;
  facing_hint?: string;
  notes?: string;
}

interface GeneratedActivity {
  name: string;
  description?: string;
  default_start_time?: string;
  default_duration_minutes?: number;
  moments?: GeneratedMoment[];
}

interface GeneratedDayPlan {
  activities: GeneratedActivity[];
}

interface DayBlueprintGemmaRequest {
  chat: GemmaChatRequest;
  userMessage: string;
}

interface DayBlueprintGemmaResult {
  plan: GeneratedDayPlan;
  response: Awaited<ReturnType<GemmaService['chat']>>;
}

interface ActivityCoverageTarget {
  activityName: string;
  normalizedName: string;
  targetDurationSeconds: number;
  minMomentCount: number;
}

interface ActivityCoverageIssue {
  activityName: string;
  targetDurationSeconds: number;
  targetMinMomentCount: number;
  actualMomentCount: number;
  actualDurationSeconds: number;
  reason: 'missing-activity' | 'low-count' | 'low-duration';
}

interface KnowledgeReportInput {
  runLogger: DayBlueprintAiRunLogger;
  dbRunId: number;
  status: 'running' | 'completed' | 'failed';
  brandId: number;
  blueprintId: number;
  blueprintName: string;
  versionId: number;
  dayId: number;
  dayName: string;
  promptSummary: string;
  promptChars: number;
  response?: DayBlueprintGemmaResult['response'];
  activities?: GeneratedActivity[];
  error?: string;
}

function buildKnowledgeReport(input: KnowledgeReportInput): DayBlueprintAiKnowledgeReport {
  return {
    v: 1,
    run: input.runLogger.getRunId(),
    db: input.dbRunId,
    status: input.status,
    ids: {
      brand: input.brandId,
      blueprint: input.blueprintId,
      version: input.versionId,
      day: input.dayId,
    },
    label: { blueprint: input.blueprintName, day: input.dayName },
    prompt: { chars: input.promptChars, brief: input.promptSummary },
    llm: input.response
      ? {
        model: input.response.model,
        provider: input.response.provider,
        pt: input.response.usage?.prompt_tokens,
        ct: input.response.usage?.completion_tokens,
        tt: input.response.usage?.total_tokens,
        qms: input.response.queueWaitMs,
        rms: input.response.requestDurationMs,
        replyChars: input.response.reply.length,
      }
      : undefined,
    plan: input.activities ? summarizePlan(input.activities) : undefined,
    error: input.error,
  };
}

function summarizePlan(activities: GeneratedActivity[]): DayBlueprintAiKnowledgeReport['plan'] {
  let moments = 0;
  let actions = 0;
  let placements = 0;
  let missingActions = 0;
  let missingPlacements = 0;

  const outline = activities.map((activity, activityIndex) => {
    const momentOutline = (activity.moments ?? []).map((moment, momentIndex) => {
      const actionCount = moment.subject_actions?.length ?? 0;
      const placementCount = moment.subject_placements?.length ?? 0;
      moments += 1;
      actions += actionCount;
      placements += placementCount;
      if (actionCount === 0) missingActions += 1;
      if (placementCount === 0) missingPlacements += 1;
      return {
        i: momentIndex,
        n: moment.name,
        sec: moment.duration_seconds,
        key: Boolean(moment.is_key_moment),
        a: actionCount,
        p: placementCount,
        r: summarizeMomentRoles(moment),
      };
    });

    return {
      i: activityIndex,
      n: activity.name,
      s: activity.default_start_time,
      d: activity.default_duration_minutes,
      m: momentOutline,
    };
  });

  return {
    activities: activities.length,
    moments,
    actions,
    placements,
    missingActions,
    missingPlacements,
    outline,
  };
}

function summarizeMomentRoles(moment: GeneratedMoment): string[] {
  const roles = new Set<string>();
  for (const action of moment.subject_actions ?? []) roles.add(action.subject_role);
  for (const placement of moment.subject_placements ?? []) roles.add(placement.subject_role);
  return Array.from(roles).slice(0, 8);
}

function toPersistedReport(result: {
  momentsCreated: number;
  actionsCreated: number;
  placementsCreated: number;
  momentsWithCoverage: number;
}): DayBlueprintAiKnowledgeReport['persisted'] {
  return {
    activities: 0,
    moments: result.momentsCreated,
    actions: result.actionsCreated,
    placements: result.placementsCreated,
    momentsWithCoverage: result.momentsWithCoverage,
    coveragePct: result.momentsCreated > 0
      ? Math.round((result.momentsWithCoverage / result.momentsCreated) * 100)
      : 0,
  };
}

function buildActivityQualityTargets(
  activities: Array<{ id: number; name: string; default_duration_minutes: number | null }>,
  scopedActivityId: number | null,
): ActivityCoverageTarget[] {
  return activities
    .filter((activity) => scopedActivityId == null || activity.id === scopedActivityId)
    .map((activity) => {
      const targetDurationSeconds = Math.max(0, (activity.default_duration_minutes ?? 0) * 60);
      return {
        activityName: activity.name,
        normalizedName: normalizeRoleName(activity.name),
        targetDurationSeconds,
        minMomentCount: estimateMinimumMomentCount(targetDurationSeconds),
      };
    })
    .filter((target) => target.targetDurationSeconds > 0);
}

function estimateMinimumMomentCount(targetDurationSeconds: number): number {
  if (targetDurationSeconds <= 0) return 3;
  return Math.max(3, Math.ceil(targetDurationSeconds / 300));
}

function collectCoverageIssues(
  activities: GeneratedActivity[],
  targets: ActivityCoverageTarget[],
): ActivityCoverageIssue[] {
  if (targets.length === 0) return [];

  const byName = new Map<string, GeneratedActivity>();
  for (const activity of activities) {
    byName.set(normalizeRoleName(activity.name), activity);
  }

  const issues: ActivityCoverageIssue[] = [];
  for (const target of targets) {
    const matched = byName.get(target.normalizedName);
    if (!matched) {
      issues.push({
        activityName: target.activityName,
        targetDurationSeconds: target.targetDurationSeconds,
        targetMinMomentCount: target.minMomentCount,
        actualMomentCount: 0,
        actualDurationSeconds: 0,
        reason: 'missing-activity',
      });
      continue;
    }

    const moments = matched.moments ?? [];
    const actualMomentCount = moments.length;
    const actualDurationSeconds = moments.reduce(
      (sum, moment) => sum + (clampInt(moment.duration_seconds, 5, 3600) ?? 60),
      0,
    );
    if (actualMomentCount < target.minMomentCount) {
      issues.push({
        activityName: target.activityName,
        targetDurationSeconds: target.targetDurationSeconds,
        targetMinMomentCount: target.minMomentCount,
        actualMomentCount,
        actualDurationSeconds,
        reason: 'low-count',
      });
      continue;
    }
    if (actualDurationSeconds < target.targetDurationSeconds * 0.8) {
      issues.push({
        activityName: target.activityName,
        targetDurationSeconds: target.targetDurationSeconds,
        targetMinMomentCount: target.minMomentCount,
        actualMomentCount,
        actualDurationSeconds,
        reason: 'low-duration',
      });
    }
  }

  return issues;
}

function buildCoverageRetryHint(issues: ActivityCoverageIssue[]): string {
  return issues
    .slice(0, 6)
    .map((issue) => {
      const targetMin = Math.round(issue.targetDurationSeconds / 60);
      const actualMin = Math.round(issue.actualDurationSeconds / 60);
      if (issue.reason === 'missing-activity') {
        return `${issue.activityName}: missing from output; include it exactly.`;
      }
      return `${issue.activityName}: produced ${issue.actualMomentCount} moments / ${actualMin}m; require >=${issue.targetMinMomentCount} moments and ~${targetMin}m total duration.`;
    })
    .join(' ');
}

function parsePlan(raw: string): GeneratedDayPlan {
  const trimmed = extractJsonObject(raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim());
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    throw new Error(trimmed.includes('{')
      ? 'AI response was truncated before valid JSON completed'
      : 'AI returned non-JSON response');
  }
  if (!parsed || typeof parsed !== 'object' || !Array.isArray((parsed as { activities?: unknown }).activities)) {
    throw new Error('AI response missing activities array');
  }
  const activities = (parsed as { activities: unknown[] }).activities
    .map((a) => normalizeActivity(a))
    .filter((a): a is GeneratedActivity => a !== null);
  if (activities.length === 0) throw new Error('AI returned no activities');
  return { activities };
}

function extractJsonObject(source: string): string {
  const firstBraceIndex = source.indexOf('{');
  if (firstBraceIndex < 0) return source;

  let depth = 0;
  let inString = false;
  let escaping = false;

  for (let index = firstBraceIndex; index < source.length; index += 1) {
    const character = source[index];

    if (escaping) {
      escaping = false;
      continue;
    }
    if (character === '\\') {
      escaping = true;
      continue;
    }
    if (character === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (character === '{') depth += 1;
    if (character === '}') depth -= 1;
    if (depth === 0) return source.slice(firstBraceIndex, index + 1).trim();
  }

  return source;
}

function normalizeActivity(value: unknown): GeneratedActivity | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  if (typeof v.name !== 'string' || !v.name.trim()) return null;
  const moments = Array.isArray(v.moments)
    ? v.moments.map((m) => normalizeMoment(m)).filter((m): m is GeneratedMoment => m !== null)
    : [];
  return {
    name: v.name.trim(),
    description: typeof v.description === 'string' ? v.description.trim() : undefined,
    default_start_time:
      typeof v.default_start_time === 'string' ? normalizeClockTime(v.default_start_time) : undefined,
    default_duration_minutes:
      typeof v.default_duration_minutes === 'number' ? v.default_duration_minutes : undefined,
    moments,
  };
}

function normalizeMoment(value: unknown): GeneratedMoment | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  if (typeof v.name !== 'string' || !v.name.trim()) return null;
  return {
    name: v.name.trim(),
    description: typeof v.description === 'string' ? v.description.trim() : undefined,
    duration_seconds: typeof v.duration_seconds === 'number' ? v.duration_seconds : undefined,
    is_key_moment: typeof v.is_key_moment === 'boolean' ? v.is_key_moment : undefined,
    no_spatial: typeof v.no_spatial === 'boolean' ? v.no_spatial : undefined,
    subject_actions: Array.isArray(v.subject_actions)
      ? v.subject_actions.map((action) => normalizeGeneratedAction(action)).filter((action): action is GeneratedSubjectAction => action !== null)
      : [],
    subject_placements: Array.isArray(v.subject_placements)
      ? v.subject_placements.map((placement) => normalizeGeneratedPlacement(placement)).filter((placement): placement is GeneratedSubjectPlacement => placement !== null)
      : [],
  };
}

function normalizeGeneratedAction(value: unknown): GeneratedSubjectAction | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  if (typeof v.subject_role !== 'string' || !v.subject_role.trim()) return null;
  if (typeof v.action_text !== 'string' || !v.action_text.trim()) return null;
  return {
    subject_role: v.subject_role.trim(),
    action_text: v.action_text.trim(),
    emphasis: typeof v.emphasis === 'string' ? v.emphasis.trim() : undefined,
    notes: typeof v.notes === 'string' ? v.notes.trim() : undefined,
  };
}

function normalizeGeneratedPlacement(value: unknown): GeneratedSubjectPlacement | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  if (typeof v.subject_role !== 'string' || !v.subject_role.trim()) return null;
  return {
    subject_role: v.subject_role.trim(),
    position_hint: typeof v.position_hint === 'string' ? v.position_hint.trim() : undefined,
    facing_hint: typeof v.facing_hint === 'string' ? v.facing_hint.trim() : undefined,
    notes: typeof v.notes === 'string' ? v.notes.trim() : undefined,
  };
}

interface CoverageItem {
  subjectRoleId: number;
  actionText: string;
  emphasis: DayBlueprintActionEmphasis;
  notes?: string;
  positionHint: DayBlueprintPlacementPosition;
  facingHint: DayBlueprintPlacementFacing;
  placementNotes?: string;
}

function resolveMomentCoverage(
  moment: GeneratedMoment,
  roleByName: Map<string, { subject_role_id: number; subject_role: { role_name: string } }>,
  fallbackRoles: Array<{ subject_role_id: number; subject_role: { role_name: string } }>,
): CoverageItem[] {
  const coverage = new Map<number, CoverageItem>();
  const placementsByRole = new Map((moment.subject_placements ?? []).map((placement) => [normalizeRoleName(placement.subject_role), placement]));

  for (const action of moment.subject_actions ?? []) {
    const role = roleByName.get(normalizeRoleName(action.subject_role));
    if (!role) continue;
    const placement = placementsByRole.get(normalizeRoleName(action.subject_role));
    coverage.set(role.subject_role_id, {
      subjectRoleId: role.subject_role_id,
      actionText: action.action_text,
      emphasis: parseActionEmphasis(action.emphasis),
      notes: action.notes,
      positionHint: parsePlacementPosition(placement?.position_hint),
      facingHint: parsePlacementFacing(placement?.facing_hint),
      placementNotes: placement?.notes,
    });
  }

  for (const placement of moment.subject_placements ?? []) {
    const role = roleByName.get(normalizeRoleName(placement.subject_role));
    if (!role || coverage.has(role.subject_role_id)) continue;
    coverage.set(role.subject_role_id, {
      subjectRoleId: role.subject_role_id,
      actionText: `${role.subject_role.role_name} is present for ${moment.name}.`,
      emphasis: DayBlueprintActionEmphasis.SECONDARY,
      positionHint: parsePlacementPosition(placement.position_hint),
      facingHint: parsePlacementFacing(placement.facing_hint),
      placementNotes: placement.notes,
    });
  }

  if (coverage.size === 0) {
    fallbackRoles.forEach((role, index) => {
      coverage.set(role.subject_role_id, {
        subjectRoleId: role.subject_role_id,
        actionText: `${role.subject_role.role_name} is present for ${moment.name}.`,
        emphasis: index === 0 ? DayBlueprintActionEmphasis.PRIMARY : DayBlueprintActionEmphasis.SECONDARY,
        positionHint: index === 0 ? DayBlueprintPlacementPosition.CENTER : DayBlueprintPlacementPosition.UNSPECIFIED,
        facingHint: DayBlueprintPlacementFacing.UNSPECIFIED,
      });
    });
  }

  return Array.from(coverage.values());
}

function parseActionEmphasis(value: string | undefined): DayBlueprintActionEmphasis {
  if (value && value in DayBlueprintActionEmphasis) return DayBlueprintActionEmphasis[value as keyof typeof DayBlueprintActionEmphasis];
  return DayBlueprintActionEmphasis.SECONDARY;
}

function parsePlacementPosition(value: string | undefined): DayBlueprintPlacementPosition {
  if (value && value in DayBlueprintPlacementPosition) return DayBlueprintPlacementPosition[value as keyof typeof DayBlueprintPlacementPosition];
  return DayBlueprintPlacementPosition.UNSPECIFIED;
}

function parsePlacementFacing(value: string | undefined): DayBlueprintPlacementFacing {
  if (value && value in DayBlueprintPlacementFacing) return DayBlueprintPlacementFacing[value as keyof typeof DayBlueprintPlacementFacing];
  return DayBlueprintPlacementFacing.UNSPECIFIED;
}

function normalizeRoleName(value: string) {
  return value.trim().toLowerCase().replace(/honou?r/g, 'honor').replace(/[^a-z0-9]+/g, ' ').trim();
}

function stableKey(value: string) {
  return normalizeRoleName(value).replace(/ /g, '_');
}

function clampInt(value: number | undefined, min: number, max: number): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;
  return Math.max(min, Math.min(max, Math.round(value)));
}

function parseClockTime(value: string | null | undefined): number | null {
  if (!value || !/^\d{2}:\d{2}$/.test(value)) return null;
  const [hours, minutes] = value.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes) || hours > 23 || minutes > 59) {
    return null;
  }
  return hours * 60 + minutes;
}

function normalizeClockTime(value: string | null | undefined): string | undefined {
  const minutes = parseClockTime(value);
  if (minutes == null) return undefined;
  return formatClockTime(minutes);
}

function formatClockTime(totalMinutes: number): string {
  const normalized = ((Math.floor(totalMinutes) % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

