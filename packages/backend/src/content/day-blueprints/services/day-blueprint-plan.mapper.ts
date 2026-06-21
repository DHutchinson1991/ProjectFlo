import { type ExpandedActivity, type GeneratedActivity, type GeneratedMoment, type OutlineActivity } from './day-blueprint-ai.types';

export function stitchActivity(outline: OutlineActivity, expansion: ExpandedActivity): GeneratedActivity {
  const moments: GeneratedMoment[] = outline.moments.map((moment, index) => {
    const expanded = expansion.moments[index];
    return {
      name: moment.name,
      duration_seconds: moment.duration_seconds,
      description: expanded?.description,
      subject_actions: expanded?.subject_actions ?? [],
      is_key_moment: false,
    };
  });
  return {
    name: outline.name,
    moments,
  };
}

export function markKeyMomentByLongest(activity: GeneratedActivity): GeneratedActivity {
  const moments = activity.moments ?? [];
  if (moments.length === 0) return activity;
  let bestIndex = 0;
  let bestSeconds = moments[0].duration_seconds ?? 0;
  for (let i = 1; i < moments.length; i++) {
    const seconds = moments[i].duration_seconds ?? 0;
    if (seconds > bestSeconds) {
      bestSeconds = seconds;
      bestIndex = i;
    }
  }
  return {
    ...activity,
    moments: moments.map((moment, index) => ({ ...moment, is_key_moment: index === bestIndex })),
  };
}
