import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { PackageAiRunsService } from './package-ai-runs.service';

describe('PackageAiRunsService', () => {
  const originalCwd = process.cwd;
  let tempRoot: string;
  let service: PackageAiRunsService;
  let prisma: { service_packages: { findFirst: jest.Mock } };

  beforeEach(() => {
    tempRoot = mkdtempSync(join(tmpdir(), 'package-ai-runs-'));
    mkdirSync(join(tempRoot, 'src'));
    mkdirSync(join(tempRoot, 'prisma'));

    prisma = {
      service_packages: {
        findFirst: jest.fn().mockResolvedValue({ id: 18 }),
      },
    };

    jest.spyOn(process, 'cwd').mockImplementation(() => tempRoot);
    service = new PackageAiRunsService(prisma as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    process.cwd = originalCwd;
    rmSync(tempRoot, { recursive: true, force: true });
  });

  it('normalizes persisted planner steps for run summaries and detail views', async () => {
    const runDirectory = join(
      tempRoot,
      'logs',
      'package-creator-ai',
      '2026-04-23',
      'run-2026-04-23T10-47-46-549Z-7e48c161',
    );
    mkdirSync(runDirectory, { recursive: true });

    writeFileSync(
      join(runDirectory, 'manifest.json'),
      JSON.stringify({
        runId: 'run-2026-04-23T10-47-46-549Z-7e48c161',
        status: 'completed',
        startedAt: '2026-04-23T10:47:46.549Z',
        completedAt: '2026-04-23T12:01:55.000Z',
        route: 'POST /api/packages/from-template/:packageTemplateId',
        source: 'catalog',
        brandId: 7,
        packageId: 18,
        packageName: 'Wedding Package 151',
        files: {
          master: 'master.log',
          plannerSummary: 'planner-summary.json',
        },
      }),
    );

    writeFileSync(join(runDirectory, 'master.log'), 'Package creation run completed');
    writeFileSync(
      join(runDirectory, 'planner-summary.json'),
      JSON.stringify({
        finalStatus: 'READY',
        errors: [],
        steps: [
          { step: 'descriptions', label: 'Enriching activity descriptions', status: 'started', stepIndex: 0 },
          { step: 'descriptions', label: 'Enriching activity descriptions', status: 'completed', stepIndex: 0 },
          { step: 'blocking', label: 'Generating camera blocking', status: 'started', stepIndex: 7 },
          { step: 'blocking', label: 'Generating camera blocking', status: 'completed', stepIndex: 7 },
          { step: 'done', label: 'Planning complete', status: 'completed', stepIndex: 7 },
        ],
      }),
    );

    const summaries = await service.findAll(18, 7);
    const detail = await service.findOne(18, 'run-2026-04-23T10-47-46-549Z-7e48c161', 7);

    expect(summaries).toHaveLength(1);
    expect(summaries[0]).toEqual(
      expect.objectContaining({
        completedSteps: 2,
        totalSteps: 2,
        plannerStatus: 'READY',
      }),
    );
    expect(detail.completedSteps).toBe(2);
    expect(detail.totalSteps).toBe(2);
    expect(detail.plannerSummary?.steps).toEqual([
      expect.objectContaining({ step: 'descriptions', status: 'completed', stepIndex: 0 }),
      expect.objectContaining({ step: 'blocking', status: 'completed', stepIndex: 7 }),
    ]);
  });
});