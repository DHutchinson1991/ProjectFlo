import { Injectable, Logger } from '@nestjs/common';
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'fs';
import { randomUUID } from 'crypto';
import { join } from 'path';

type RunStatus = 'running' | 'completed' | 'failed';

interface DayBlueprintAiRunManifest {
  runId: string;
  status: RunStatus;
  startedAt: string;
  completedAt?: string;
  route: string;
  source: 'day-designer';
  brandId: number;
  blueprintId: number;
  blueprintName: string;
  versionId: number;
  dayId: number;
  dayName: string;
  dbRunId?: number;
  files: {
    master: string;
    request?: string;
    llmResponse?: string;
    report?: string;
  };
}

export interface DayBlueprintAiKnowledgeReport {
  v: 1;
  run: string;
  db?: number;
  status: 'running' | 'completed' | 'failed';
  ids: { brand: number; blueprint: number; version: number; day: number };
  label: { blueprint: string; day: string };
  prompt: { chars: number; brief: string };
  llm?: {
    model: string;
    provider: string;
    pt?: number;
    ct?: number;
    tt?: number;
    qms: number;
    rms: number;
    replyChars: number;
  };
  plan?: {
    activities: number;
    moments: number;
    actions: number;
    placements: number;
    missingActions: number;
    missingPlacements: number;
    outline: Array<{
      i: number;
      n: string;
      s?: string;
      d?: number;
      m: Array<{ i: number; n: string; sec?: number; key: boolean; a: number; p: number; r: string[] }>;
    }>;
  };
  persisted?: {
    activities: number;
    moments: number;
    actions: number;
    placements: number;
    momentsWithCoverage: number;
    coveragePct: number;
  };
  /**
   * Per-phase timing telemetry for the two-phase pipeline. Outline = single
   * streaming Phase 1 call. Expansion = N parallel Phase 2 calls (one per
   * activity); `expansionParallelism` records the parallel fan-out for
   * triaging Promise.all behaviour vs. sequential regressions.
   */
  phases?: {
    outlineMs: number;
    expansionMs: number;
    expansionParallelism: number;
  };
  error?: string;
}

export interface DayBlueprintAiRunLoggerInit {
  brandId: number;
  blueprintId: number;
  blueprintName: string;
  versionId: number;
  dayId: number;
  dayName: string;
  route: string;
  backendRootOverride?: string;
}

@Injectable()
export class DayBlueprintAiRunLoggerFactory {
  create(init: DayBlueprintAiRunLoggerInit): DayBlueprintAiRunLogger {
    return new DayBlueprintAiRunLogger(init);
  }
}

export class DayBlueprintAiRunLogger {
  private readonly startedAtMs = Date.now();
  private readonly backendRoot: string;
  private readonly dateDirectory = new Date().toISOString().slice(0, 10);
  private readonly runId = `run-${timestampSegment()}-${randomUUID().slice(0, 8)}`;
  private readonly runDirectory: string;
  private readonly masterLogPath: string;
  private readonly manifestPath: string;
  private readonly manifest: DayBlueprintAiRunManifest;

  constructor(init: DayBlueprintAiRunLoggerInit) {
    this.backendRoot = init.backendRootOverride ?? resolveBackendRoot();
    this.runDirectory = join(this.backendRoot, 'logs', 'day-designer-ai', this.dateDirectory, this.runId);
    this.masterLogPath = join(this.runDirectory, 'master.log');
    this.manifestPath = join(this.runDirectory, 'manifest.json');
    mkdirSync(this.runDirectory, { recursive: true });
    this.manifest = {
      runId: this.runId,
      status: 'running',
      startedAt: new Date().toISOString(),
      route: init.route,
      source: 'day-designer',
      brandId: init.brandId,
      blueprintId: init.blueprintId,
      blueprintName: init.blueprintName,
      versionId: init.versionId,
      dayId: init.dayId,
      dayName: init.dayName,
      files: { master: 'master.log' },
    };
    this.flushManifest();
    this.log('RUN', 'Day Designer AI run started', {
      brandId: init.brandId,
      blueprintId: init.blueprintId,
      versionId: init.versionId,
      dayId: init.dayId,
      runDirectory: this.runDirectory,
    });
  }

  getRunId(): string {
    return this.runId;
  }

  attachDatabaseRun(dbRunId: number): void {
    this.manifest.dbRunId = dbRunId;
    this.flushManifest();
    this.log('RUN', 'Attached DayBlueprintAiRun row', { dbRunId });
  }

  writeRequest(payload: unknown): void {
    this.writeJson('request.json', payload, true);
    this.manifest.files.request = 'request.json';
    this.flushManifest();
    this.log('REQUEST', 'Captured Day Designer AI request payload', { file: 'request.json' });
  }

  writeLlmResponse(payload: unknown): void {
    this.writeJson('llm-response.json', payload, true);
    this.manifest.files.llmResponse = 'llm-response.json';
    this.flushManifest();
    this.log('LLM', 'Captured Day Designer AI response payload', { file: 'llm-response.json' });
  }

  writeReport(report: DayBlueprintAiKnowledgeReport): void {
    this.writeJson('report.json', report, false);
    this.manifest.files.report = 'report.json';
    this.flushManifest();
    this.log('REPORT', 'Updated compact Day Designer AI report', {
      file: 'report.json',
      status: report.status,
      activities: report.plan?.activities ?? report.persisted?.activities,
      moments: report.plan?.moments ?? report.persisted?.moments,
      actions: report.plan?.actions ?? report.persisted?.actions,
      placements: report.plan?.placements ?? report.persisted?.placements,
    });
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
    this.log('RUN', 'Day Designer AI run completed', summary);
    this.flushManifest();
  }

  fail(message: string, data?: unknown): void {
    this.manifest.status = 'failed';
    this.manifest.completedAt = new Date().toISOString();
    this.error('RUN', message, data);
    this.flushManifest();
  }

  static readReport(runKey: string, backendRootOverride?: string): DayBlueprintAiKnowledgeReport | null {
    const runDirectory = findRunDirectory(runKey, backendRootOverride);
    if (!runDirectory) return null;
    const reportPath = join(runDirectory, 'report.json');
    if (!existsSync(reportPath)) return null;

    try {
      return JSON.parse(readFileSync(reportPath, 'utf8')) as DayBlueprintAiKnowledgeReport;
    } catch {
      return null;
    }
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

  private writeJson(fileName: string, value: unknown, pretty: boolean): void {
    writeFileSync(join(this.runDirectory, fileName), JSON.stringify(value, null, pretty ? 2 : 0), 'utf8');
  }

  private flushManifest(): void {
    writeFileSync(this.manifestPath, JSON.stringify(this.manifest, null, 2), 'utf8');
  }
}

function findRunDirectory(runKey: string, backendRootOverride?: string): string | null {
  if (!runKey || runKey.includes('/') || runKey.includes('\\')) return null;
  const logRoot = join(backendRootOverride ?? resolveBackendRoot(), 'logs', 'day-designer-ai');
  if (!existsSync(logRoot)) return null;

  for (const dateDirectory of readdirSync(logRoot, { withFileTypes: true })) {
    if (!dateDirectory.isDirectory()) continue;
    const candidate = join(logRoot, dateDirectory.name, runKey);
    if (existsSync(candidate)) return candidate;
  }

  return null;
}

function serializeValue(value: unknown): string {
  if (typeof value === 'string') return value;
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
    DayBlueprintAiRunLogger.name,
  );
  return cwd;
}