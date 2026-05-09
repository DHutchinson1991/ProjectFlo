import { Injectable } from '@nestjs/common';
import { PlanningStatus } from '@prisma/client';
import { PackageCreationRunLogger } from '../../../catalog/packages/creation/run/package-creation-run-logger';
import { PackagePlanningSummary, PlannerSummaryStatus } from '../activity-planning.types';
import { PlanningEventData, PlanningEventsService } from './planning-events.service';

interface RecordStepArgs {
  packageId: number;
  totalSteps: number;
  summary: PackagePlanningSummary;
  step: string;
  label: string;
  status: PlannerSummaryStatus;
  stepIndex: number;
  runLogger?: PackageCreationRunLogger;
  activityName?: string;
  error?: string;
  data?: PlanningEventData;
}

interface EmitLiveUpdateArgs {
  packageId: number;
  totalSteps: number;
  step: string;
  label: string;
  status?: 'started' | 'completed' | 'failed';
  stepIndex: number;
  activityName?: string;
  momentId?: number;
  momentName?: string;
  subjectIds?: number[];
  subjectNames?: string[];
  error?: string;
  data?: PlanningEventData;
}

@Injectable()
export class PackagePlanningProgressService {
  constructor(private readonly planningEvents: PlanningEventsService) {}

  createSummary(packageId: number): PackagePlanningSummary {
    return {
      packageId,
      startedAt: new Date().toISOString(),
      finalStatus: 'RUNNING',
      eventType: '',
      totalActivities: 0,
      totalSubjects: 0,
      steps: [],
      errors: [],
    };
  }

  emitLiveUpdate({
    packageId,
    totalSteps,
    step,
    label,
    status,
    stepIndex,
    activityName,
    momentId,
    momentName,
    subjectIds,
    subjectNames,
    error,
    data,
  }: EmitLiveUpdateArgs): void {
    this.planningEvents.emit({
      packageId,
      step,
      label,
      status: status ?? 'started',
      stepIndex,
      totalSteps,
      activityName,
      momentId,
      momentName,
      subjectIds,
      subjectNames,
      error,
      data,
    });
  }

  recordStep({
    packageId,
    totalSteps,
    summary,
    step,
    label,
    status,
    stepIndex,
    runLogger,
    activityName,
    error,
    data,
  }: RecordStepArgs): void {
    if (status !== 'skipped') {
      this.planningEvents.emit({
        packageId,
        step,
        label,
        status,
        stepIndex,
        totalSteps,
        activityName,
        error,
        data,
      });
    }

    const nextEntry = { step, label, status, stepIndex, activityName, error, data };
    const existingIndex = summary.steps.findIndex((entry) => this.isSameSummaryStep(entry, nextEntry));

    if (existingIndex >= 0) {
      const existingEntry = summary.steps[existingIndex];
      summary.steps[existingIndex] = {
        ...existingEntry,
        ...nextEntry,
        error: error ?? existingEntry.error,
        data: data ?? existingEntry.data,
      };
    } else {
      summary.steps.push(nextEntry);
    }

    if (!runLogger) return;

    const payload = { step, label, stepIndex, activityName, error, ...data };
    if (status === 'failed') {
      runLogger.warn('PLANNER', `${label} failed`, payload);
      return;
    }

    if (status === 'skipped') {
      runLogger.log('PLANNER', `${label} skipped`, payload);
      return;
    }

    runLogger.log('PLANNER', `${label} ${status}`, payload);
  }

  markReady(summary: PackagePlanningSummary): void {
    summary.finalStatus = PlanningStatus.READY;
    summary.completedAt = new Date().toISOString();
  }

  markFailed(summary: PackagePlanningSummary, error: string): void {
    this.planningEvents.emit({
      packageId: summary.packageId,
      step: 'error',
      label: 'Planning failed',
      status: 'failed',
      stepIndex: 0,
      totalSteps: 0,
      error,
    });

    summary.finalStatus = PlanningStatus.FAILED;
    summary.completedAt = new Date().toISOString();
    summary.errors.push(error);
    summary.steps.push({
      step: 'error',
      label: 'Planning failed',
      status: 'failed',
      stepIndex: 0,
      error,
    });
  }

  writeSummary(summary: PackagePlanningSummary, runLogger?: PackageCreationRunLogger): void {
    runLogger?.writePlannerSummary(summary);
  }

  private isSameSummaryStep(
    left: PackagePlanningSummary['steps'][number],
    right: PackagePlanningSummary['steps'][number],
  ): boolean {
    return left.step === right.step
      && left.stepIndex === right.stepIndex
      && (left.activityName ?? null) === (right.activityName ?? null);
  }
}