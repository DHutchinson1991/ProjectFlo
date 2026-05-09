import { BadRequestException } from '@nestjs/common';
import {
  DIFF_ALLOWED_FIELDS,
  DayBlueprintDiff,
  DayBlueprintDiffOp,
  KNOWN_DIFF_RESOURCES,
} from './diff-types';

/**
 * Shape-only validation for an AI-produced diff. Does not touch the
 * DB — `DayBlueprintGuardrailsService.evaluateProposal()` handles the
 * semantic/lock-rule checks. Returns a list of violation strings;
 * empty list means the diff is structurally sound.
 */
export function validateDiffShape(diff: unknown): string[] {
  const violations: string[] = [];
  if (!diff || typeof diff !== 'object') {
    return ['Diff must be a JSON object'];
  }
  const typed = diff as Partial<DayBlueprintDiff>;
  if (typed.version !== 1) violations.push('Diff version must be 1');
  if (!Array.isArray(typed.ops)) {
    violations.push('Diff.ops must be an array');
    return violations;
  }
  typed.ops.forEach((op, i) => {
    violations.push(...validateOpShape(op, i));
  });
  return violations;
}

function validateOpShape(op: DayBlueprintDiffOp, index: number): string[] {
  const v: string[] = [];
  const prefix = `ops[${index}]`;
  if (!op || typeof op !== 'object') return [`${prefix} must be an object`];
  if (!KNOWN_DIFF_RESOURCES.includes(op.resource)) {
    v.push(`${prefix}.resource "${op.resource}" is not supported`);
    return v;
  }
  switch (op.op) {
    case 'add': {
      if (typeof op.parent_id !== 'number') v.push(`${prefix}.parent_id missing`);
      if (!op.data || typeof op.data !== 'object') v.push(`${prefix}.data missing`);
      else {
        const allowed = DIFF_ALLOWED_FIELDS[op.resource].add;
        for (const key of Object.keys(op.data)) {
          if (!allowed.includes(key)) v.push(`${prefix}.data has forbidden field "${key}"`);
        }
      }
      break;
    }
    case 'update': {
      if (typeof op.id !== 'number') v.push(`${prefix}.id missing`);
      if (!op.patch || typeof op.patch !== 'object') v.push(`${prefix}.patch missing`);
      else {
        const allowed = DIFF_ALLOWED_FIELDS[op.resource].update;
        for (const key of Object.keys(op.patch)) {
          if (!allowed.includes(key)) v.push(`${prefix}.patch has forbidden field "${key}"`);
        }
      }
      break;
    }
    case 'remove':
      if (typeof op.id !== 'number') v.push(`${prefix}.id missing`);
      break;
    case 'reorder':
      if (!Array.isArray(op.order) || op.order.length === 0) {
        v.push(`${prefix}.order must be a non-empty array`);
      } else {
        op.order.forEach((entry, j) => {
          if (typeof entry?.id !== 'number') v.push(`${prefix}.order[${j}].id missing`);
          if (typeof entry?.order_index !== 'number') v.push(`${prefix}.order[${j}].order_index missing`);
        });
      }
      break;
    default:
      v.push(`${prefix}.op "${(op as { op: string }).op}" is not supported`);
  }
  return v;
}

/** Convenience: throws BadRequestException on any shape violation. */
export function assertDiffShape(diff: unknown): DayBlueprintDiff {
  const violations = validateDiffShape(diff);
  if (violations.length > 0) {
    throw new BadRequestException(`Invalid diff: ${violations.join('; ')}`);
  }
  return diff as DayBlueprintDiff;
}
