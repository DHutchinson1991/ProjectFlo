import { IsOptional, IsString, IsInt } from 'class-validator';

export class UpdateInstanceSubjectDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  role_template_id?: number;
}
