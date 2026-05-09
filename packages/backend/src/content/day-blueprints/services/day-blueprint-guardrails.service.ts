import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import { DayBlueprintDiff, validateDiffShape } from '../diff';

/**
 * Guardrail evaluator for Day Blueprint versions.
 *
 * Lock-rule vocabulary (stored in day_blueprint_lock_rules):
 *   VERSION scope:
 *     - moment_count_min        : { min: number }
 *     - moment_count_max        : { max: number }
 *     - action_subject_required : {}
 *     - spatial_required        : {}
 *   ACTIVITY scope (target_id = activity.id):
 *     - moment_required         : {}
 *     - duration_band           : { min_minutes?, max_minutes? }
 *   MOMENT scope (target_id = moment.id):
 *     - name_locked | order_locked | duration_locked
 *
 * Unknown rule_keys are reported at publish time so typos can't
 * silently pass. AI proposals pass through `evaluateProposal()`
 * before the applier touches any rows.
 */
@Injectable()
export class DayBlueprintGuardrailsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── publish ─────────────────────────────────────────────────────

  async assertPublishable(versionId: number): Promise<void> {
    const violations = await this.evaluatePublish(versionId);
    if (violations.length > 0) {
      throw new BadRequestException(`Cannot publish: ${violations.join('; ')}`);
    }
  }

  async evaluatePublish(versionId: number): Promise<string[]> {
    const violations: string[] = [];
    const version = await this.prisma.dayBlueprintVersion.findUnique({
      where: { id: versionId },
      include: {
        days: {
          include: {
            activities: {
              include: {
                moments: { include: { actions: true, placements: true } },
              },
            },
          },
        },
        lock_rules: true,
      },
    });
    if (!version) return ['Version not found'];
    if (version.days.length === 0) violations.push('Blueprint must have at least one day');
    for (const day of version.days) {
      if (day.activities.length === 0) {
        violations.push(`Day "${day.name}" must have at least one activity`);
      }
      for (const activity of day.activities) {
        if (activity.moments.length === 0) {
          violations.push(`Activity "${activity.name}" must have at least one moment`);
        }
      }
    }

    const allMoments = version.days.flatMap((d) =>
      d.activities.flatMap((a) => a.moments),
    );

    for (const rule of version.lock_rules) {
      violations.push(...this.evaluatePublishRule(rule, version, allMoments));
    }
    return violations;
  }

  private evaluatePublishRule(
    rule: { scope: string; target_id: number | null; rule_key: string; rule_value: Prisma.JsonValue | null },
    version: { days: Array<{ activities: Array<{ id: number; name: string; moments: Array<{ id: number; name: string }> }> }> },
    allMoments: Array<{ id: number; name: string; actions: unknown[]; placements: unknown[] }>,
  ): string[] {
    const v: string[] = [];
    const val = (rule.rule_value ?? {}) as Record<string, unknown>;

    if (rule.scope === 'VERSION') {
      switch (rule.rule_key) {
        case 'moment_count_min': {
          const min = Number(val.min);
          if (Number.isFinite(min) && allMoments.length < min) {
            v.push(`Rule moment_count_min: have ${allMoments.length} moments, need ≥${min}`);
          }
          break;
        }
        case 'moment_count_max': {
          const max = Number(val.max);
          if (Number.isFinite(max) && allMoments.length > max) {
            v.push(`Rule moment_count_max: have ${allMoments.length} moments, allow ≤${max}`);
          }
          break;
        }
        case 'action_subject_required': {
          for (const m of allMoments) {
            if (m.actions.length === 0) v.push(`Moment "${m.name}" needs ≥1 subject action`);
          }
          break;
        }
        case 'spatial_required': {
          for (const m of allMoments) {
            if (m.placements.length === 0) v.push(`Moment "${m.name}" needs ≥1 spatial placement`);
          }
          break;
        }
        default:
          v.push(`Unknown VERSION-scope rule_key "${rule.rule_key}"`);
      }
      return v;
    }

    if (rule.scope === 'ACTIVITY') {
      const activity = version.days
        .flatMap((d) => d.activities)
        .find((a) => a.id === rule.target_id);
      if (!activity) {
        v.push(`Rule ${rule.rule_key}: target activity ${rule.target_id} not found`);
        return v;
      }
      switch (rule.rule_key) {
        case 'moment_required':
          if (activity.moments.length === 0) {
            v.push(`Activity "${activity.name}" must keep ≥1 moment`);
          }
          break;
        case 'duration_band':
          // Enforced on mutation, not publish. No-op here.
          break;
        default:
          v.push(`Unknown ACTIVITY-scope rule_key "${rule.rule_key}"`);
      }
      return v;
    }

    if (rule.scope === 'MOMENT') {
      if (!['name_locked', 'order_locked', 'duration_locked'].includes(rule.rule_key)) {
        v.push(`Unknown MOMENT-scope rule_key "${rule.rule_key}"`);
      }
      return v;
    }

    if (rule.scope === 'DAY') {
      v.push(`Unknown DAY-scope rule_key "${rule.rule_key}"`);
      return v;
    }

    return v;
  }

  // ── AI proposal ─────────────────────────────────────────────────

  async evaluateProposal(
    versionId: number,
    diff: unknown,
  ): Promise<string[]> {
    const shapeViolations = validateDiffShape(diff);
    if (shapeViolations.length > 0) return shapeViolations;

    const typed = diff as DayBlueprintDiff;
    const rules = await this.prisma.dayBlueprintLockRule.findMany({
      where: { day_blueprint_version_id: versionId },
    });

    const violations: string[] = [];
    for (const op of typed.ops) {
      for (const rule of rules) {
        if (rule.scope === 'MOMENT' && op.resource === 'moment') {
          if (op.op === 'update' && op.id === rule.target_id) {
            const patch = op.patch;
            if (rule.rule_key === 'name_locked' && 'name' in patch) {
              violations.push(`Moment ${rule.target_id}: name is locked`);
            }
            if (rule.rule_key === 'order_locked' && 'order_index' in patch) {
              violations.push(`Moment ${rule.target_id}: order is locked`);
            }
            if (rule.rule_key === 'duration_locked' && 'duration_seconds' in patch) {
              violations.push(`Moment ${rule.target_id}: duration is locked`);
            }
          }
          if (op.op === 'remove' && op.id === rule.target_id) {
            violations.push(`Moment ${rule.target_id} is locked and cannot be removed`);
          }
          if (op.op === 'reorder' && rule.rule_key === 'order_locked') {
            if (op.order.some((e) => e.id === rule.target_id)) {
              violations.push(`Moment ${rule.target_id}: order is locked`);
            }
          }
        }

        if (
          rule.scope === 'ACTIVITY'
          && rule.rule_key === 'moment_required'
          && op.op === 'remove'
          && op.resource === 'moment'
        ) {
          const remaining = await this.prisma.dayBlueprintMoment.count({
            where: {
              day_blueprint_activity_id: rule.target_id ?? -1,
              id: { not: op.id },
            },
          });
          if (remaining === 0) {
            violations.push(`Activity ${rule.target_id}: cannot remove last moment (moment_required)`);
          }
        }

        if (
          rule.scope === 'ACTIVITY'
          && rule.rule_key === 'duration_band'
          && op.op === 'update'
          && op.resource === 'activity'
          && op.id === rule.target_id
        ) {
          const { min_minutes, max_minutes } = (rule.rule_value ?? {}) as {
            min_minutes?: number;
            max_minutes?: number;
          };
          const patch = op.patch as { default_duration_minutes?: number };
          if (typeof patch.default_duration_minutes === 'number') {
            if (typeof min_minutes === 'number' && patch.default_duration_minutes < min_minutes) {
              violations.push(`Activity ${rule.target_id}: duration below min ${min_minutes}m`);
            }
            if (typeof max_minutes === 'number' && patch.default_duration_minutes > max_minutes) {
              violations.push(`Activity ${rule.target_id}: duration above max ${max_minutes}m`);
            }
          }
        }
      }
    }
    return violations;
  }
}
