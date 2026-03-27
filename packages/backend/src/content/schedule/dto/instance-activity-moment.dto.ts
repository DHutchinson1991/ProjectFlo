import { IsInt, IsOptional, IsString, IsBoolean } from 'class-validator';

export { UpdateInstanceActivityMomentDto } from './update-instance-activity-moment.dto';

export class CreateInstanceActivityMomentDto {
  @IsInt()
  project_activity_id: number;

  @IsString()
  name: string;

  @IsOptional()
  @IsInt()
  order_index?: number;

  @IsOptional()
  @IsInt()
  duration_seconds?: number;

  @IsOptional()
  @IsBoolean()
  is_required?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}

