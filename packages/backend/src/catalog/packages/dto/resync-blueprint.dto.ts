import { CeremonySeatLayoutMode } from '@projectflo/shared';
import { IsEnum, IsOptional } from 'class-validator';

export enum PackageBlueprintResyncStrategy {
  /** Replace blueprint-derived activities/moments; preserve camera/film/crew rows. */
  STRUCTURE_ONLY = 'structure_only',
  /** Re-seed moment placements + blocking on the current blueprint version. */
  PLACEMENTS_REFRESH = 'placements_refresh',
}

export class ResyncPackageBlueprintDto {
  @IsOptional()
  @IsEnum(PackageBlueprintResyncStrategy)
  strategy?: PackageBlueprintResyncStrategy;

  @IsOptional()
  @IsEnum(CeremonySeatLayoutMode)
  seat_layout?: CeremonySeatLayoutMode;
}
