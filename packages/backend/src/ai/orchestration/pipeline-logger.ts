import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

export type PipelineType = 'blocking' | 'prep' | 'render';

export interface StepLlmCallDetails {
  skill?: string;
  promptLength?: number;
  responseLength?: number;
  model?: string;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  rawPrompt?: string;
  rawResponse?: string;
}

export interface StepLogger {
  input(data: unknown): void;
  output(data: unknown): void;
  log(message: string): void;
  warn(message: string): void;
  error(message: string): void;
  llmCall(details: StepLlmCallDetails): void;
  timing(label: string, ms: number): void;
  complete(resultSummary?: string): void;
  fail(error: string, fallbackUsed?: string): void;
}

/**
 * Unified pipeline logger — one file per full pipeline run.
 * Replaces both AiDirectorLogger and per-skill writeSkillLog.
 * Captures EVERY step: inputs, outputs, timing, LLM calls, warnings.
 */
export class PipelineLogger {
  private lines: string[] = [];
  private readonly startTime = Date.now();
  private filePath: string;
  private stepCounter = 0;

  constructor(
    private readonly pipelineType: PipelineType,
    private readonly contextId: number,
    private readonly label: string,
  ) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const dateDir = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const dir = join(process.cwd(), 'prompt-logs', 'pipeline', dateDir);
    mkdirSync(dir, { recursive: true });
    this.filePath = join(dir, `${pipelineType}_${label.replace(/\s+/g, '-').toLowerCase()}_${contextId}_${timestamp}.log`);

    this.header(`${pipelineType.toUpperCase()} PIPELINE — "${label}" (id=${contextId})`);
    this.raw(`Started: ${new Date().toISOString()}`);
    this.raw(`Type: ${pipelineType}`);
    this.raw('');
  }

  // ── Step lifecycle ──────────────────────────────────────────────────

  startStep(name: string): StepHandle {
    this.stepCounter++;
    return new StepHandle(this, name, this.stepCounter);
  }

  // ── Formatting helpers (used internally + by StepHandle) ───────────

  header(text: string) {
    this.lines.push('');
    this.lines.push('═'.repeat(90));
    this.lines.push(`  ${text}`);
    this.lines.push('═'.repeat(90));
  }

  section(title: string) {
    this.lines.push('');
    this.lines.push(`── ${title} ${'─'.repeat(Math.max(0, 82 - title.length))}`);
  }

  raw(text: string) {
    this.lines.push(text);
  }

  elapsed(): string {
    return `+${Date.now() - this.startTime}ms`;
  }

  log(phase: string, message: string) {
    this.lines.push(`[${this.elapsed().padStart(9)}] [${phase}] ${message}`);
  }

  warn(phase: string, message: string) {
    this.lines.push(`[${this.elapsed().padStart(9)}] [${phase}] ⚠ ${message}`);
  }

  error(phase: string, message: string) {
    this.lines.push(`[${this.elapsed().padStart(9)}] [${phase}] ✖ ${message}`);
  }

  data(label: string, value: unknown) {
    const json = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
    this.lines.push(`           ${label}:`);
    for (const line of json.split('\n')) {
      this.lines.push(`             ${line}`);
    }
  }

  table(label: string, rows: Array<Record<string, unknown>>) {
    this.lines.push(`           ${label}:`);
    for (const row of rows) {
      const parts = Object.entries(row).map(([k, v]) => `${k}=${typeof v === 'object' ? JSON.stringify(v) : v}`);
      this.lines.push(`             • ${parts.join(', ')}`);
    }
  }

  // ── Summary + flush ─────────────────────────────────────────────────

  summary(extras?: Record<string, unknown>) {
    this.section('PIPELINE SUMMARY');
    this.log('DONE', `Total steps: ${this.stepCounter}`);
    this.log('DONE', `Total elapsed: ${Date.now() - this.startTime}ms`);
    if (extras) {
      for (const [k, v] of Object.entries(extras)) {
        this.log('DONE', `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`);
      }
    }
  }

  flush(): string {
    if (!this.lines.some((l) => l.includes('PIPELINE SUMMARY'))) {
      this.summary();
    }
    this.lines.push('');
    writeFileSync(this.filePath, this.lines.join('\n'), 'utf-8');
    return this.filePath;
  }
}

/**
 * Handle for a single pipeline step — tracks timing, input/output, LLM details.
 */
export class StepHandle {
  private readonly stepStart = Date.now();
  private finished = false;

  constructor(
    private readonly logger: PipelineLogger,
    private readonly name: string,
    private readonly index: number,
  ) {
    logger.section(`STEP ${index}: ${name}`);
    logger.log(name, 'Started');
  }

  /** Log the step's input data */
  input(data: unknown) {
    this.logger.data('Input', data);
  }

  /** Log the step's output data */
  output(data: unknown) {
    this.logger.data('Output', data);
  }

  /** Log intermediate information */
  log(message: string) {
    this.logger.log(this.name, message);
  }

  /** Log a warning */
  warn(message: string) {
    this.logger.warn(this.name, message);
  }

  /** Log an error */
  error(message: string) {
    this.logger.error(this.name, message);
  }

  /** Log LLM call details: prompt sent, response received, tokens spent */
  llmCall(details: StepLlmCallDetails) {
    const parts: string[] = [];
    if (details.skill) parts.push(`skill=${details.skill}`);
    if (details.model) parts.push(`model=${details.model}`);
    if (details.promptLength) parts.push(`prompt=${details.promptLength} chars`);
    if (details.responseLength) parts.push(`response=${details.responseLength} chars`);
    if (details.usage) {
      parts.push(`tokens: ${details.usage.prompt_tokens}→${details.usage.completion_tokens} (${details.usage.total_tokens} total)`);
    }
    this.logger.log(this.name, `LLM call: ${parts.join(', ')}`);

    if (details.rawPrompt) {
      this.logger.data('LLM Prompt', details.rawPrompt);
    }
    if (details.rawResponse) {
      this.logger.data('LLM Response', details.rawResponse);
    }
  }

  /** Log a named timing measurement */
  timing(label: string, ms: number) {
    this.logger.log(this.name, `${label}: ${ms}ms`);
  }

  /** Mark step as successfully completed */
  complete(resultSummary?: string) {
    if (this.finished) return;
    this.finished = true;
    const elapsed = Date.now() - this.stepStart;
    this.logger.log(this.name, `✓ Completed in ${elapsed}ms${resultSummary ? ` — ${resultSummary}` : ''}`);
  }

  /** Mark step as failed with deterministic fallback */
  fail(error: string, fallbackUsed?: string) {
    if (this.finished) return;
    this.finished = true;
    const elapsed = Date.now() - this.stepStart;
    this.logger.error(this.name, `Failed in ${elapsed}ms: ${error}`);
    if (fallbackUsed) {
      this.logger.warn(this.name, `Using deterministic fallback: ${fallbackUsed}`);
    }
  }
}
