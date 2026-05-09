import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { PackageCreationRunLogger } from '../creation/run/package-creation-run-logger';
import { parsePackageAiRunTranscript } from './package-ai-run-transcript.parser';

describe('parsePackageAiRunTranscript', () => {
  let tempRoot: string;

  beforeEach(() => {
    tempRoot = mkdtempSync(join(tmpdir(), 'package-ai-run-transcript-'));
  });

  afterEach(() => {
    rmSync(tempRoot, { recursive: true, force: true });
  });

  it('extracts prompt, response, and step messages from the master log', () => {
    const logger = new PackageCreationRunLogger({
      brandId: 7,
      source: 'catalog',
      route: 'POST /api/packages/from-template/:eventTypeId',
      eventTypeId: 11,
      packageName: 'Signature Wedding',
      backendRootOverride: tempRoot,
    });

    const skillLogger = logger.startSkillLog('01-activity-description', 'Activity Description Enrichment', {
      packageId: 42,
      activityName: 'Ceremony',
    });

    skillLogger.input({ activityCount: 3 });
    skillLogger.log('Collecting venue context');
    skillLogger.llmCall({
      skill: 'activity-description',
      model: 'gemma-test',
      promptLength: 120,
      responseLength: 140,
      rawPrompt: 'System: plan the activity\nUser: focus on the ceremony beats',
      rawResponse: JSON.stringify({
        thinking: 'Need to cover vows, processional, and reactions.',
        response: 'Updated the ceremony activity with richer detail.',
      }, null, 2),
    });
    skillLogger.output({ activityCount: 3, updated: true });
    skillLogger.complete('3 activities enriched');

    const masterLog = readFileSync(join(findRunDirectory(tempRoot), 'master.log'), 'utf8');
    const transcript = parsePackageAiRunTranscript(masterLog);

    expect(transcript).toHaveLength(1);
    expect(transcript[0]).toMatchObject({
      stepNumber: 1,
      label: 'Activity Description Enrichment',
      skillKey: '01-activity-description',
    });
    expect(transcript[0].sections.map((section) => section.title)).toEqual([
      'Context',
      'Input',
      'LLM Call',
      'LLM Prompt',
      'LLM Response',
      'Output',
    ]);
    expect(transcript[0].sections.find((section) => section.kind === 'llm-prompt')?.content).toContain('User: focus on the ceremony beats');
    expect(transcript[0].sections.find((section) => section.kind === 'llm-response')?.json).toEqual({
      thinking: 'Need to cover vows, processional, and reactions.',
      response: 'Updated the ceremony activity with richer detail.',
    });
    expect(transcript[0].messages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ level: 'INFO', message: 'Collecting venue context' }),
        expect.objectContaining({ level: 'DONE', message: expect.stringContaining('Completed in') }),
      ]),
    );
  });

  it('returns an empty transcript when the run has no master log', () => {
    expect(parsePackageAiRunTranscript(null)).toEqual([]);
    expect(parsePackageAiRunTranscript('')).toEqual([]);
  });
});

function findRunDirectory(tempRoot: string): string {
  const logRoot = join(tempRoot, 'logs', 'package-creator-ai');
  const [dateDirectory] = readdirSync(logRoot);
  const [runDirectory] = readdirSync(join(logRoot, dateDirectory));
  return join(logRoot, dateDirectory, runDirectory);
}