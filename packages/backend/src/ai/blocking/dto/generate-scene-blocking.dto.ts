import { IsInt, IsOptional } from 'class-validator';

export class GenerateSceneBlockingDto {
  /** FilmScene ID — all moments in this scene are blocked sequentially */
  @IsInt()
  filmSceneId: number;

  @IsInt()
  spaceSlotId: number;

  @IsOptional()
  @IsInt()
  activityId?: number;
}
