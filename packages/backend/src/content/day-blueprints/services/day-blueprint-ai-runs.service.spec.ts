import { NotFoundException } from '@nestjs/common';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { DayBlueprintAiRunsService } from './day-blueprint-ai-runs.service';

describe('DayBlueprintAiRunsService', () => {
  let tempRoot: string;

  beforeEach(() => {
    tempRoot = mkdtempSync(join(tmpdir(), 'day-blueprint-ai-runs-'));
    mkdirSync(join(tempRoot, 'src'), { recursive: true });
    mkdirSync(join(tempRoot, 'prisma'), { recursive: true });
    jest.spyOn(process, 'cwd').mockReturnValue(tempRoot);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    rmSync(tempRoot, { recursive: true, force: true });
  });

  it('reads report.json for a run the brand can access', async () => {
    const runKey = 'run-2026-05-04';
    const dateDirectory = new Date().toISOString().slice(0, 10);
    const runDirectory = join(tempRoot, 'logs', 'day-designer-ai', dateDirectory, runKey);
    mkdirSync(runDirectory, { recursive: true });
    writeFileSync(
      join(runDirectory, 'report.json'),
      JSON.stringify({ v: 1, run: runKey, status: 'completed' }),
      'utf8',
    );

    const prisma = {
      dayBlueprintAiRun: {
        findFirst: jest.fn().mockResolvedValue({ id: 28, run_key: runKey }),
      },
    };

    const service = new DayBlueprintAiRunsService(prisma as never);
    await expect(service.getRunReport(28, 9)).resolves.toEqual({
      v: 1,
      run: runKey,
      status: 'completed',
    });
    expect(prisma.dayBlueprintAiRun.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ id: 28 }) }),
    );
  });

  it('throws not found when run is outside brand scope or missing', async () => {
    const prisma = {
      dayBlueprintAiRun: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    };

    const service = new DayBlueprintAiRunsService(prisma as never);
    await expect(service.getRunReport(999, 9)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns null when run has no run_key', async () => {
    const prisma = {
      dayBlueprintAiRun: {
        findFirst: jest.fn().mockResolvedValue({ id: 28, run_key: null }),
      },
    };

    const service = new DayBlueprintAiRunsService(prisma as never);
    await expect(service.getRunReport(28, 9)).resolves.toBeNull();
  });

  it('returns null for unsafe run keys', async () => {
    const prisma = {
      dayBlueprintAiRun: {
        findFirst: jest.fn().mockResolvedValue({ id: 28, run_key: '../escape' }),
      },
    };

    const service = new DayBlueprintAiRunsService(prisma as never);
    await expect(service.getRunReport(28, 9)).resolves.toBeNull();
  });

  it('returns null when report.json is malformed', async () => {
    const runKey = 'run-malformed';
    const dateDirectory = new Date().toISOString().slice(0, 10);
    const runDirectory = join(tempRoot, 'logs', 'day-designer-ai', dateDirectory, runKey);
    mkdirSync(runDirectory, { recursive: true });
    writeFileSync(join(runDirectory, 'report.json'), '{bad-json', 'utf8');

    const prisma = {
      dayBlueprintAiRun: {
        findFirst: jest.fn().mockResolvedValue({ id: 28, run_key: runKey }),
      },
    };

    const service = new DayBlueprintAiRunsService(prisma as never);
    await expect(service.getRunReport(28, 9)).resolves.toBeNull();
  });
});
