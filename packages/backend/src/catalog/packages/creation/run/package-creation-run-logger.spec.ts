import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { PackageCreationRunLogger } from './package-creation-run-logger';

describe('PackageCreationRunLogger', () => {
  let tempRoot: string;

  beforeEach(() => {
    tempRoot = mkdtempSync(join(tmpdir(), 'package-creation-run-logger-'));
  });

  afterEach(() => {
    rmSync(tempRoot, { recursive: true, force: true });
  });

  it('writes the expected run files and a single ordered master log', () => {
    const logger = new PackageCreationRunLogger({
      brandId: 7,
      source: 'catalog',
      route: 'POST /api/packages/from-template/:eventTypeId',
      eventTypeId: 11,
      packageName: 'Signature Wedding',
      backendRootOverride: tempRoot,
    });

    logger.writeRequest({ selectedDayIds: [1, 2], packageName: 'Signature Wedding' });
    logger.attachPackage(42, 'Signature Wedding');
    logger.writeBuilderSummary({ packageId: 42, syncCounts: { activities: 5 } });

    const skillLogger = logger.startSkillLog('01-activity-description', 'Activity Description Enrichment', {
      packageId: 42,
    });
    skillLogger.input({ activityCount: 3 });
    skillLogger.llmCall({
      skill: 'activity-description',
      model: 'gemma-test',
      promptLength: 120,
      responseLength: 140,
      rawPrompt: 'prompt text',
      rawResponse: 'response text',
    });
    skillLogger.output({ activityCount: 3 });
    skillLogger.complete('3 activities enriched');

    logger.writePlannerSummary({ packageId: 42, finalStatus: 'READY' });
    logger.complete({ packageId: 42, planningStatus: 'READY' });

    const runDirectory = findRunDirectory(tempRoot);
    const manifest = JSON.parse(readFileSync(join(runDirectory, 'manifest.json'), 'utf8')) as {
      status: string;
      packageId: number;
      files: { request?: string; builderSummary?: string; plannerSummary?: string };
    };

    expect(manifest.status).toBe('completed');
    expect(manifest.packageId).toBe(42);
    expect(manifest.files.request).toBe('request.json');
    expect(manifest.files.builderSummary).toBe('builder-summary.json');
    expect(manifest.files.plannerSummary).toBe('planner-summary.json');

    const masterLog = readFileSync(join(runDirectory, 'master.log'), 'utf8');
    expect(masterLog).toContain('Package creation run started');
    expect(masterLog).toContain('Captured package creation request payload');
    expect(masterLog).toContain('Attached created package');
    expect(masterLog).toContain('STEP 01: Activity Description Enrichment');
    expect(masterLog).toContain('Skill Key: 01-activity-description');
    expect(masterLog).toContain('[STEP 01] Activity Description Enrichment :: Input');
    expect(masterLog).toContain('[STEP 01] Activity Description Enrichment :: LLM Prompt');
    expect(masterLog).toContain('prompt text');
    expect(masterLog).toContain('[STEP 01] Activity Description Enrichment :: LLM Response');
    expect(masterLog).toContain('response text');
    expect(masterLog).toContain('[STEP 01] [DONE] Activity Description Enrichment :: Completed in');
    expect(masterLog).toContain('Activity Description Enrichment completed');
  });

  it('marks the run failed in the manifest', () => {
    const logger = new PackageCreationRunLogger({
      brandId: 1,
      source: 'catalog',
      route: 'POST /api/packages/from-template/:eventTypeId',
      eventTypeId: 2,
      packageName: 'Failure Case',
      backendRootOverride: tempRoot,
    });

    logger.fail('Package creation failed', { reason: 'boom' });

    const runDirectory = findRunDirectory(tempRoot);
    const manifest = JSON.parse(readFileSync(join(runDirectory, 'manifest.json'), 'utf8')) as { status: string };
    const masterLog = readFileSync(join(runDirectory, 'master.log'), 'utf8');

    expect(manifest.status).toBe('failed');
    expect(masterLog).toContain('Package creation failed');
  });
});

function findRunDirectory(tempRoot: string): string {
  const logRoot = join(tempRoot, 'logs', 'package-creator-ai');
  const [dateDirectory] = readdirSync(logRoot);
  const [runDirectory] = readdirSync(join(logRoot, dateDirectory));
  return join(logRoot, dateDirectory, runDirectory);
}
