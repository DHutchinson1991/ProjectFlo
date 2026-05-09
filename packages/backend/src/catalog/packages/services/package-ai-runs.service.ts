import { Injectable, NotFoundException } from '@nestjs/common';
import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import {
  PackageAiRunTranscriptStep,
  parsePackageAiRunTranscript,
} from './package-ai-run-transcript.parser';

type RunStatus = 'running' | 'completed' | 'failed';
type RunSource = 'catalog' | 'inquiry';

interface PackageCreationRunManifest {
  runId: string;
  status: RunStatus;
  startedAt: string;
  completedAt?: string;
  route: string;
  source: RunSource;
  brandId: number;
  eventTypeId?: number;
  eventSubtypeId?: number;
  packageId?: number;
  packageName?: string;
  files: {
    master: string;
    request?: string;
    builderSummary?: string;
    plannerSummary?: string;
  };
}

interface PackagePlannerSummaryStep {
  step: string;
  label: string;
  status: string;
  stepIndex: number;
  activityName?: string;
  error?: string;
  data?: Record<string, unknown>;
}

interface PackagePlannerSummary {
  finalStatus?: string;
  errors?: string[];
  steps?: PackagePlannerSummaryStep[];
}

interface PackageRunRecord {
  manifest: PackageCreationRunManifest;
  plannerSummary: PackagePlannerSummary | null;
  runDirectory: string;
}

export interface PackageAiRunSummary {
  runId: string;
  status: RunStatus;
  source: RunSource;
  route: string;
  startedAt: string;
  completedAt: string | null;
  packageId: number;
  packageName: string | null;
  plannerStatus: string | null;
  completedSteps: number;
  totalSteps: number;
  error: string | null;
}

export interface PackageAiRunDetail extends PackageAiRunSummary {
  masterLog: string | null;
  transcriptSteps: PackageAiRunTranscriptStep[];
  request: unknown | null;
  builderSummary: unknown | null;
  plannerSummary: PackagePlannerSummary | null;
}

@Injectable()
export class PackageAiRunsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(packageId: number, brandId: number): Promise<PackageAiRunSummary[]> {
    await this.assertPackageAccess(packageId, brandId);
    return this.readPackageRuns(packageId, brandId).map((run) => this.toSummary(run));
  }

  async findOne(packageId: number, runId: string, brandId: number): Promise<PackageAiRunDetail> {
    await this.assertPackageAccess(packageId, brandId);

    const run = this.readPackageRuns(packageId, brandId).find((candidate) => candidate.manifest.runId === runId);
    if (!run) {
      throw new NotFoundException(`AI run ${runId} not found for package #${packageId}`);
    }

    const masterLog = this.readText(join(run.runDirectory, run.manifest.files.master));

    return {
      ...this.toSummary(run),
      masterLog,
      transcriptSteps: parsePackageAiRunTranscript(masterLog),
      request: run.manifest.files.request
        ? this.readJson<unknown>(join(run.runDirectory, run.manifest.files.request))
        : null,
      builderSummary: run.manifest.files.builderSummary
        ? this.readJson<unknown>(join(run.runDirectory, run.manifest.files.builderSummary))
        : null,
      plannerSummary: run.plannerSummary,
    };
  }

  private async assertPackageAccess(packageId: number, brandId: number): Promise<void> {
    const pkg = await this.prisma.service_packages.findFirst({
      where: { id: packageId, brand_id: brandId },
      select: { id: true },
    });

    if (!pkg) {
      throw new NotFoundException(`Package #${packageId} not found`);
    }
  }

  private readPackageRuns(packageId: number, brandId: number): PackageRunRecord[] {
    const logRoot = join(resolveBackendRoot(), 'logs', 'package-creator-ai');
    if (!existsSync(logRoot)) {
      return [];
    }

    const runs: PackageRunRecord[] = [];
    for (const runDirectory of this.listRunDirectories(logRoot)) {
      const manifest = this.readJson<PackageCreationRunManifest>(join(runDirectory, 'manifest.json'));
      if (!manifest || manifest.brandId !== brandId || manifest.packageId !== packageId) {
        continue;
      }

      const plannerSummary = manifest.files.plannerSummary
        ? this.normalizePlannerSummary(
          this.readJson<PackagePlannerSummary>(join(runDirectory, manifest.files.plannerSummary)),
        )
        : null;

      runs.push({ manifest, plannerSummary, runDirectory });
    }

    return runs.sort((left, right) => right.manifest.startedAt.localeCompare(left.manifest.startedAt));
  }

  private listRunDirectories(logRoot: string): string[] {
    return readdirSync(logRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .flatMap((dateDirectory) => {
        const datedRoot = join(logRoot, dateDirectory.name);
        return readdirSync(datedRoot, { withFileTypes: true })
          .filter((entry) => entry.isDirectory())
          .map((runDirectory) => join(datedRoot, runDirectory.name));
      });
  }

  private toSummary(run: PackageRunRecord): PackageAiRunSummary {
    const steps = run.plannerSummary?.steps ?? [];
    const completedSteps = steps.filter(
      (step) => step.status === 'completed' || step.status === 'skipped',
    ).length;
    const totalSteps = steps.length;
    const error = run.plannerSummary?.errors?.at(-1) ?? null;

    return {
      runId: run.manifest.runId,
      status: run.manifest.status,
      source: run.manifest.source,
      route: run.manifest.route,
      startedAt: run.manifest.startedAt,
      completedAt: run.manifest.completedAt ?? null,
      packageId: run.manifest.packageId ?? 0,
      packageName: run.manifest.packageName ?? null,
      plannerStatus: run.plannerSummary?.finalStatus ?? null,
      completedSteps,
      totalSteps,
      error,
    };
  }

  private readJson<T>(filePath: string): T | null {
    if (!existsSync(filePath)) {
      return null;
    }

    try {
      return JSON.parse(readFileSync(filePath, 'utf8')) as T;
    } catch {
      return null;
    }
  }

  private readText(filePath: string): string | null {
    if (!existsSync(filePath)) {
      return null;
    }

    try {
      return readFileSync(filePath, 'utf8');
    } catch {
      return null;
    }
  }

  private normalizePlannerSummary(summary: PackagePlannerSummary | null): PackagePlannerSummary | null {
    if (!summary?.steps?.length) {
      return summary;
    }

    const normalizedSteps: PackagePlannerSummaryStep[] = [];
    const stepIndexes = new Map<string, number>();

    for (const step of summary.steps) {
      if (step.step === 'done' || step.step === 'error') {
        continue;
      }

      const key = buildPlannerStepKey(step);
      const existingIndex = stepIndexes.get(key);

      if (existingIndex == null) {
        stepIndexes.set(key, normalizedSteps.length);
        normalizedSteps.push({ ...step });
        continue;
      }

      normalizedSteps[existingIndex] = {
        ...normalizedSteps[existingIndex],
        ...step,
        error: step.error ?? normalizedSteps[existingIndex].error,
        data: step.data ?? normalizedSteps[existingIndex].data,
      };
    }

    return {
      ...summary,
      steps: normalizedSteps,
    };
  }
}

function buildPlannerStepKey(step: PackagePlannerSummaryStep): string {
  return `${step.stepIndex}:${step.step}:${step.activityName ?? ''}`;
}

function resolveBackendRoot(): string {
  const cwd = process.cwd();
  const nestedBackend = join(cwd, 'packages', 'backend');

  if (existsSync(join(cwd, 'src')) && existsSync(join(cwd, 'prisma'))) {
    return cwd;
  }

  if (existsSync(join(nestedBackend, 'src')) && existsSync(join(nestedBackend, 'prisma'))) {
    return nestedBackend;
  }

  return cwd;
}