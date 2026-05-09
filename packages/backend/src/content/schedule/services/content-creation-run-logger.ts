import { Logger } from '@nestjs/common';
import { appendFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { randomUUID } from 'crypto';
import { join } from 'path';

type RunStatus = 'running' | 'completed' | 'failed';

interface ContentCreationManifest {
  runId: string;
  status: RunStatus;
  startedAt: string;
  completedAt?: string;
  route: string;
  source: 'package-wizard';
  brandId: number;
  packageId: number;
  packageName?: string;
  filmId?: number;
  filmName?: string;
  packageFilmId?: number;
  files: {
    master: string;
    request?: string;
    result?: string;
  };
}

export interface ContentCreationRunInit {
  brandId: number;
  packageId: number;
  packageName?: string;
  route: string;
  backendRootOverride?: string;
}

export class ContentCreationRunLogger {
  private readonly appLogger = new Logger(ContentCreationRunLogger.name);
  private readonly startedAtMs = Date.now();
  private readonly backendRoot: string;
  private readonly dateDirectory = new Date().toISOString().slice(0, 10);
  private readonly runId = `run-${timestampSegment()}-${randomUUID().slice(0, 8)}`;
  private readonly runDirectory: string;
  private readonly masterLogPath: string;
  private readonly manifestPath: string;
  private readonly manifest: ContentCreationManifest;

  constructor(init: ContentCreationRunInit) {
    this.backendRoot = init.backendRootOverride ?? resolveBackendRoot();
    this.runDirectory = join(
      this.backendRoot,
      'logs',
      'content-creator-ai',
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
      source: 'package-wizard',
      brandId: init.brandId,
      packageId: init.packageId,
      packageName: init.packageName,
      files: {
        master: 'master.log',
      },
    };
    this.flushManifest();
    this.log('RUN', 'Content creation run started', {
      brandId: init.brandId,
      packageId: init.packageId,
      packageName: init.packageName,
      runDirectory: this.runDirectory,
    });
  }

  getRunId(): string {
    return this.runId;
  }

  attachFilm(filmId: number, filmName: string, packageFilmId: number): void {
    this.manifest.filmId = filmId;
    this.manifest.filmName = filmName;
    this.manifest.packageFilmId = packageFilmId;
    this.flushManifest();
    this.log('RUN', 'Attached created film', { filmId, filmName, packageFilmId });
  }

  writeRequest(payload: unknown): void {
    this.writeJson('request.json', payload);
    this.manifest.files.request = 'request.json';
    this.flushManifest();
    this.log('REQUEST', 'Captured content creation request payload', payload);
  }

  writeResult(payload: unknown): void {
    this.writeJson('result.json', payload);
    this.manifest.files.result = 'result.json';
    this.flushManifest();
    this.log('RESULT', 'Captured content creation result payload', payload);
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

  section(title: string, value?: unknown): void {
    appendFileSync(this.masterLogPath, `\n${'='.repeat(92)}\n`, 'utf8');
    appendFileSync(this.masterLogPath, `${title}\n`, 'utf8');
    appendFileSync(this.masterLogPath, `${'='.repeat(92)}\n`, 'utf8');
    if (value !== undefined) {
      for (const line of serializeValue(value).split('\n')) {
        appendFileSync(this.masterLogPath, `  ${line}\n`, 'utf8');
      }
    }
  }

  complete(summary?: unknown): void {
    this.manifest.status = 'completed';
    this.manifest.completedAt = new Date().toISOString();
    this.log('RUN', 'Content creation run completed', summary);
    this.flushManifest();
  }

  fail(message: string, data?: unknown): void {
    this.manifest.status = 'failed';
    this.manifest.completedAt = new Date().toISOString();
    this.error('RUN', message, data);
    this.flushManifest();
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
    ContentCreationRunLogger.name,
  );
  return cwd;
}