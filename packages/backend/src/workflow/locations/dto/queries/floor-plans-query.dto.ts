import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';

export class FloorPlansQueryDto {
  @Type(() => Number)
  @IsInt()
  projectId!: number;
}
