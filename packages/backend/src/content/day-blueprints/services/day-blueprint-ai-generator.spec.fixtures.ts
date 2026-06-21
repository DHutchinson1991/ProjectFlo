import { type DensityLibrary } from './day-designer-density.types';

export const FLAT_TEST_LIBRARY: DensityLibrary = {
  rules: [],
  default: { secondsPerMoment: 300, minMoments: 3, maxMoments: 16 },
};

export const buildDensity = () => ({
  getDensity: jest.fn().mockResolvedValue(FLAT_TEST_LIBRARY),
  pickRule: jest.fn((library: DensityLibrary, activityName: string) => {
    const needle = activityName.trim().toLowerCase();
    const hit = library.rules.find((rule) => needle.includes(rule.pattern.trim().toLowerCase()));
    if (hit) {
      return {
        secondsPerMoment: hit.secondsPerMoment,
        minMoments: hit.minMoments,
        maxMoments: hit.maxMoments,
      };
    }
    return library.default;
  }),
  estimateMomentCount: jest.fn().mockImplementation(
    (library: DensityLibrary, durationSeconds: number, _name: string, override?: number | null) => {
      if (override != null && override > 0) {
        return Math.max(1, Math.min(24, Math.floor(override)));
      }
      const rule = library.default;
      if (durationSeconds <= 0) return Math.max(rule.minMoments, 3);
      return Math.max(rule.minMoments, Math.min(rule.maxMoments, Math.ceil(durationSeconds / rule.secondsPerMoment)));
    },
  ),
});

export const buildTx = () => ({
  dayBlueprintActivity: {
    update: jest.fn(),
  },
  dayBlueprintMoment: {
    deleteMany: jest.fn(),
    create: jest.fn(),
  },
  dayBlueprintMomentAction: {
    create: jest.fn(),
  },
  dayBlueprintMomentPlacement: {
    create: jest.fn(),
  },
  dayBlueprintSubjectRole: {
    findMany: jest.fn(),
  },
  dayBlueprintActivityLocation: {
    findFirst: jest.fn(),
  },
  dayBlueprintSpaceSlot: {
    findFirst: jest.fn(),
  },
  dayBlueprintAiRun: {
    update: jest.fn(),
  },
});

export const buildPrisma = (tx = buildTx()) => ({
  dayBlueprintDay: {
    findUnique: jest.fn(),
  },
  dayBlueprintVersion: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  dayBlueprintAiRun: {
    create: jest.fn(),
    update: jest.fn(),
  },
  momentKnowledgeBase: {
    findMany: jest.fn(),
  },
  $transaction: jest.fn((callback) => callback(tx)),
});

export const BASE_DAY = {
  id: 12,
  name: 'Wedding Day',
  description: null,
  default_start_time: '08:00',
  day_blueprint_version_id: 34,
  version: {
    day_blueprint: {
      id: 2,
      brand_id: 9,
      event_category: 'Wedding',
      display_name: 'Hutchinson',
    },
    subject_roles: [
      { subject_role_id: 1, subject_role: { role_name: 'Bride' } },
      { subject_role_id: 2, subject_role: { role_name: 'Groom' } },
    ],
  },
  activities: [
    { id: 101, name: 'Morning Preparation', order_index: 0, default_duration_minutes: 15, description: null },
    { id: 102, name: 'Ceremony Coverage', order_index: 1, default_duration_minutes: 15, description: null },
  ],
};

interface BuildOutlineReplyOptions {
  morningDurations?: [number, number, number];
  ceremonyDurations?: [number, number, number];
  morningName?: string;
  morningMomentNames?: string[];
  ceremonyMomentNames?: string[];
}

export function buildOutlineReply(opts: BuildOutlineReplyOptions = {}): string {
  return JSON.stringify({
    activities: [
      {
        name: opts.morningName ?? 'Morning Preparation',
        moments: [
          { name: opts.morningMomentNames?.[0] ?? 'Hair and Makeup', duration_seconds: opts.morningDurations?.[0] ?? 300 },
          { name: opts.morningMomentNames?.[1] ?? 'Dress and Accessories', duration_seconds: opts.morningDurations?.[1] ?? 300 },
          { name: opts.morningMomentNames?.[2] ?? 'Final Touches', duration_seconds: opts.morningDurations?.[2] ?? 300 },
        ],
      },
      {
        name: 'Ceremony Coverage',
        moments: [
          { name: opts.ceremonyMomentNames?.[0] ?? 'Processional', duration_seconds: opts.ceremonyDurations?.[0] ?? 300 },
          { name: opts.ceremonyMomentNames?.[1] ?? 'Vows', duration_seconds: opts.ceremonyDurations?.[1] ?? 600 },
          { name: opts.ceremonyMomentNames?.[2] ?? 'Recessional', duration_seconds: opts.ceremonyDurations?.[2] ?? 300 },
        ],
      },
    ],
  });
}

interface BuildExpansionReplyOptions {
  perMomentActions?: Array<Array<{ subject_role: string; action_text: string }>>;
}

export function buildExpansionReply(momentCount: number, opts: BuildExpansionReplyOptions = {}): string {
  const moments = Array.from({ length: momentCount }, (_, index) => {
    const overridden = opts.perMomentActions?.[index];
    return {
      description: `Moment ${index + 1} description.`,
      subject_actions: overridden ?? [
        { subject_role: 'Bride', action_text: 'Bride engages in the moment.' },
        { subject_role: 'Groom', action_text: 'Groom engages in the moment.' },
      ],
    };
  });
  return JSON.stringify({ moments });
}

export function buildAiEventsMock() {
  const cancelController = new AbortController();
  return {
    emit: jest.fn(),
    registerRun: jest.fn().mockReturnValue(cancelController),
    releaseRun: jest.fn(),
    signalCancel: jest.fn().mockReturnValue(false),
  };
}

export const RUN_LOGGER = () => ({
  getRunId: jest.fn().mockReturnValue('run-test'),
  attachDatabaseRun: jest.fn(),
  writeRequest: jest.fn(),
  writeLlmResponse: jest.fn(),
  writeReport: jest.fn(),
  warn: jest.fn(),
  complete: jest.fn(),
  fail: jest.fn(),
});

export const SKILLS = () => ({
  load: jest.fn().mockReturnValue('SYSTEM PROMPT'),
});

const RESPONSE = (reply: string) => ({
  reply,
  model: 'gemma-test',
  provider: 'local',
  usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
  queueWaitMs: 1,
  requestDurationMs: 2,
});

export function buildGemma(outlineReply: string, expansionReplies: string[]) {
  const expansionQueue = [...expansionReplies];
  const inFlight = { active: 0, peak: 0 };
  const chatStream = jest.fn().mockImplementation(async (_request, ctx) => {
    const half = Math.max(1, Math.floor(outlineReply.length / 2));
    ctx?.onTextDelta?.(outlineReply.slice(0, half));
    ctx?.onTextDelta?.(outlineReply.slice(half));
    return RESPONSE(outlineReply);
  });
  const chat = jest.fn().mockImplementation(async () => {
    inFlight.active += 1;
    inFlight.peak = Math.max(inFlight.peak, inFlight.active);
    const next = expansionQueue.shift();
    if (next == null) {
      inFlight.active -= 1;
      throw new Error('Exhausted expansion replies');
    }
    await new Promise<void>((resolve) => setTimeout(resolve, 10));
    inFlight.active -= 1;
    return RESPONSE(next);
  });
  return { chat, chatStream, inFlight };
}

export const SPATIAL = () => ({ generateForDay: jest.fn().mockResolvedValue({}) });
