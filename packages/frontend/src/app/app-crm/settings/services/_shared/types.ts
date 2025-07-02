// Types for content system
export type ContentType = "STANDARD" | "RAW_FOOTAGE";

export type MusicType =
  | "NONE"
  | "SCENE_MATCHED"
  | "ORCHESTRAL"
  | "PIANO"
  | "MODERN"
  | "VINTAGE";

export type ComponentType = "COVERAGE_BASED" | "PRODUCTION";

export interface ContentTemplate {
  id: number;
  name: string;
  description?: string;
  workflow_template_id?: number;
  created_at: string;
  default_music_type?: MusicType;
  delivery_timeline?: number;
  includes_music: boolean;
  is_active: boolean;
  type: ContentType;
  updated_at: string;
  version: string;
  template_defaults: ComponentTemplateDefaults[];
  assigned_components?: ContentAssignedComponents[];
}

export interface ContentDefaultComponent {
  id: number;
  content_id: number;
  coverage_scene?: {
    id: number;
    name: string;
    description?: string;
  };
  default_editing_style?: {
    id: number;
    name: string;
    description?: string;
  };
}

export interface ContentAssignedComponents {
  content_id: number;
  component_id: number;
  order_index: number;
  editing_style?: string;
  duration_override?: number;
  calculated_task_hours?: string;
  calculated_base_price?: string;
  created_at: string;
  updated_at: string;
  component: ComponentLibrary;
}

export interface ComponentLibrary {
  id: number;
  name: string;
  description?: string;
  type: ComponentType;
  complexity_score: number;
  estimated_duration?: number;
  default_editing_style?: string;
  base_task_hours: string;
  created_at: string;
  updated_at: string;
}

export interface ComponentTemplateDefaults {
  id: number;
  content_id: number;
  component_id: number;
  order_index: number;
  duration_override?: number;
  created_at: string;
  updated_at: string;
  component: ComponentLibrary;
}

export interface ComponentPricing {
  component_id: number;
  component_name: string;
  component_type: ComponentType;
  base_task_hours: number;
  base_price: number;
}

export interface CreateContentDto {
  name: string;
  description?: string;
  type: ContentType;
  includes_music?: boolean;
  delivery_timeline?: number;
  components?: Array<{
    coverage_scene_id?: number;
    default_editing_style_id: number;
    settings?: Record<string, string | number | boolean>;
  }>;
}

export type UpdateContentDto = Partial<CreateContentDto> & {
  components?: Array<{
    component_id: number;
    order_index: number;
    editing_style?: string;
    duration_override?: number;
  }>;
};

// Category types
export interface ContentCategory {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCategoryDto {
  name: string;
  code: string;
  description?: string;
}

export interface UpdateCategoryDto {
  name?: string;
  code?: string;
  description?: string;
  is_active?: boolean;
}
