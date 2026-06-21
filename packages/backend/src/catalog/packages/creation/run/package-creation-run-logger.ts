import { Logger } from '@nestjs/common';
import { appendFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { randomUUID } from 'crypto';
import { join } from 'path';
import { StepLlmCallDetails, StepLogger } from '../../../../ai/orchestration/pipeline-logger';

type RunStatus = 'running' | 'completed' | 'failed';

interface PackageCreationManifest {
  runId: string;
  status: RunStatus;
  startedAt: string;
  completedAt?: string;
  route: string;
  source: PackageCreationSource;
  brandId: number;
  eventTypeId?: number;
  eventSubtypeId?: number;
  packageId?: number;
  packageName?: string;
  planningMode?: 'full' | 'blueprint';
  files: {
    master: string;
    request?: string;
    builderSummary?: string;
    plannerSummary?: string;
  };
}

export type PackageCreationSource = 'catalog' | 'inquiry';

export interface PackageCreationRunInit {
  brandId: number;
  source: PackageCreationSource;
  route: string;
  packageName: string;
  eventTypeId?: number;
  eventSubtypeId?: number;
  backendRootOverride?: string;
}

export class PackageCreationRunLogger {
  private readonly appLogger = new Logger(PackageCreationRunLogger.name);
  private readonly startedAtMs = Date.now();
  private readonly backendRoot: string;
  private readonly dateDirectory = new Date().toISOString().slice(0, 10);
  private readonly runId = `run-${timestampSegment()}-${randomUUID().slice(0, 8)}`;
  private readonly runDirectory: string;
  private readonly masterLogPath: string;
  private readonly manifestPath: string;
  private readonly manifest: PackageCreationManifest;
  private stepCounter = 0;

  constructor(init: PackageCreationRunInit) {
    this.backendRoot = init.backendRootOverride ?? resolveBackendRoot();
    this.runDirectory = join(
      this.backendRoot,
      'logs',
      'package-creator-ai',
      this.dateDirectory,
      this.runId,
    );
    this.masterLogPath = join(this.runDirectory, 'master.log');
    this.manifestPath = join(this.runDirectory, 'manifest.json');
    mkdirSync(this.runDirectory, { recursive: true });
    this.manifest = {
      runId: this.runId,
      status: 'running',
      startedAt: new Date().toISOString(),
      route: init.route,
      source: init.source,
      brandId: init.brandId,
      eventTypeId: init.eventTypeId,
      eventSubtypeId: init.eventSubtypeId,
      packageName: init.packageName,
      files: {
        master: 'master.log',
      },
    };
    this.flushManifest();
    this.log('RUN', 'Package creation run started', {
      brandId: init.brandId,
      source: init.source,
      eventTypeId: init.eventTypeId,
      eventSubtypeId: init.eventSubtypeId,
      packageName: init.packageName,
      runDirectory: this.runDirectory,
    });
  }

  attachPackage(packageId: number, packageName?: string): void {
    this.manifest.packageId = packageId;
    if (packageName) {
      this.manifest.packageName = packageName;
    }
    this.flushManifest();
    this.log('RUN', 'Attached created package', {
      packageId,
      packageName: this.manifest.packageName,
    });
  }

  setPlanningMode(planningMode: 'full' | 'blueprint'): void {
    this.manifest.planningMode = planningMode;
    this.flushManifest();
    this.log('PLANNER', 'Set planning mode for this run', { planningMode });
  }

  writeRequest(payload: unknown): void {
    this.writeJson('request.json', payload);
    this.manifest.files.request = 'request.json';
    this.flushManifest();
    this.log('REQUEST', 'Captured package creation request payload', payload);
  }

  writeBuilderSummary(summary: unknown): void {
    this.writeJson('builder-summary.json', summary);
    this.manifest.files.builderSummary = 'builder-summary.json';
    this.flushManifest();
    this.log('BUILDER', 'Updated builder summary', summary);
  }

  writePlannerSummary(summary: unknown): void {
    this.writeJson('planner-summary.json', summary);
    this.manifest.files.plannerSummary = 'planner-summary.json';
    this.flushManifest();
    this.log('PLANNER', 'Updated planner summary', summary);
  }

  startSkillLog(skillKey: string, label: string, context?: unknown): PackageCreationSkillLogger {
    this.stepCounter += 1;
    return new PackageCreationSkillLogger(skillKey, label, this.stepCounter, context, this);
  }

  log(phase: string, message: string, data?: unknown): void {
    this.appendEntry('INFO', phase, message, data);
  }

  warn(phase: string, message: string, data?: unknown): void {
    this.appendEntry('WARN', phase, message, data);
  }

  error(phase: string, message: string, data?: unknown): void {
    this.appendEntry('ERROR', phase, message, data);
  }

  complete(summary?: unknown): void {
    this.manifest.status = 'completed';
    this.manifest.completedAt = new Date().toISOString();
    if (summary) {
      this.log('RUN', 'Package creation run completed', summary);
    } else {
      this.log('RUN', 'Package creation run completed');
    }
    this.flushManifest();
  }

  fail(message: string, data?: unknown): void {
    this.manifest.status = 'failed';
    this.manifest.completedAt = new Date().toISOString();
    this.error('RUN', message, data);
    this.flushManifest();
  }

  relativePath(filePath: string): string {
    return filePath.replace(`${this.runDirectory}\\`, '').replace(/\\/g, '/');
  }

  appendStepHeader(stepNumber: number, skillKey: string, label: string, context?: unknown): void {
    const line = '='.repeat(92);
    appendFileSync(this.masterLogPath, `\n${line}\n`, 'utf8');
    appendFileSync(this.masterLogPath, `STEP ${String(stepNumber).padStart(2, '0')}: ${label}\n`, 'utf8');
    appendFileSync(this.masterLogPath, `Skill Key: ${skillKey}\n`, 'utf8');
    appendFileSync(this.masterLogPath, `Started: ${new Date().toISOString()}\n`, 'utf8');
    appendFileSync(this.masterLogPath, `${line}\n`, 'utf8');
    if (context !== undefined) {
      this.appendStepSection(stepNumber, label, 'Context', context);
    }
  }

  appendStepSection(stepNumber: number, label: string, title: string, value: unknown): void {
    appendFileSync(
      this.masterLogPath,
      `\n[STEP ${String(stepNumber).padStart(2, '0')}] ${label} :: ${title}\n`,
      'utf8',
    );
    for (const line of serializeValue(value).split('\n')) {
      appendFileSync(this.masterLogPath, `  ${line}\n`, 'utf8');
    }
  }

  appendStepMessage(stepNumber: number, label: string, level: string, message: string): void {
    appendFileSync(
      this.masterLogPath,
      `[${new Date().toISOString()} +${Date.now() - this.startedAtMs}ms] [STEP ${String(stepNumber).padStart(2, '0')}] [${level}] ${label} :: ${message}\n`,
      'utf8',
    );
  }

  private appendEntry(level: 'INFO' | 'WARN' | 'ERROR', phase: string, message: string, data?: unknown): void {
    const header = `[${new Date().toISOString()} +${Date.now() - this.startedAtMs}ms] [${level}] [${phase}] ${message}`;
    appendFileSync(this.masterLogPath, `${header}\n`, 'utf8');
    if (data !== undefined) {
      for (const line of serializeValue(data).split('\n')) {
        appendFileSync(this.masterLogPath, `  ${line}\n`, 'utf8');
      }
    }
  }

  private writeJson(fileName: string, value: unknown): void {
    writeFileSync(join(this.runDirectory, fileName), JSON.stringify(value, null, 2), 'utf8');
  }

  private flushManifest(): void {
    writeFileSync(this.manifestPath, JSON.stringify(this.manifest, null, 2), 'utf8');
  }
}

class PackageCreationSkillLogger implements StepLogger {
  private readonly startedAtMs = Date.now();
  private finished = false;

  constructor(
    private readonly skillKey: string,
    private readonly label: string,
    private readonly stepNumber: number,
    context: unknown,
    private readonly runLogger: PackageCreationRunLogger,
  ) {
    this.runLogger.appendStepHeader(this.stepNumber, this.skillKey, this.label, context);
    this.runLogger.log('SKILL', `Started ${label}`, {
      stepNumber: this.stepNumber,
      skillKey: this.skillKey,
      context,
    });
  }

  input(data: unknown): void {
    this.writeSection('Input', data);
  }

  output(data: unknown): void {
    this.writeSection('Output', data);
  }

  log(message: string): void {
    this.appendLine(this.prefix('INFO', message));
  }

  warn(message: string): void {
    this.appendLine(this.prefix('WARN', message));
  }

  error(message: string): void {
    this.appendLine(this.prefix('ERROR', message));
  }

  llmCall(details: StepLlmCallDetails): void {
    this.writeSection('LLM Call', {
      skill: details.skill,
      model: details.model,
      promptLength: details.promptLength,
      responseLength: details.responseLength,
      usage: details.usage,
    });
    if (details.rawPrompt) {
      this.writeSection('LLM Prompt', details.rawPrompt);
    }
    if (details.rawResponse) {
      this.writeSection('LLM Response', details.rawResponse);
    }
  }

  timing(label: string, ms: number): void {
    this.appendLine(this.prefix('TIMING', `${label}: ${ms}ms`));
  }

  complete(resultSummary?: string): void {
    if (this.finished) return;
    this.finished = true;
    this.appendLine(this.prefix('DONE', `Completed in ${Date.now() - this.startedAtMs}ms${resultSummary ? ` - ${resultSummary}` : ''}`));
    this.runLogger.log('SKILL', `${this.label} completed`, {
      stepNumber: this.stepNumber,
      skillKey: this.skillKey,
      resultSummary,
    });
  }

  fail(error: string, fallbackUsed?: string): void {
    if (this.finished) return;
    this.finished = true;
    this.appendLine(this.prefix('ERROR', `Failed in ${Date.now() - this.startedAtMs}ms: ${error}`));
    if (fallbackUsed) {
      this.appendLine(this.prefix('WARN', `Fallback: ${fallbackUsed}`));
    }
    this.runLogger.warn('SKILL', `${this.label} failed`, {
      stepNumber: this.stepNumber,
      skillKey: this.skillKey,
      error,
      fallbackUsed,
    });
  }

  private writeSection(title: string, value: unknown): void {
    this.runLogger.appendStepSection(this.stepNumber, this.label, title, value);
  }

  private appendLine(line: string): void {
    this.runLogger.appendStepMessage(this.stepNumber, this.label, line.includes('[WARN]') ? 'WARN' : line.includes('[ERROR]') ? 'ERROR' : line.includes('[DONE]') ? 'DONE' : line.includes('[TIMING]') ? 'TIMING' : 'INFO', line.replace(/^\[[^\]]+\s\+\d+ms\] \[[A-Z]+\] /, ''));
  }

  private prefix(level: string, message: string): string {
    return `[${new Date().toISOString()} +${Date.now() - this.startedAtMs}ms] [${level}] ${message}`;
  }
}

function serializeValue(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  return JSON.stringify(value, null, 2);
}

function timestampSegment(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function resolveBackendRoot(): string {
  const cwd = process.cwd();
  if (existsSync(join(cwd, 'src')) && existsSync(join(cwd, 'prisma'))) {
    return cwd;
  }

  const nestedBackend = join(cwd, 'packages', 'backend');
  if (existsSync(join(nestedBackend, 'src')) && existsSync(join(nestedBackend, 'prisma'))) {
    return nestedBackend;
  }

  Logger.warn(
    `Falling back to process.cwd() for backend log root: ${cwd}`,
    PackageCreationRunLogger.name,
  );
  return cwd;
}
