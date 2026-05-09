import { IsInt, IsOptional } from 'class-validator';

export class GenerateBlockingDto {
  /** SceneMoment ID — the moment shown in the ContentBuilder */
  @IsInt()
  sceneMomentId: number;

  @IsInt()
  spaceSlotId: number;

  @IsOptional()
  @IsInt()
  activityId?: number;
}
