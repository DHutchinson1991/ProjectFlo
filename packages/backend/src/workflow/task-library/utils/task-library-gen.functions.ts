/**
 * Pure helper functions shared by both preview and execute auto-generation services.
 * No NestJS injection — import these functions directly.
 */

export interface CrewEntry { contributorId: number; bracketLevel: number; }
export interface PreviewCrewMember { name: string; bracketLevel: number; }
export type ExecRoleCrewMap = Map<number, CrewEntry[]>;
export type PreviewRoleCrewMap = Map<number, PreviewCrewMember[]>;

/** Build "contributorId-roleId → bracket level" map from crew_member_job_roles rows. */
export function buildBracketMap(rows: Array<{ crew_member_id: number; job_role_id: number; payment_bracket_id: number | null; payment_bracket: { level: number } | null }>): Map<string, number> {
    const map = new Map<string, number>();
    for (const r of rows) {
        if (r.payment_bracket_id && r.payment_bracket) map.set(`${r.crew_member_id}-${r.job_role_id}`, r.payment_bracket.level);
    }
    return map;
}

/** Build role → crew list for execute (stores contributorIds). Sorted by bracketLevel asc. */
export function buildExecRoleCrewMap(operators: Array<{ crew_member_id: number | null; job_role_id: number | null }>, bracketMap: Map<string, number>, validAssignments: Set<string>): ExecRoleCrewMap {
    const map = new Map<number, CrewEntry[]>();
    for (const op of operators) {
        if (!op.job_role_id || !op.crew_member_id) continue;
        if (!validAssignments.has(`${op.crew_member_id}-${op.job_role_id}`)) continue;
        const bracketLevel = bracketMap.get(`${op.crew_member_id}-${op.job_role_id}`) ?? 0;
        if (!map.has(op.job_role_id)) map.set(op.job_role_id, []);
        const list = map.get(op.job_role_id)!;
        if (!list.some(c => c.contributorId === op.crew_member_id)) list.push({ contributorId: op.crew_member_id!, bracketLevel });
    }
    for (const [, list] of map) list.sort((a, b) => a.bracketLevel - b.bracketLevel);
    return map;
}

/** Pick best crew contributor ID for a given role + task bracket level. */
export function pickCrewForBracket(map: ExecRoleCrewMap, roleId: number, taskBracketLevel: number | null): number | null {
    const list = map.get(roleId); if (!list || !list.length) return null;
    if (list.length === 1) return list[0].contributorId;
    if (!taskBracketLevel || taskBracketLevel <= 0) return list[0].contributorId;
    let best = list[0], bestDist = Math.abs(list[0].bracketLevel - taskBracketLevel);
    for (const e of list) { const d = Math.abs(e.bracketLevel - taskBracketLevel); if (d < bestDist || (d === bestDist && e.bracketLevel < best.bracketLevel)) { best = e; bestDist = d; } }
    return best.contributorId;
}

/** Build payment-bracket rate lookup map from payment_brackets rows. */
export function buildRateMaps(brackets: Array<{ job_role_id: number; level: number; hourly_rate: unknown }>) {
    const bracketRateMap = new Map<string, number>();
    const roleFallbackRate = new Map<number, number>();
    for (const pb of brackets) {
        bracketRateMap.set(`${pb.job_role_id}-${pb.level}`, Number(pb.hourly_rate));
        if (!roleFallbackRate.has(pb.job_role_id)) roleFallbackRate.set(pb.job_role_id, Number(pb.hourly_rate));
    }
    return { bracketRateMap, roleFallbackRate };
}

/** Look up hourly rate for a role+bracket combination. Returns null when not configured. */
export function lookupRate(bracketRateMap: Map<string, number>, _roleFallbackRate: Map<number, number>, roleId: number, bracketLevel: number | null): number | null {
    if (bracketLevel !== null && bracketLevel > 0) {
        const exact = bracketRateMap.get(`${roleId}-${bracketLevel}`);
        if (exact !== undefined) return exact;
    }
    return null;
}

/** Detect which films have music content (scene_music / moment_music) or graphics enabled. */
export function detectFilmsWithContent(films: Array<{ id?: number; name?: string; scenes: Array<{ scene_music: unknown; recording_setup: { graphics_enabled: boolean } | null; moments: Array<{ moment_music: unknown; recording_setup: { graphics_enabled: boolean } | null }>; beats: Array<{ recording_setup: { graphics_enabled: boolean } | null }> }> }>) {
    const withMusic: string[] = [], withGraphics: string[] = [];
    for (const film of films) {
        const name = film.name ?? `Film #${film.id}`;
        if (film.scenes.some(s => s.scene_music !== null || s.moments.some(m => m.moment_music !== null))) withMusic.push(name);
        if (film.scenes.some(s => s.recording_setup?.graphics_enabled === true || s.moments.some(m => m.recording_setup?.graphics_enabled === true) || s.beats.some(b => b.recording_setup?.graphics_enabled === true))) withGraphics.push(name);
    }
    return { withMusic, withGraphics };
}
