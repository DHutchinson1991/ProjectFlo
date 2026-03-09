import { IsInt, IsOptional, IsString, IsNumber, IsBoolean, IsArray, IsEnum } from 'class-validator';

export class CreateInstanceSceneDto {
  @IsOptional()
  @IsInt()
  scene_template_id?: number;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  mode?: string;

  @IsOptional()
  @IsNumber()
  shot_count?: number;

  @IsOptional()
  @IsNumber()
  duration_seconds?: number;

  @IsOptional()
  @IsNumber()
  order_index?: number;
}

export class UpdateInstanceSceneDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  mode?: string;

  @IsOptional()
  @IsNumber()
  shot_count?: number;

  @IsOptional()
  @IsNumber()
  duration_seconds?: number;

  @IsOptional()
  @IsNumber()
  order_index?: number;
}

export class CreateInstanceMomentDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsNumber()
  order_index?: number;

  @IsOptional()
  @IsNumber()
  duration?: number;

  // Set by controller from URL param
  project_scene_id?: number;
}

export class UpdateInstanceMomentDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  order_index?: number;

  @IsOptional()
  @IsNumber()
  duration?: number;
}

export class CreateInstanceBeatDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsNumber()
  order_index?: number;

  @IsOptional()
  @IsNumber()
  shot_count?: number;

  @IsOptional()
  @IsNumber()
  duration_seconds?: number;

  // Set by controller from URL param
  project_scene_id?: number;
}

export class UpdateInstanceBeatDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  order_index?: number;

  @IsOptional()
  @IsNumber()
  shot_count?: number;

  @IsOptional()
  @IsNumber()
  duration_seconds?: number;
}

export class CreateInstanceTrackDto {
  @IsString()
  name: string;

  @IsString()
  type: string;

  @IsOptional()
  @IsNumber()
  order_index?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsBoolean()
  is_unmanned?: boolean;

  @IsOptional()
  @IsInt()
  contributor_id?: number;
}

export class UpdateInstanceTrackDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsNumber()
  order_index?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsBoolean()
  is_unmanned?: boolean;

  @IsOptional()
  @IsInt()
  contributor_id?: number;
}

export class CreateInstanceSubjectDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsInt()
  role_template_id?: number;

  @IsOptional()
  @IsBoolean()
  is_custom?: boolean;
}

export class UpdateInstanceSubjectDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsInt()
  role_template_id?: number;

  @IsOptional()
  @IsBoolean()
  is_custom?: boolean;
}

export class UpsertRecordingSetupDto {
  @IsOptional()
  @IsArray()
  camera_track_ids?: number[];

  @IsOptional()
  @IsArray()
  camera_assignments?: Array<{
    track_id: number;
    subject_ids?: number[];
    shot_type?: string | null;
  }>;

  @IsOptional()
  @IsArray()
  audio_track_ids?: number[];

  @IsOptional()
  @IsBoolean()
  graphics_enabled?: boolean;

  @IsOptional()
  @IsString()
  graphics_title?: string | null;
}
