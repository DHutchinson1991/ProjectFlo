import { IsOptional, IsArray, IsBoolean, IsString } from 'class-validator';

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
