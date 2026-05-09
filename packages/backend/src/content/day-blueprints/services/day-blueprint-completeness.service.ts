import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../platform/prisma/prisma.service';

export type SimulationStepId =
  | 'basics'
  | 'people'
  | 'locations'
  | 'timeline'
  | 'moments'
  | 'actions'
  | 'spatial';

export interface SimulationCompletenessStep {
  step: SimulationStepId;
  label: string;
  score: number; // 0–100
  hits: number;
  total: number;
  missing: string[];
}

export interface SimulationCompletenessResult {
  versionId: number;
  dayId: number;
  overall: number; // 0–100
  steps: SimulationCompletenessStep[];
  assumptions: string[];
}

const STEP_WEIGHTS: Record<SimulationStepId, number> = {
  basics: 1,
  people: 1,
  locations: 1,
  timeline: 1.5,
  moments: 1.5,
  actions: 1.25,
  spatial: 1,
};

const KEY_MOMENT_KEYWORDS = [
  'processional',
  'vows',
  'ring',
  'first dance',
  'speech',
  'cake',
  'entrance',
  'exit',
];

/**
 * Read-only "Simulation Completeness" rollup. Pure projection over
 * the version detail — no writes, no LLM. Used by the Simulator
 * launcher / drawer to decide which steps still have gaps.
 */
@Injectable()
export class DayBlueprintCompletenessService {
  constructor(private readonly prisma: PrismaService) {}

  async computeForDay(versionId: number, dayId: number): Promise<SimulationCompletenessResult> {
    const day = await this.prisma.dayBlueprintDay.findUnique({
      where: { id: dayId },
      include: {
        version: {
          include: {
            day_blueprint: { select: { event_category: true } },
            subject_roles: { include: { subject_role: true } },
            space_slots: true,
          },
        },
        activities: {
          orderBy: { order_index: 'asc' },
          include: {
            activity_locations: { select: { id: true } },
            moments: {
              orderBy: { order_index: 'asc' },
              include: {
                actions: { select: { id: true } },
                placements: { select: { id: true, position_hint: true, facing_hint: true } },
              },
            },
          },
        },
      },
    });
    if (!day) throw new NotFoundException('Day not found');
    if (day.day_blueprint_version_id !== versionId) {
      throw new BadRequestException('Day does not belong to this version');
    }

    const steps: SimulationCompletenessStep[] = [
      this.scoreBasics(day),
      this.scorePeople(day.version.subject_roles),
      this.scoreLocations(day.activities, day.version.space_slots.length),
      this.scoreTimeline(day.activities),
      this.scoreMoments(day.activities),
      this.scoreActions(day.activities),
      this.scoreSpatial(day.activities),
    ];

    const overall = weightedAverage(steps);
    const assumptions = steps.flatMap((step) => step.missing.slice(0, 3));

    return {
      versionId,
      dayId,
      overall,
      steps,
      assumptions,
    };
  }

  private scoreBasics(day: {
    name: string;
    default_start_time: string | null;
    default_duration_hours: number | null;
    version: { day_blueprint: { event_category: string } };
  }): SimulationCompletenessStep {
    const checks: Array<[boolean, string]> = [
      [day.version.day_blueprint.event_category === 'wedding', 'Set event category to wedding'],
      [Boolean(day.default_start_time), 'Set the day’s default start time'],
      [Boolean(day.default_duration_hours), 'Set an approximate day length in hours'],
      [day.name.trim().length >= 3, 'Give the day a descriptive name'],
    ];
    return rollup('basics', 'Wedding Basics', checks);
  }

  private scorePeople(
    roles: Array<{ subject_role: { role_name: string } | null; typical_count: number | null }>,
  ): SimulationCompletenessStep {
    const names = roles
      .map((row) => row.subject_role?.role_name?.toLowerCase().trim() ?? '')
      .filter(Boolean);
    const has = (needle: string) => names.some((name) => name.includes(needle));
    const checks: Array<[boolean, string]> = [
      [has('bride') || has('partner'), 'Add the bride / first partner role'],
      [has('groom') || has('partner'), 'Add the groom / second partner role'],
      [has('officiant'), 'Add the officiant'],
      [has('guest'), 'Add the guests group with a typical count'],
      [roles.some((row) => (row.typical_count ?? 0) > 0), 'Set a typical count on at least one group'],
    ];
    return rollup('people', 'People', checks);
  }

  private scoreLocations(
    activities: Array<{ activity_locations: Array<unknown> }>,
    spaceSlotCount: number,
  ): SimulationCompletenessStep {
    const total = activities.length || 1;
    const linked = activities.filter((activity) => activity.activity_locations.length > 0).length;
    const checks: Array<[boolean, string]> = [
      [linked >= 1, 'Link at least one activity to a location'],
      [linked === total, 'Link every activity to a location'],
      [spaceSlotCount >= 1, 'Create at least one space slot for the floor plan'],
    ];
    return rollup('locations', 'Locations', checks);
  }

  private scoreTimeline(
    activities: Array<{ name: string; default_start_time: string | null }>,
  ): SimulationCompletenessStep {
    const timed = activities.filter((activity) => Boolean(activity.default_start_time)).length;
    const checks: Array<[boolean, string]> = [
      [activities.length >= 4, 'Add at least 4 wedding-day activities'],
      [activities.length === 0 ? false : timed === activities.length, 'Set a start time on every activity'],
      [hasNamed(activities, ['ceremony']), 'Include the ceremony activity'],
      [hasNamed(activities, ['reception', 'dinner']), 'Include the reception or dinner activity'],
      [hasNamed(activities, ['prep', 'getting ready']), 'Include the prep / getting-ready activity'],
    ];
    return rollup('timeline', 'Timeline', checks);
  }

  private scoreMoments(
    activities: Array<{ moments: Array<{ name: string; is_key_moment: boolean | null }> }>,
  ): SimulationCompletenessStep {
    const allMoments = activities.flatMap((activity) => activity.moments);
    const keyHits = KEY_MOMENT_KEYWORDS.filter((keyword) =>
      allMoments.some((moment) => moment.name.toLowerCase().includes(keyword)),
    );
    const everyActivityHasMoments = activities.length > 0
      && activities.every((activity) => activity.moments.length > 0);
    const checks: Array<[boolean, string]> = [
      [everyActivityHasMoments, 'Add at least one moment to every activity'],
      [allMoments.length >= 8, 'Build at least 8 moments across the day'],
      [allMoments.some((moment) => moment.is_key_moment), 'Mark at least one moment as a key narrative beat'],
      [keyHits.length >= 3, `Cover the canonical wedding beats (${KEY_MOMENT_KEYWORDS.slice(0, 3).join(', ')}, …)`],
    ];
    return rollup('moments', 'Moments', checks);
  }

  private scoreActions(
    activities: Array<{ moments: Array<{ actions: Array<unknown> }> }>,
  ): SimulationCompletenessStep {
    const moments = activities.flatMap((activity) => activity.moments);
    const covered = moments.filter((moment) => moment.actions.length > 0).length;
    const checks: Array<[boolean, string]> = [
      [moments.length === 0 ? false : covered === moments.length, 'Describe what subjects are doing in every moment'],
      [moments.some((moment) => moment.actions.length >= 2), 'Add multi-subject actions to at least one moment'],
    ];
    return rollup('actions', 'Subject Actions', checks);
  }

  private scoreSpatial(
    activities: Array<{
      moments: Array<{ placements: Array<{ position_hint: string | null; facing_hint: string | null }> }>;
    }>,
  ): SimulationCompletenessStep {
    const moments = activities.flatMap((activity) => activity.moments);
    const placed = moments.filter((moment) => moment.placements.length > 0).length;
    const withHints = moments.filter((moment) =>
      moment.placements.some(
        (placement) =>
          placement.position_hint
          && placement.position_hint !== 'UNSPECIFIED'
          && placement.facing_hint
          && placement.facing_hint !== 'UNSPECIFIED',
      ),
    ).length;
    const checks: Array<[boolean, string]> = [
      [moments.length === 0 ? false : placed === moments.length, 'Add placements to every moment'],
      [moments.length === 0 ? false : withHints >= Math.ceil(moments.length / 2), 'Set position + facing hints on most moments'],
    ];
    return rollup('spatial', 'Spatial Simulation', checks);
  }
}

function rollup(
  step: SimulationStepId,
  label: string,
  checks: Array<[boolean, string]>,
): SimulationCompletenessStep {
  const total = checks.length;
  const hits = checks.filter(([passed]) => passed).length;
  const missing = checks.filter(([passed]) => !passed).map(([, message]) => message);
  return {
    step,
    label,
    score: total === 0 ? 0 : Math.round((hits / total) * 100),
    hits,
    total,
    missing,
  };
}

function weightedAverage(steps: SimulationCompletenessStep[]): number {
  let weighted = 0;
  let totalWeight = 0;
  for (const step of steps) {
    const weight = STEP_WEIGHTS[step.step] ?? 1;
    weighted += step.score * weight;
    totalWeight += weight;
  }
  return totalWeight === 0 ? 0 : Math.round(weighted / totalWeight);
}

function hasNamed(
  activities: Array<{ name: string }>,
  needles: string[],
): boolean {
  return activities.some((activity) => {
    const lower = activity.name.toLowerCase();
    return needles.some((needle) => lower.includes(needle));
  });
}
