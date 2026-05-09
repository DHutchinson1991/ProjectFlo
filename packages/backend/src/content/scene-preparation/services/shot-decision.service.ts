import { Injectable } from '@nestjs/common';
import { ShotType } from '@prisma/client';

export type ShotDecisionSource = 'assignment' | 'coverage' | 'spatial' | 'fallback';

export interface ShotDecisionInput {
  assignmentShotType?: ShotType | string | null;
  coverageShotType?: ShotType | string | null;
  spatialShotType?: ShotType | string | null;
  fallbackShotType?: ShotType | string | null;
}

export interface ShotDecisionResult {
  resolvedShotType: ShotType | 'MEDIUM_SHOT';
  rawSpatialShotType: ShotType | null;
  source: ShotDecisionSource;
  shouldPersistShotType: boolean;
  reason: string;
}

@Injectable()
export class ShotDecisionService {
  resolve(input: ShotDecisionInput): ShotDecisionResult {
    const assignmentShotType = this.normalize(input.assignmentShotType);
    const coverageShotType = this.normalize(input.coverageShotType);
    const spatialShotType = this.normalize(input.spatialShotType);
    const fallbackShotType = this.normalize(input.fallbackShotType) ?? 'MEDIUM_SHOT';

    if (
      assignmentShotType &&
      coverageShotType &&
      spatialShotType &&
      assignmentShotType === spatialShotType &&
      coverageShotType !== spatialShotType
    ) {
      return {
        resolvedShotType: coverageShotType,
        rawSpatialShotType: spatialShotType,
        source: 'coverage',
        shouldPersistShotType: true,
        reason: 'Recovered the planned coverage shot because the stored value only mirrored raw spatial inference.',
      };
    }

    if (assignmentShotType) {
      return {
        resolvedShotType: assignmentShotType,
        rawSpatialShotType: spatialShotType,
        source: 'assignment',
        shouldPersistShotType: true,
        reason: 'Used the persisted assignment shot as the authoritative editorial intent.',
      };
    }

    if (coverageShotType) {
      return {
        resolvedShotType: coverageShotType,
        rawSpatialShotType: spatialShotType,
        source: 'coverage',
        shouldPersistShotType: true,
        reason: 'Used the activity coverage plan because no assignment-level shot was set.',
      };
    }

    if (spatialShotType) {
      return {
        resolvedShotType: spatialShotType,
        rawSpatialShotType: spatialShotType,
        source: 'spatial',
        shouldPersistShotType: false,
        reason: 'Used spatial inference only as a fallback because no editorial shot intent existed yet.',
      };
    }

    return {
      resolvedShotType: fallbackShotType,
      rawSpatialShotType: spatialShotType,
      source: 'fallback',
      shouldPersistShotType: false,
      reason: 'Used the default fallback shot because neither editorial nor spatial signals were available.',
    };
  }

  private normalize(value?: ShotType | string | null): ShotType | null {
    if (typeof value !== 'string') return null;
    const normalized = value.trim();
    return normalized.length > 0 ? (normalized as ShotType) : null;
  }
}
