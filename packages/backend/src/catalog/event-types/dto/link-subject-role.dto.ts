import { IsInt, IsOptional, IsBoolean } from 'class-validator';

export class LinkSubjectRoleDto {
  @IsInt()
  subject_role_id!: number;

  @IsOptional()
  @IsInt()
  order_index?: number;

  @IsOptional()
  @IsBoolean()
  is_default?: boolean;
}
