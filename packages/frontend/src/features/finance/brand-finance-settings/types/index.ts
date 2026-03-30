export interface BrandFinanceSettings {
  id?: number;
  brand_id: number;
  onsite_half_day_max_hours: number;
  onsite_full_day_max_hours: number;
  created_at?: string;
  updated_at?: string;
}

export interface UpsertBrandFinanceSettingsData {
  onsite_half_day_max_hours?: number;
  onsite_full_day_max_hours?: number;
}
