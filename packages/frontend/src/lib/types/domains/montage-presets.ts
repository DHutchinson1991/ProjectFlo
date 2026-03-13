/**
 * Montage Preset Domain Types
 * Brand-scoped presets for montage films (Trailer, Highlights, Same-Day Edit)
 */

export interface MontagePreset {
  id: number;
  brand_id?: number | null;
  name: string;
  min_duration_seconds: number;
  max_duration_seconds: number;
  is_system_seeded: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateMontagePresetDto {
  brand_id: number;
  name: string;
  min_duration_seconds: number;
  max_duration_seconds: number;
}

export interface UpdateMontagePresetDto {
  name?: string;
  min_duration_seconds?: number;
  max_duration_seconds?: number;
  is_active?: boolean;
}
