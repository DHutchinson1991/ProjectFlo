import { mkdtempSync, readFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { DayBlueprintAiKnowledgeReport, DayBlueprintAiRunLogger } from './day-blueprint-ai-run-logger';

describe('DayBlueprintAiRunLogger', () => {
  let tempRoot: string;

  beforeEach(() => {
    tempRoot = mkdtempSync(join(tmpdir(), 'day-designer-ai-'));
  });

  afterEach(() => {
    rmSync(tempRoot, { recursive: true, force: true });
  });

  it('writes a compact report under logs/day-designer-ai and reads it by run key', () => {
    const logger = new DayBlueprintAiRunLogger({
      brandId: 9,
      blueprintId: 2,
      blueprintName: 'Civil Wedding',
      versionId: 34,
      dayId: 12,
      dayName: 'Wedding Day',
      route: '/api/day-blueprints/versions/34/days/12/ai-generate',
      backendRootOverride: tempRoot,
    });

    logger.attachDatabaseRun(88);
    logger.writeRequest({ prompt: 'generate' });
    logger.writeLlmResponse({ model: 'gemma-test', reply: '{"activities":[]}' });

    const report: DayBlueprintAiKnowledgeReport = {
      v: 1,
      run: logger.getRunId(),
      db: 88,
      status: 'completed',
      ids: { brand: 9, blueprint: 2, version: 34, day: 12 },
      label: { blueprint: 'Civil Wedding', day: 'Wedding Day' },
      prompt: { chars: 8, brief: 'generate' },
      persisted: {
        activities: 2,
        moments: 6,
        actions: 12,
        placements: 12,
        momentsWithCoverage: 6,
        coveragePct: 100,
      },
    };
    logger.writeReport(report);
    logger.complete({ ok: true });

    const readReport = DayBlueprintAiRunLogger.readReport(logger.getRunId(), tempRoot);
    expect(readReport).toEqual(report);

    const dateDirectory = new Date().toISOString().slice(0, 10);
    const manifestPath = join(tempRoot, 'logs', 'day-designer-ai', dateDirectory, logger.getRunId(), 'manifest.json');
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as { status: string; files: Record<string, string> };

    expect(manifest.status).toBe('completed');
    expect(manifest.files).toEqual(
      expect.objectContaining({
        master: 'master.log',
        request: 'request.json',
        llmResponse: 'llm-response.json',
        report: 'report.json',
      }),
    );
  });
});