import { IsInt, IsBoolean } from 'class-validator';

export class MomentKeyOverrideDto {
  @IsInt()
  momentId!: number;

  @IsBoolean()
  isKey!: boolean;
}
