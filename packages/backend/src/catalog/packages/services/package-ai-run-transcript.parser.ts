export interface PackageAiRunTranscriptMessage {
  timestamp: string | null;
  level: string;
  message: string;
}

export interface PackageAiRunTranscriptSection {
  title: string;
  kind:
    | 'context'
    | 'input'
    | 'llm-call'
    | 'llm-prompt'
    | 'llm-response'
    | 'output'
    | 'other';
  content: string;
  json: unknown | null;
}

export interface PackageAiRunTranscriptStep {
  stepNumber: number;
  label: string;
  skillKey: string | null;
  startedAt: string | null;
  sections: PackageAiRunTranscriptSection[];
  messages: PackageAiRunTranscriptMessage[];
}

const STEP_HEADER_PATTERN = /^STEP\s+(\d+):\s+(.+)$/;
const SECTION_HEADER_PATTERN = /^\[STEP\s+(\d+)\]\s+(.+?)\s+::\s+(.+)$/;
const STEP_MESSAGE_PATTERN = /^\[([^\]]+?)\s+\+\d+ms\]\s+\[STEP\s+(\d+)\]\s+\[([A-Z]+)\]\s+(.+?)\s+::\s+(.+)$/;

export function parsePackageAiRunTranscript(masterLog: string | null): PackageAiRunTranscriptStep[] {
  if (!masterLog) {
    return [];
  }

  const lines = masterLog.split(/\r?\n/);
  const steps = new Map<number, PackageAiRunTranscriptStep>();
  let currentStepNumber: number | null = null;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const stepHeader = line.match(STEP_HEADER_PATTERN);
    if (stepHeader) {
      const stepNumber = Number(stepHeader[1]);
      const label = stepHeader[2].trim();
      currentStepNumber = stepNumber;
      ensureStep(steps, stepNumber, label);
      continue;
    }

    if (currentStepNumber !== null && line.startsWith('Skill Key: ')) {
      ensureStep(steps, currentStepNumber).skillKey = line.slice('Skill Key: '.length).trim() || null;
      continue;
    }

    if (currentStepNumber !== null && line.startsWith('Started: ')) {
      ensureStep(steps, currentStepNumber).startedAt = line.slice('Started: '.length).trim() || null;
      continue;
    }

    const sectionHeader = line.match(SECTION_HEADER_PATTERN);
    if (sectionHeader) {
      const stepNumber = Number(sectionHeader[1]);
      const label = sectionHeader[2].trim();
      const title = sectionHeader[3].trim();
      const step = ensureStep(steps, stepNumber, label);
      const contentLines: string[] = [];

      while (index + 1 < lines.length && lines[index + 1].startsWith('  ')) {
        index += 1;
        contentLines.push(lines[index].slice(2));
      }

      const content = trimTrailingEmptyLines(contentLines).join('\n').trimEnd();
      step.sections.push({
        title,
        kind: classifySectionKind(title),
        content,
        json: parseJson(content),
      });
      continue;
    }

    const stepMessage = line.match(STEP_MESSAGE_PATTERN);
    if (stepMessage) {
      const timestamp = stepMessage[1]?.trim() || null;
      const stepNumber = Number(stepMessage[2]);
      const level = stepMessage[3].trim();
      const label = stepMessage[4].trim();
      const message = stepMessage[5].trim();
      const step = ensureStep(steps, stepNumber, label);

      step.messages.push({ timestamp, level, message });
    }
  }

  return Array.from(steps.values()).sort((left, right) => left.stepNumber - right.stepNumber);
}

function ensureStep(
  steps: Map<number, PackageAiRunTranscriptStep>,
  stepNumber: number,
  label = `Step ${stepNumber}`,
): PackageAiRunTranscriptStep {
  const existing = steps.get(stepNumber);
  if (existing) {
    if (!existing.label || existing.label.startsWith('Step ')) {
      existing.label = label;
    }
    return existing;
  }

  const created: PackageAiRunTranscriptStep = {
    stepNumber,
    label,
    skillKey: null,
    startedAt: null,
    sections: [],
    messages: [],
  };
  steps.set(stepNumber, created);
  return created;
}

function classifySectionKind(title: string): PackageAiRunTranscriptSection['kind'] {
  switch (title.toLowerCase()) {
    case 'context':
      return 'context';
    case 'input':
      return 'input';
    case 'llm call':
      return 'llm-call';
    case 'llm prompt':
      return 'llm-prompt';
    case 'llm response':
      return 'llm-response';
    case 'output':
      return 'output';
    default:
      return 'other';
  }
}

function parseJson(content: string): unknown | null {
  if (!content) {
    return null;
  }

  try {
    return JSON.parse(content) as unknown;
  } catch {
    return null;
  }
}

function trimTrailingEmptyLines(lines: string[]): string[] {
  let end = lines.length;
  while (end > 0 && lines[end - 1].trim() === '') {
    end -= 1;
  }
  return lines.slice(0, end);
}