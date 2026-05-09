import { mkdirSync, appendFileSync } from 'fs';
import { join } from 'path';

export interface AiDirectorLogArtifact {
  filePath: string;
  content: string;
}

/**
 * Granular step-by-step logger for the AI Director pipeline.
 * Writes a detailed log file per run to packages/backend/logs/ai-director/.
 */
export class AiDirectorLogger {
  private lines: string[] = [];
  private startTime: number;
  private filePath: string;

  constructor(sceneMomentId: number, momentName: string) {
    this.startTime = Date.now();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const dir = join(process.cwd(), 'packages', 'backend', 'logs', 'ai-director');
    mkdirSync(dir, { recursive: true });
    this.filePath = join(dir, `${timestamp}_moment-${sceneMomentId}.log`);

    this.header(`AI DIRECTOR RUN — "${momentName}" (sceneMomentId=${sceneMomentId})`);
    this.log('INIT', `Started at ${new Date().toISOString()}`);
  }

  private header(text: string) {
    this.lines.push('');
    this.lines.push('═'.repeat(80));
    this.lines.push(`  ${text}`);
    this.lines.push('═'.repeat(80));
  }

  private elapsed(): string {
    return `+${Date.now() - this.startTime}ms`;
  }

  section(title: string) {
    this.lines.push('');
    this.lines.push(`── ${title} ${'─'.repeat(Math.max(0, 72 - title.length))}`);
  }

  log(phase: string, message: string) {
    this.lines.push(`[${this.elapsed().padStart(8)}] [${phase}] ${message}`);
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
      const parts = Object.entries(row).map(([k, v]) => `${k}=${v}`);
      this.lines.push(`             • ${parts.join(', ')}`);
    }
  }

  warn(phase: string, message: string) {
    this.lines.push(`[${this.elapsed().padStart(8)}] [${phase}] ⚠ ${message}`);
  }

  error(phase: string, message: string) {
    this.lines.push(`[${this.elapsed().padStart(8)}] [${phase}] ✖ ${message}`);
  }

  /** Flush all buffered lines to disk and return the written artifact. */
  flush(): AiDirectorLogArtifact {
    this.section('RUN COMPLETE');
    this.log('DONE', `Total elapsed: ${Date.now() - this.startTime}ms`);
    this.lines.push('');
    const content = this.lines.join('\n');
    appendFileSync(this.filePath, content, 'utf-8');
    this.lines = [];
    return {
      filePath: this.filePath,
      content,
    };
  }
}
