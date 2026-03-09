import { IsInt, IsOptional, IsString, IsBoolean, IsDateString, IsEnum, IsNumber, Min, Max, IsDecimal } from 'class-validator';

// ─── Owner Type ────────────────────────────────────────────────────────
// Used throughout instance CRUD to filter/create by owner (project OR inquiry)
export type InstanceOwner =
  | { project_id: number; inquiry_id?: undefined }
  | { inquiry_id: number; project_id?: undefined };

// Project Event Day
export class CreateProjectEventDayDto {
  @IsOptional()
  @IsInt()
  event_day_template_id?: number;

  @IsString()
  name: string;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  start_time?: string;

  @IsOptional()
  @IsString()
  end_time?: string;

  @IsOptional()
  @IsInt()
  order_index?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateProjectEventDayDto {
  @IsOptional()
  @IsInt()
  event_day_template_id?: number | null;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  start_time?: string | null;

  @IsOptional()
  @IsString()
  end_time?: string | null;

  @IsOptional()
  @IsInt()
  order_index?: number;

  @IsOptional()
  @IsString()
  notes?: string | null;
}

// Project Film
export class CreateProjectFilmDto {
  @IsInt()
  film_id: number;

  @IsOptional()
  @IsInt()
  package_film_id?: number;

  @IsOptional()
  @IsInt()
  order_index?: number;
}

// Project Film Scene Schedule
export class UpsertProjectFilmSceneScheduleDto {
  @IsInt()
  scene_id: number;

  @IsOptional()
  @IsInt()
  project_event_day_id?: number | null;

  @IsOptional()
  @IsString()
  scheduled_start_time?: string | null;

  @IsOptional()
  @IsInt()
  scheduled_duration_minutes?: number | null;

  @IsOptional()
  moment_schedules?: any;

  @IsOptional()
  beat_schedules?: any;

  @IsOptional()
  @IsString()
  notes?: string | null;

  @IsOptional()
  @IsInt()
  order_index?: number;

  @IsOptional()
  @IsBoolean()
  is_locked?: boolean;
}

// ─── Instance Activity Moments ─────────────────────────────────────────

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

export class UpdateInstanceActivityMomentDto {
  @IsOptional()
  @IsString()
  name?: string;

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

// ─── Instance Event Day Subjects ───────────────────────────────────────

enum SubjectCategory {
  PEOPLE = 'PEOPLE',
  OBJECTS = 'OBJECTS',
  LOCATIONS = 'LOCATIONS',
}

export class CreateInstanceEventDaySubjectDto {
  @IsInt()
  project_event_day_id: number;

  @IsOptional()
  @IsInt()
  project_activity_id?: number;

  @IsOptional()
  @IsInt()
  role_template_id?: number;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  real_name?: string;

  @IsOptional()
  @IsEnum(SubjectCategory)
  category?: SubjectCategory;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsInt()
  order_index?: number;
}

export class UpdateInstanceEventDaySubjectDto {
  @IsOptional()
  @IsInt()
  project_event_day_id?: number;

  @IsOptional()
  @IsInt()
  project_activity_id?: number | null;

  @IsOptional()
  @IsInt()
  role_template_id?: number | null;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  real_name?: string | null;

  @IsOptional()
  @IsEnum(SubjectCategory)
  category?: SubjectCategory;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsInt()
  order_index?: number;
}

// ─── Instance Location Slots ───────────────────────────────────────────

export class CreateInstanceLocationSlotDto {
  @IsInt()
  project_event_day_id: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  location_number?: number;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsInt()
  location_id?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

// ─── Instance Day Operators (Crew Slots) ───────────────────────────────

export class CreateInstanceDayOperatorDto {
  @IsInt()
  project_event_day_id: number;

  @IsString()
  position_name: string;

  @IsOptional()
  @IsString()
  position_color?: string | null;

  @IsOptional()
  @IsInt()
  contributor_id?: number | null;

  @IsOptional()
  @IsInt()
  job_role_id?: number | null;

  @IsOptional()
  @IsNumber()
  hours?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsInt()
  project_activity_id?: number | null;
}

export class UpdateInstanceDayOperatorDto {
  @IsOptional()
  @IsString()
  position_name?: string;

  @IsOptional()
  @IsString()
  position_color?: string | null;

  @IsOptional()
  @IsInt()
  contributor_id?: number | null;

  @IsOptional()
  @IsInt()
  job_role_id?: number | null;

  @IsOptional()
  @IsNumber()
  hours?: number;

  @IsOptional()
  @IsString()
  notes?: string | null;

  @IsOptional()
  @IsInt()
  order_index?: number;

  @IsOptional()
  @IsInt()
  project_activity_id?: number | null;
}
