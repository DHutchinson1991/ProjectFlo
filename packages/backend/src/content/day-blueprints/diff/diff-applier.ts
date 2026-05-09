import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../platform/prisma/prisma.service';
import {
  DayBlueprintDiff,
  DayBlueprintDiffOpAdd,
  DayBlueprintDiffOpReorder,
  DayBlueprintDiffOpRemove,
  DayBlueprintDiffOpUpdate,
} from './diff-types';

/**
 * Applies a validated DayBlueprintDiff to a DRAFT version inside an
 * outer Prisma transaction. Caller owns the transaction and is
 * responsible for having already: (a) shape-validated the diff, and
 * (b) called guardrails.evaluateProposal() and confirmed there are
 * no violations.
 *
 * Every op is scoped — we re-read the target row and verify it
 * belongs to `versionId` before writing. This prevents an AI proposal
 * on version 5 from mutating rows that live under version 4.
 */
@Injectable()
export class DayBlueprintDiffApplier {
  constructor(private readonly prisma: PrismaService) {}

  async apply(
    versionId: number,
    diff: DayBlueprintDiff,
    tx: Prisma.TransactionClient,
  ): Promise<{ applied: number }> {
    let applied = 0;
    for (const op of diff.ops) {
      switch (op.op) {
        case 'add':
          await this.applyAdd(versionId, op, tx);
          break;
        case 'update':
          await this.applyUpdate(versionId, op, tx);
          break;
        case 'remove':
          await this.applyRemove(versionId, op, tx);
          break;
        case 'reorder':
          await this.applyReorder(versionId, op, tx);
          break;
      }
      applied += 1;
    }
    return { applied };
  }

  // ── add ─────────────────────────────────────────────────────────

  private async applyAdd(
    versionId: number,
    op: DayBlueprintDiffOpAdd,
    tx: Prisma.TransactionClient,
  ) {
    switch (op.resource) {
      case 'activity': {
        const day = await tx.dayBlueprintDay.findUnique({
          where: { id: op.parent_id },
          select: { id: true, day_blueprint_version_id: true },
        });
        this.assertVersionOwned(day?.day_blueprint_version_id, versionId, 'activity parent day');
        await tx.dayBlueprintActivity.create({
          data: { day_blueprint_day_id: op.parent_id, ...(op.data as object) } as Prisma.DayBlueprintActivityUncheckedCreateInput,
        });
        break;
      }
      case 'moment': {
        const activity = await tx.dayBlueprintActivity.findUnique({
          where: { id: op.parent_id },
          include: { day: { select: { day_blueprint_version_id: true } } },
        });
        this.assertVersionOwned(activity?.day.day_blueprint_version_id, versionId, 'moment parent activity');
        await tx.dayBlueprintMoment.create({
          data: { day_blueprint_activity_id: op.parent_id, ...(op.data as object) } as Prisma.DayBlueprintMomentUncheckedCreateInput,
        });
        break;
      }
      case 'moment_action': {
        const moment = await this.loadMomentVersion(op.parent_id, tx);
        this.assertVersionOwned(moment, versionId, 'moment_action parent moment');
        await tx.dayBlueprintMomentAction.create({
          data: { day_blueprint_moment_id: op.parent_id, ...(op.data as object) } as Prisma.DayBlueprintMomentActionUncheckedCreateInput,
        });
        break;
      }
      case 'moment_placement': {
        const moment = await this.loadMomentVersion(op.parent_id, tx);
        this.assertVersionOwned(moment, versionId, 'moment_placement parent moment');
        await tx.dayBlueprintMomentPlacement.create({
          data: { day_blueprint_moment_id: op.parent_id, ...(op.data as object) } as Prisma.DayBlueprintMomentPlacementUncheckedCreateInput,
        });
        break;
      }
    }
  }

  // ── update ──────────────────────────────────────────────────────

  private async applyUpdate(
    versionId: number,
    op: DayBlueprintDiffOpUpdate,
    tx: Prisma.TransactionClient,
  ) {
    const owningVersion = await this.loadResourceVersion(op.resource, op.id, tx);
    this.assertVersionOwned(owningVersion, versionId, `${op.resource} ${op.id}`);
    const data = op.patch as object;
    switch (op.resource) {
      case 'activity':
        await tx.dayBlueprintActivity.update({ where: { id: op.id }, data });
        break;
      case 'moment':
        await tx.dayBlueprintMoment.update({ where: { id: op.id }, data });
        break;
      case 'moment_action':
        await tx.dayBlueprintMomentAction.update({ where: { id: op.id }, data });
        break;
      case 'moment_placement':
        await tx.dayBlueprintMomentPlacement.update({ where: { id: op.id }, data });
        break;
    }
  }

  // ── remove ──────────────────────────────────────────────────────

  private async applyRemove(
    versionId: number,
    op: DayBlueprintDiffOpRemove,
    tx: Prisma.TransactionClient,
  ) {
    const owningVersion = await this.loadResourceVersion(op.resource, op.id, tx);
    this.assertVersionOwned(owningVersion, versionId, `${op.resource} ${op.id}`);
    switch (op.resource) {
      case 'activity':
        await tx.dayBlueprintActivity.delete({ where: { id: op.id } });
        break;
      case 'moment':
        await tx.dayBlueprintMoment.delete({ where: { id: op.id } });
        break;
      case 'moment_action':
        await tx.dayBlueprintMomentAction.delete({ where: { id: op.id } });
        break;
      case 'moment_placement':
        await tx.dayBlueprintMomentPlacement.delete({ where: { id: op.id } });
        break;
    }
  }

  // ── reorder ─────────────────────────────────────────────────────

  private async applyReorder(
    versionId: number,
    op: DayBlueprintDiffOpReorder,
    tx: Prisma.TransactionClient,
  ) {
    for (const entry of op.order) {
      const owningVersion = await this.loadResourceVersion(op.resource, entry.id, tx);
      this.assertVersionOwned(owningVersion, versionId, `${op.resource} ${entry.id}`);
      switch (op.resource) {
        case 'activity':
          await tx.dayBlueprintActivity.update({ where: { id: entry.id }, data: { order_index: entry.order_index } });
          break;
        case 'moment':
          await tx.dayBlueprintMoment.update({ where: { id: entry.id }, data: { order_index: entry.order_index } });
          break;
        case 'moment_action':
          await tx.dayBlueprintMomentAction.update({ where: { id: entry.id }, data: { order_index: entry.order_index } });
          break;
        case 'moment_placement':
          await tx.dayBlueprintMomentPlacement.update({ where: { id: entry.id }, data: { order_index: entry.order_index } });
          break;
      }
    }
  }

  // ── helpers ─────────────────────────────────────────────────────

  private async loadMomentVersion(
    momentId: number,
    tx: Prisma.TransactionClient,
  ): Promise<number | undefined> {
    const m = await tx.dayBlueprintMoment.findUnique({
      where: { id: momentId },
      include: { activity: { include: { day: { select: { day_blueprint_version_id: true } } } } },
    });
    return m?.activity.day.day_blueprint_version_id;
  }

  private async loadResourceVersion(
    resource: DayBlueprintDiff['ops'][number]['resource'],
    id: number,
    tx: Prisma.TransactionClient,
  ): Promise<number | undefined> {
    switch (resource) {
      case 'activity': {
        const row = await tx.dayBlueprintActivity.findUnique({
          where: { id },
          include: { day: { select: { day_blueprint_version_id: true } } },
        });
        return row?.day.day_blueprint_version_id;
      }
      case 'moment':
        return this.loadMomentVersion(id, tx);
      case 'moment_action': {
        const row = await tx.dayBlueprintMomentAction.findUnique({
          where: { id },
          include: { moment: { include: { activity: { include: { day: { select: { day_blueprint_version_id: true } } } } } } },
        });
        return row?.moment.activity.day.day_blueprint_version_id;
      }
      case 'moment_placement': {
        const row = await tx.dayBlueprintMomentPlacement.findUnique({
          where: { id },
          include: { moment: { include: { activity: { include: { day: { select: { day_blueprint_version_id: true } } } } } } },
        });
        return row?.moment.activity.day.day_blueprint_version_id;
      }
    }
  }

  private assertVersionOwned(
    actual: number | undefined,
    expected: number,
    label: string,
  ): void {
    if (actual !== expected) {
      throw new Error(`Diff applier: ${label} does not belong to version ${expected}`);
    }
  }
}
