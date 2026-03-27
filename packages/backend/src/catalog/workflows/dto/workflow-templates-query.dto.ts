import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class WorkflowTemplatesQueryDto {
  @IsOptional()
  @Transform(({ value }) =>
    value === undefined ? undefined : value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @Transform(({ value }) =>
    value === undefined ? undefined : value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsBoolean()
  is_default?: boolean;
}