import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { StepLogger } from '../../../ai/orchestration/pipeline-logger';
import { MomentKnowledgeService } from '../../schedule/services/moment-knowledge.service';
import { ActivityActionsInput, ActivityActionsStep } from '../steps/activity-actions.step';
import { ActivityCastingInput, ActivityCastingStep, FocalPriority } from '../steps/activity-casting.step';
import {
  ActivityPlanState,
  PlannerActivityRecord,
  PlannerMomentRecord,
  PlannerSubject,
  SingleActivityPlanResult,
} from '../activity-planning.types';
import { PackageContextService } from './package-context.service';
import { buildPlannerStepValue, createMeasuredStepLogger, type PlannerStepMetrics, type PlannerStepValue } from './planning-step-insights';

interface ActivityExecutionResult {
  succeeded: boolean;
  metrics: PlannerStepMetrics;
  value: PlannerStepValue;
}

interface ActivityMomentProgress {
  momentId: number;
  momentName: string;
  subjectIds: number[];
  subjectNames: string[];
}

type ActivityMomentProgressReporter = (progress: ActivityMomentProgress) => void;

@Injectable()
export class SingleActivityPlannerService {
  private readonly logger = new Logger(SingleActivityPlannerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly momentKnowledge: MomentKnowledgeService,
    private readonly packageContext: PackageContextService,
    private readonly activityCasting: ActivityCastingStep,
    private readonly activityActions: ActivityActionsStep,
  ) {}

  async planActivity(activityId: number, fallbackSubjects: PlannerSubject[] = []): Promise<SingleActivityPlanResult> {
    const planState = await this.preparePlanContext(activityId, fallbackSubjects);
    if (!planState.activity || planState.fullMoments.length === 0) {
      this.logger.log(`planSingleActivity: no moments for activity ${activityId}, skipping`);
      return { momentCount: 0, planned: false };
    }

    if (planState.subjects.length === 0) {
      this.logger.log(`planSingleActivity: no subjects for activity ${activityId}, writing moments only`);
      return { momentCount: planState.fullMoments.length, planned: false };
    }

    const { presenceMaps, focalMaps } = await this.planCasting(
      planState.activity,
      planState.fullMoments,
      planState.subjects,
    );

    await this.planActions(
      planState.activity,
      planState.fullMoments,
      planState.subjects,
      presenceMaps,
      focalMaps,
    );

    return { momentCount: planState.fullMoments.length, planned: true };
  }

  async preparePlanContext(
    activityId: number,
    fallbackSubjects: PlannerSubject[] = [],
    stepLogger?: StepLogger,
  ): Promise<ActivityPlanState> {
    const { moments, source, templateUsed } = await this.momentKnowledge.ensureActivityMoments(activityId, stepLogger);
    if (moments.length === 0) {
      return {
        activity: null,
        fullMoments: [],
        momentSource: source,
        templateUsed,
        subjects: fallbackSubjects,
      };
    }

    const activity = await this.prisma.packageActivity.findUnique({
      where: { id: activityId },
      select: {
        id: true,
        name: true,
        description: true,
        duration_minutes: true,
        package_id: true,
        package_event_day_id: true,
      },
    });

    if (!activity) {
      return {
        activity: null,
        fullMoments: [],
        momentSource: source,
        templateUsed,
        subjects: fallbackSubjects,
      };
    }

    const fullMoments = await this.prisma.packageActivityMoment.findMany({
      where: { package_activity_id: activityId },
      orderBy: { order_index: 'asc' },
      select: { id: true, name: true, description: true, order_index: true, duration_seconds: true },
    });

    let subjects = await this.packageContext.loadActivitySubjects(activityId);
    if (subjects.length === 0) {
      subjects = fallbackSubjects.length > 0 ? fallbackSubjects : await this.packageContext.loadPackageSubjects(activity.package_id);
    }

    return {
      activity: activity as PlannerActivityRecord,
      fullMoments,
      momentSource: source,
      templateUsed,
      subjects,
    };
  }

  async planCasting(
    activity: PlannerActivityRecord,
    fullMoments: PlannerMomentRecord[],
    subjects: PlannerSubject[],
    stepLogger?: StepLogger,
    onMomentStart?: ActivityMomentProgressReporter,
  ): Promise<{
    presenceMaps: Map<number, Map<string, boolean>>;
    focalMaps: Map<number, Map<string, FocalPriority>>;
    succeeded: boolean;
    metrics: PlannerStepMetrics;
    value: PlannerStepValue;
  }> {
    let presenceMaps = new Map<number, Map<string, boolean>>();
    let focalMaps = new Map<number, Map<string, FocalPriority>>();
    let succeeded = false;
    const measured = createMeasuredStepLogger(stepLogger);

    try {
      for (const moment of fullMoments) {
        onMomentStart?.({
          momentId: moment.id,
          momentName: moment.name,
          subjectIds: subjects.map((subject) => subject.id),
          subjectNames: subjects.map((subject) => subject.name),
        });
        const momentLogger = createMomentStepLogger(measured.stepLogger, moment.name);
        const castingResult = await this.activityCasting.execute(
          this.buildCastingInput(activity, moment, subjects),
          momentLogger,
        );
        mergeNestedMaps(presenceMaps, this.activityCasting.toPresenceMaps(castingResult));
        mergeNestedMaps(focalMaps, this.activityCasting.toFocalMaps(castingResult));
      }
      this.logger.log(`planSingleActivity_casting: complete for "${activity.name}"`);
      succeeded = true;
    } catch (err) {
      const message = (err as Error).message;
      this.logger.warn(`planSingleActivity_casting: failed for "${activity.name}" — ${message}`);
      measured.stepLogger?.fail(message, 'Defaulting all subjects to present with BACKGROUND focal priority');
    }

    const derivedAssignments = countDerivedCastingAssignments(fullMoments, subjects, presenceMaps, focalMaps);
    const candidateCount = fullMoments.length * subjects.length;
    const metrics = measured.getMetrics();

    return {
      presenceMaps,
      focalMaps,
      succeeded,
      metrics,
      value: buildPlannerStepValue(candidateCount, derivedAssignments, metrics),
    };
  }

  async planActions(
    activity: PlannerActivityRecord,
    fullMoments: PlannerMomentRecord[],
    subjects: PlannerSubject[],
    presenceMaps: Map<number, Map<string, boolean>>,
    focalMaps: Map<number, Map<string, FocalPriority>>,
    stepLogger?: StepLogger,
    onMomentStart?: ActivityMomentProgressReporter,
  ): Promise<ActivityExecutionResult> {
    let actionMaps = new Map<number, Map<string, string | null>>();
    let succeeded = false;
    const measured = createMeasuredStepLogger(stepLogger);

    try {
      for (const moment of fullMoments) {
        const presenceMap = presenceMaps.get(moment.order_index);
        const activeSubjects = subjects.filter((subject) =>
          presenceMap ? presenceMap.get(subject.name.toLowerCase()) !== false : true,
        );
        onMomentStart?.({
          momentId: moment.id,
          momentName: moment.name,
          subjectIds: activeSubjects.map((subject) => subject.id),
          subjectNames: activeSubjects.map((subject) => subject.name),
        });
        const momentLogger = createMomentStepLogger(measured.stepLogger, moment.name);
        const actionsInput = this.buildActionsInput(activity, moment, subjects, presenceMaps);
        const actionsResult = await this.activityActions.execute(
          actionsInput,
          momentLogger,
        );
        mergeNestedMaps(actionMaps, this.activityActions.toActionMap(actionsResult));
      }
      this.logger.log(`planSingleActivity_actions: actions complete for "${activity.name}"`);
      succeeded = true;
    } catch (err) {
      const message = (err as Error).message;
      this.logger.warn(`planSingleActivity_actions: actions failed for "${activity.name}" — ${message}`);
      measured.stepLogger?.fail(message, 'Persisting null actions with existing focal priorities');
    }

    await this.persistSubjectActions(fullMoments, subjects, presenceMaps, focalMaps, actionMaps);
    this.logger.log(`planSingleActivity_actions: persisted for ${fullMoments.length} moments of "${activity.name}"`);
    measured.stepLogger?.log(`Persisted subject actions for ${fullMoments.length} moments`);
    const presentSubjectCount = countPresentSubjects(fullMoments, subjects, presenceMaps);
    const generatedActionCount = countGeneratedActions(actionMaps);
    const metrics = measured.getMetrics();
    return {
      succeeded,
      metrics,
      value: buildPlannerStepValue(presentSubjectCount, generatedActionCount, metrics),
    };
  }

  private buildCastingInput(
    activity: PlannerActivityRecord,
    moment: PlannerMomentRecord,
    subjects: PlannerSubject[],
  ): ActivityCastingInput {
    return {
      activityName: activity.name,
      activityDescription: activity.description ?? undefined,
      durationMinutes: activity.duration_minutes ?? undefined,
      moments: [{
        index: moment.order_index,
        name: moment.name,
        description: moment.description ?? '',
        durationSeconds: moment.duration_seconds,
      }],
      subjects: subjects.map((subject) => ({
        name: subject.name,
        role: subject.role,
        isGroup: subject.isGroup,
      })),
    };
  }

  private buildActionsInput(
    activity: PlannerActivityRecord,
    moment: PlannerMomentRecord,
    subjects: PlannerSubject[],
    presenceMaps: Map<number, Map<string, boolean>>,
  ): ActivityActionsInput {
    const presenceMap = presenceMaps.get(moment.order_index);
    return {
      activityName: activity.name,
      activityDescription: activity.description ?? undefined,
      durationMinutes: activity.duration_minutes ?? undefined,
      moments: [{
        index: moment.order_index,
        name: moment.name,
        description: moment.description ?? '',
        durationSeconds: moment.duration_seconds,
        subjects: subjects.map((subject) => ({
          name: subject.name,
          present: presenceMap ? presenceMap.get(subject.name.toLowerCase()) !== false : true,
          role: subject.role,
          isGroup: subject.isGroup,
        })),
      }],
    };
  }

  private async persistSubjectActions(
    fullMoments: PlannerMomentRecord[],
    subjects: PlannerSubject[],
    presenceMaps: Map<number, Map<string, boolean>>,
    focalMaps: Map<number, Map<string, FocalPriority>>,
    actionMaps: Map<number, Map<string, string | null>>,
  ): Promise<void> {
    for (const moment of fullMoments) {
      const actionMap = actionMaps.get(moment.order_index);
      const presenceMap = presenceMaps.get(moment.order_index);
      const focalMap = focalMaps.get(moment.order_index);

      const subjectActions: Record<string, { action: string | null; focal: string } | null> = {};
      for (const subject of subjects) {
        const present = presenceMap ? presenceMap.get(subject.name.toLowerCase()) !== false : true;
        if (!present) {
          subjectActions[subject.name] = null;
          continue;
        }

        subjectActions[subject.name] = {
          action: actionMap?.get(subject.name.toLowerCase()) ?? null,
          focal: focalMap?.get(subject.name.toLowerCase()) ?? 'BACKGROUND',
        };
      }

      await this.prisma.packageActivityMoment.update({
        where: { id: moment.id },
        data: { subject_actions: subjectActions },
      });
    }
  }
}

function mergeNestedMaps<T>(
  target: Map<number, Map<string, T>>,
  source: Map<number, Map<string, T>>,
): void {
  for (const [index, entries] of source.entries()) {
    target.set(index, entries);
  }
}

function createMomentStepLogger(stepLogger: StepLogger | undefined, momentName: string): StepLogger | undefined {
  if (!stepLogger) {
    return undefined;
  }

  const prefix = `Moment ${momentName}`;
  return {
    input(data: unknown): void {
      stepLogger.input({ scope: prefix, data });
    },
    output(data: unknown): void {
      stepLogger.output({ scope: prefix, data });
    },
    log(message: string): void {
      stepLogger.log(`${prefix}: ${message}`);
    },
    warn(message: string): void {
      stepLogger.warn(`${prefix}: ${message}`);
    },
    error(message: string): void {
      stepLogger.error(`${prefix}: ${message}`);
    },
    llmCall(details): void {
      stepLogger.llmCall(details);
    },
    timing(label: string, ms: number): void {
      stepLogger.timing(`${prefix} ${label}`, ms);
    },
    complete(resultSummary?: string): void {
      stepLogger.log(`${prefix}: completed${resultSummary ? ` - ${resultSummary}` : ''}`);
    },
    fail(error: string, fallbackUsed?: string): void {
      stepLogger.warn(`${prefix}: failed - ${error}${fallbackUsed ? ` | fallback: ${fallbackUsed}` : ''}`);
    },
  };
}

function countDerivedCastingAssignments(
  fullMoments: PlannerMomentRecord[],
  subjects: PlannerSubject[],
  presenceMaps: Map<number, Map<string, boolean>>,
  focalMaps: Map<number, Map<string, FocalPriority>>,
): number {
  let changed = 0;
  for (const moment of fullMoments) {
    const presenceMap = presenceMaps.get(moment.order_index);
    const focalMap = focalMaps.get(moment.order_index);
    for (const subject of subjects) {
      const key = subject.name.toLowerCase();
      const present = presenceMap ? presenceMap.get(key) !== false : true;
      const focal = focalMap?.get(key) ?? 'BACKGROUND';
      if (!present || focal !== 'BACKGROUND') {
        changed += 1;
      }
    }
  }
  return changed;
}

function countPresentSubjects(
  fullMoments: PlannerMomentRecord[],
  subjects: PlannerSubject[],
  presenceMaps: Map<number, Map<string, boolean>>,
): number {
  let presentCount = 0;
  for (const moment of fullMoments) {
    const presenceMap = presenceMaps.get(moment.order_index);
    for (const subject of subjects) {
      if (presenceMap ? presenceMap.get(subject.name.toLowerCase()) !== false : true) {
        presentCount += 1;
      }
    }
  }
  return presentCount;
}

function countGeneratedActions(actionMaps: Map<number, Map<string, string | null>>): number {
  let count = 0;
  for (const actions of actionMaps.values()) {
    for (const action of actions.values()) {
      if (action && action.trim()) {
        count += 1;
      }
    }
  }
  return count;
}