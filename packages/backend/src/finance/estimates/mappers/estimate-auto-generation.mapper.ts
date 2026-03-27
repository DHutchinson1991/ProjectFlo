import {
  AutoEstimateItem,
  CrewAccum,
  PLANNING_CATEGORIES,
  POST_PRODUCTION_CATEGORIES,
  TASK_EXCLUDED_PHASES,
  roundMoney,
  resolveHourlyRate,
  resolveDayRate,
  usesDayRate,
} from '../types/estimate-cost.types';
import type { RateResolvable } from '@projectflo/shared';

type CrewEntry = {
  name: string;
  role: string;
  category: string;
  hours: number;
  cost: number;
  rate: number;
  ppFilmCosts: Map<string, { hours: number; cost: number }>;
};

export function categorizeOperators(operators: Record<string, unknown>[]): {
  planningCrew: Map<string, CrewAccum>;
  coverageCrew: Map<string, CrewAccum>;
  postProdCrew: Map<string, CrewAccum>;
} {
  const planningCrew = new Map<string, CrewAccum>();
  const coverageCrew = new Map<string, CrewAccum>();
  const postProdCrew = new Map<string, CrewAccum>();

  for (const op of operators) {
    if (!op.crew_member_id && !op.job_role_id) continue;
    const key = `${op.crew_member_id ?? 0}|${op.job_role_id ?? 0}`;
    const contributor = op.crew_member as Record<string, unknown> | undefined;
    const contact = contributor?.contact as Record<string, unknown> | undefined;
    const jobRole = op.job_role as Record<string, unknown> | undefined;
    const name = contributor
      ? `${contact?.first_name || ''} ${contact?.last_name || ''}`.trim()
      : String(jobRole?.display_name || jobRole?.name || 'TBC');
    const role = String(jobRole?.display_name || jobRole?.name || '');
    const hours = Number(op.hours || 0);
    const category = String(jobRole?.category || '').toLowerCase();
    const bucket = PLANNING_CATEGORIES.has(category)
      ? planningCrew
      : POST_PRODUCTION_CATEGORIES.has(category)
        ? postProdCrew
        : coverageCrew;
    const existing = bucket.get(key);
    if (existing) {
      existing.hours += hours;
      existing.days += 1;
      continue;
    }
    bucket.set(key, {
      name,
      role,
      hours,
      days: 1,
      hourlyRate: resolveHourlyRate(op as RateResolvable),
      dayRate: resolveDayRate(op as RateResolvable),
      useDayRate: usesDayRate(op as RateResolvable),
    });
  }
  return { planningCrew, coverageCrew, postProdCrew };
}

export function buildCrewMapFromTasks(
  tasks: Record<string, unknown>[],
  operators: Record<string, unknown>[],
  filmNames: string[],
): Map<string, CrewEntry> {
  const allCrewMap = new Map<string, CrewEntry>();

  for (const task of tasks) {
    if (TASK_EXCLUDED_PHASES.has(task.phase as string) || !task.assigned_to_name) continue;
    const cost = Number(task.estimated_cost ?? 0);
    const key = `${task.assigned_to_name}|${task.role_name ?? ''}`;
    const existing = allCrewMap.get(key);

    if (existing) {
      existing.hours += Number(task.total_hours || 0);
      existing.cost += cost;
      if (task.phase === 'Post_Production') {
        const filmKey = filmNames.find((fn) => (task.name as string)?.includes(fn)) || 'General';
        const filmCost = existing.ppFilmCosts.get(filmKey);
        if (filmCost) {
          filmCost.hours += Number(task.total_hours || 0);
          filmCost.cost += cost;
        } else existing.ppFilmCosts.set(filmKey, { hours: Number(task.total_hours || 0), cost });
      }
      continue;
    }

    const matchingOp = operators.find((op) => {
      const c = op.crew_member as Record<string, unknown> | undefined;
      const ct = c?.contact as Record<string, unknown> | undefined;
      const name = c ? `${ct?.first_name || ''} ${ct?.last_name || ''}`.trim() : '';
      const jr = op.job_role as Record<string, unknown> | undefined;
      return name === task.assigned_to_name && (jr?.display_name === task.role_name || jr?.name === task.role_name);
    });
    const cat = String((matchingOp?.job_role as Record<string, unknown>)?.category || '').toLowerCase();
    const lineCategory = PLANNING_CATEGORIES.has(cat)
      ? 'Planning'
      : POST_PRODUCTION_CATEGORIES.has(cat)
        ? 'Post-Production'
        : 'Coverage';

    const ppFilmCosts = new Map<string, { hours: number; cost: number }>();
    if (task.phase === 'Post_Production') {
      const filmKey = filmNames.find((fn) => (task.name as string)?.includes(fn)) || 'General';
      ppFilmCosts.set(filmKey, { hours: Number(task.total_hours || 0), cost });
    }

    allCrewMap.set(key, {
      name: task.assigned_to_name as string,
      role: (task.role_name ?? '') as string,
      category: lineCategory,
      hours: Number(task.total_hours || 0),
      cost,
      rate: Number(task.hourly_rate ?? 0),
      ppFilmCosts,
    });
  }
  return allCrewMap;
}

export function buildPostProductionItems(allCrewMap: Map<string, CrewEntry>): AutoEstimateItem[] {
  const items: AutoEstimateItem[] = [];
  const postEntries = Array.from(allCrewMap.values()).filter(
    (e) => e.category === 'Post-Production',
  );
  if (postEntries.length === 0) return items;

  const byFilm = new Map<string, Map<string, { name: string; role: string; hours: number; cost: number; rate: number }>>();

  for (const entry of postEntries) {
    const ppFilmHours = Array.from(entry.ppFilmCosts.values()).reduce((s, v) => s + v.hours, 0);
    const ppFilmCost = Array.from(entry.ppFilmCosts.values()).reduce((s, v) => s + v.cost, 0);
    const deliveryHours = entry.hours - ppFilmHours;
    const deliveryCost = entry.cost - ppFilmCost;

    for (const [filmKey, filmCost] of entry.ppFilmCosts) {
      if (!byFilm.has(filmKey)) byFilm.set(filmKey, new Map());
      const crewKey = `${entry.name}|${entry.role}`;
      const ex = byFilm.get(filmKey)!.get(crewKey);
      if (ex) { ex.hours += filmCost.hours; ex.cost += filmCost.cost; }
      else byFilm.get(filmKey)!.set(crewKey, { name: entry.name, role: entry.role, hours: filmCost.hours, cost: filmCost.cost, rate: entry.rate });
    }

    if (deliveryCost > 0.001) {
      if (!byFilm.has('General')) byFilm.set('General', new Map());
      const crewKey = `${entry.name}|${entry.role}`;
      const ex = byFilm.get('General')!.get(crewKey);
      if (ex) { ex.hours += deliveryHours; ex.cost += deliveryCost; }
      else byFilm.get('General')!.set(crewKey, { name: entry.name, role: entry.role, hours: deliveryHours, cost: deliveryCost, rate: entry.rate });
    }
  }

  for (const [filmKey, filmMap] of byFilm) {
    const category = filmKey === 'General' ? 'Post-Production' : `Post-Production:${filmKey}`;
    for (const entry of filmMap.values()) {
      const derivedRate = entry.rate > 0 ? entry.rate : entry.hours > 0 ? entry.cost / entry.hours : entry.cost;
      items.push({
        description: entry.role ? `${entry.name} - ${entry.role}` : entry.name,
        category,
        quantity: roundMoney(entry.hours),
        unit: 'Hours',
        unit_price: roundMoney(derivedRate),
      });
    }
  }
  return items;
}

export function buildCrewItemsFromTasks(
  taskPreview: Record<string, unknown>,
  operators: Record<string, unknown>[],
  filmNames: string[],
): AutoEstimateItem[] {
  const allCrewMap = buildCrewMapFromTasks(
    taskPreview.tasks as Record<string, unknown>[],
    operators,
    filmNames,
  );
  const items: AutoEstimateItem[] = [];

  for (const entry of allCrewMap.values()) {
    if (entry.category !== 'Planning' && entry.category !== 'Coverage') continue;
    const derivedRate =
      entry.rate > 0
        ? entry.rate
        : entry.hours > 0
          ? entry.cost / entry.hours
          : entry.cost;
    items.push({
      description: entry.role ? `${entry.name} - ${entry.role}` : entry.name,
      category: entry.category,
      quantity: roundMoney(entry.hours),
      unit: 'Hours',
      unit_price: roundMoney(derivedRate),
    });
  }

  items.push(...buildPostProductionItems(allCrewMap));
  return items;
}

export function buildCrewItemsFallback(
  planningCrew: Map<string, CrewAccum>,
  coverageCrew: Map<string, CrewAccum>,
  postProdCrew: Map<string, CrewAccum>,
): AutoEstimateItem[] {
  const items: AutoEstimateItem[] = [];
  const push = (crewMap: Map<string, CrewAccum>, category: string) => {
    for (const crew of crewMap.values()) {
      const useDayRate = crew.useDayRate && crew.dayRate > 0;
      items.push({
        description: crew.role ? `${crew.name} - ${crew.role}` : crew.name,
        category,
        quantity: useDayRate ? crew.days : roundMoney(crew.hours),
        unit: useDayRate ? 'Days' : 'Hours',
        unit_price: roundMoney(useDayRate ? crew.dayRate : crew.hourlyRate),
      });
    }
  };
  push(planningCrew, 'Planning');
  push(coverageCrew, 'Coverage');
  push(postProdCrew, 'Post-Production');
  return items;
}

export function buildEquipmentItems(operators: Record<string, unknown>[]): AutoEstimateItem[] {
  const items: AutoEstimateItem[] = [];
  const seen = new Set<number>();
  for (const op of operators) {
    for (const rel of (op.equipment as Record<string, unknown>[]) || []) {
      const eq = rel.equipment as Record<string, unknown> | undefined;
      const equipmentId = (rel.equipment_id ?? eq?.id) as number | undefined;
      if (!equipmentId || seen.has(equipmentId)) continue;
      seen.add(equipmentId);
      const price = Number(eq?.rental_price_per_day || 0);
      const name = [eq?.item_name, eq?.model].filter(Boolean).join(' ');
      items.push({
        description: name || `Equipment #${equipmentId}`,
        category: 'Equipment',
        quantity: 1,
        unit: 'Day',
        unit_price: roundMoney(price),
      });
    }
  }
  return items;
}
