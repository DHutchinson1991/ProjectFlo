import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { StepLogger } from '../../../ai/orchestration/pipeline-logger';
import { ActivityDescriptionInput, ActivityDescriptionStep } from '../steps/activity-description.step';
import { ActivitySubjectAssignmentStep, SubjectAssignmentInput } from '../steps/activity-subject-assignment.step';
import { ActivityTimingInput, ActivityTimingStep } from '../steps/activity-timing.step';
import { PlannerActivityRecord, PlannerSubject } from '../activity-planning.types';
import { PackageContextService } from './package-context.service';
import { buildPlannerStepValue, createMeasuredStepLogger, type PlannerStepMetrics, type PlannerStepValue } from './planning-step-insights';

interface PackageStepResult {
  succeeded: boolean;
  metrics: PlannerStepMetrics;
  value: PlannerStepValue;
}

interface DescriptionStepResult extends PackageStepResult {
  updatedActivityCount: number;
}

interface SubjectAssignmentStepResult extends PackageStepResult {
  updatedActivityCount: number;
  insertedAssignmentCount: number;
}

interface TimingStepResult extends PackageStepResult {
  changedActivityCount: number;
}

@Injectable()
export class PackagePlanningStepsService {
  private readonly logger = new Logger(PackagePlanningStepsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly packageContext: PackageContextService,
    private readonly subjectAssignment: ActivitySubjectAssignmentStep,
    private readonly activityTiming: ActivityTimingStep,
    private readonly activityDescription: ActivityDescriptionStep,
  ) {}

  async runSubjectAssignment(
    activities: PlannerActivityRecord[],
    allSubjects: PlannerSubject[],
    eventType: string,
    stepLogger?: StepLogger,
  ): Promise<SubjectAssignmentStepResult> {
    const measured = createMeasuredStepLogger(stepLogger);
    try {
      const input: SubjectAssignmentInput = {
        eventType,
        activities: activities.map((activity) => ({
          id: activity.id,
          name: activity.name,
          description: activity.description ?? undefined,
          durationMinutes: activity.duration_minutes ?? undefined,
        })),
        subjects: allSubjects.map((subject) => ({
          name: subject.name,
          role: subject.role,
          isGroup: subject.isGroup,
        })),
      };

      const result = await this.subjectAssignment.execute(input, measured.stepLogger);
      const subjectByName = new Map(allSubjects.map((subject) => [subject.name.toLowerCase(), subject]));
      let insertedAssignmentCount = 0;
      let updatedActivityCount = 0;

      for (const assignment of result.activities) {
        const subjectIds = assignment.assignedSubjects
          .map((name) => subjectByName.get(name.toLowerCase())?.id)
          .filter((id): id is number => id != null);

        if (subjectIds.length === 0) continue;

        const createResult = await this.prisma.packageDaySubjectActivity.createMany({
          data: subjectIds.map((subjectId) => ({
            package_day_subject_id: subjectId,
            package_activity_id: assignment.activityId,
          })),
          skipDuplicates: true,
        });
        insertedAssignmentCount += createResult.count;
        if (createResult.count > 0) {
          updatedActivityCount += 1;
        }
      }

      this.logger.log('planPackageActivities: AI subject assignment complete');
      measured.stepLogger?.log('Persisted subject assignments to PackageDaySubjectActivity');
      const metrics = measured.getMetrics();
      return {
        succeeded: true,
        updatedActivityCount,
        insertedAssignmentCount,
        metrics,
        value: buildPlannerStepValue(activities.length, updatedActivityCount, metrics),
      };
    } catch (err) {
      const message = (err as Error).message;
      this.logger.warn(`planPackageActivities: subject assignment failed — ${message}`);
      measured.stepLogger?.fail(message, 'Leaving subject assignments unchanged');
      const metrics = measured.getMetrics();
      return {
        succeeded: false,
        updatedActivityCount: 0,
        insertedAssignmentCount: 0,
        metrics,
        value: buildPlannerStepValue(activities.length, 0, metrics),
      };
    }
  }

  async runTimingEstimation(
    activities: PlannerActivityRecord[],
    allSubjects: PlannerSubject[],
    locationContext: string | undefined,
    eventType: string,
    stepLogger?: StepLogger,
  ): Promise<TimingStepResult> {
    const measured = createMeasuredStepLogger(stepLogger);
    try {
      const activitySubjectCounts = new Map(
        await Promise.all(
          activities.map(async (activity) => {
            const subjects = await this.packageContext.loadActivitySubjects(activity.id);
            return [activity.id, { count: subjects.length, names: subjects.map((subject) => subject.name) }] as const;
          }),
        ),
      );

      const input: ActivityTimingInput = {
        eventType,
        locationContext,
        activities: activities.map((activity) => ({
          id: activity.id,
          name: activity.name,
          description: activity.description ?? undefined,
          currentDurationMinutes: activity.duration_minutes ?? undefined,
          subjectCount: activitySubjectCounts.get(activity.id)?.count ?? allSubjects.length,
          subjectNames: activitySubjectCounts.get(activity.id)?.names ?? allSubjects.map((subject) => subject.name),
        })),
      };

      const result = await this.activityTiming.execute(input, measured.stepLogger);
      let changedActivityCount = 0;
      for (const estimate of result.activities) {
        const activity = activities.find((candidate) => candidate.id === estimate.activityId);
        const previousDuration = activity?.duration_minutes ?? null;
        const previousStartTime = (activity as PlannerActivityRecord & { start_time?: string | null } | undefined)?.start_time ?? null;
        const durationChanged = previousDuration !== estimate.suggestedDurationMinutes;
        const startChanged = previousStartTime !== estimate.suggestedStartTime;
        if (durationChanged || startChanged) {
          changedActivityCount += 1;
        }
        await this.prisma.packageActivity.update({
          where: { id: estimate.activityId },
          data: {
            duration_minutes: estimate.suggestedDurationMinutes,
            start_time: estimate.suggestedStartTime,
          },
        });
        if (activity) {
          activity.duration_minutes = estimate.suggestedDurationMinutes;
          (activity as PlannerActivityRecord & { start_time?: string | null }).start_time = estimate.suggestedStartTime;
        }
      }

      this.logger.log('planPackageActivities: AI timing estimation complete');
      measured.stepLogger?.log('Persisted timing estimates to PackageActivity');
      const metrics = measured.getMetrics();
      return {
        succeeded: true,
        changedActivityCount,
        metrics,
        value: buildPlannerStepValue(activities.length, changedActivityCount, metrics),
      };
    } catch (err) {
      const message = (err as Error).message;
      this.logger.warn(`planPackageActivities: timing estimation failed — ${message}`);
      measured.stepLogger?.fail(message, 'Keeping existing timing values');
      const metrics = measured.getMetrics();
      return {
        succeeded: false,
        changedActivityCount: 0,
        metrics,
        value: buildPlannerStepValue(activities.length, 0, metrics),
      };
    }
  }

  async runDescriptionEnrichment(
    activities: PlannerActivityRecord[],
    allSubjects: PlannerSubject[],
    eventType: string,
    stepLogger?: StepLogger,
  ): Promise<DescriptionStepResult> {
    const measured = createMeasuredStepLogger(stepLogger);
    const candidateCount = activities.filter((activity) => !activity.description?.trim()).length;
    try {
      const input: ActivityDescriptionInput = {
        eventType,
        activities: activities.map((activity) => ({
          id: activity.id,
          name: activity.name,
          description: activity.description ?? undefined,
          subjectNames: allSubjects.map((subject) => subject.name),
        })),
      };

      const result = await this.activityDescription.execute(input, measured.stepLogger);
      for (const enriched of result.activities) {
        await this.prisma.packageActivity.update({
          where: { id: enriched.activityId },
          data: { description: enriched.description },
        });

        const activity = activities.find((candidate) => candidate.id === enriched.activityId);
        if (activity) {
          activity.description = enriched.description;
        }
      }

      if (result.activities.length > 0) {
        this.logger.log(`planPackageActivities: enriched ${result.activities.length} activity descriptions`);
      }

      measured.stepLogger?.log('Persisted enriched descriptions to PackageActivity');
      const metrics = measured.getMetrics();
      return {
        succeeded: true,
        updatedActivityCount: result.activities.length,
        metrics,
        value: buildPlannerStepValue(candidateCount, result.activities.length, metrics),
      };
    } catch (err) {
      const message = (err as Error).message;
      this.logger.warn(`planPackageActivities: description enrichment failed — ${message}`);
      measured.stepLogger?.fail(message, 'Keeping existing descriptions');
      const metrics = measured.getMetrics();
      return {
        succeeded: false,
        updatedActivityCount: 0,
        metrics,
        value: buildPlannerStepValue(candidateCount, 0, metrics),
      };
    }
  }
}