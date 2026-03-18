/**
 * Film Structure Template Domain Types
 * Brand-scoped templates that define scene layouts for films
 */

import type { FilmType } from './film';
import type { SceneType } from './scenes';

export interface FilmStructureTemplateScene {
  id: number;
  film_structure_template_id: number;
  name: string;
  mode: SceneType;
  suggested_duration_seconds?: number | null;
  order_index: number;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface FilmStructureTemplate {
  id: number;
  brand_id?: number | null;
  name: string;
  description?: string | null;
  film_type: FilmType;
  is_system_seeded: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;

  // Relationships
  scenes?: FilmStructureTemplateScene[];
}

export interface CreateFilmStructureTemplateDto {
  brand_id: number;
  name: string;
  description?: string;
  film_type: FilmType;
  scenes?: CreateFilmStructureTemplateSceneDto[];
}

export interface UpdateFilmStructureTemplateDto {
  name?: string;
  description?: string;
  film_type?: FilmType;
  is_active?: boolean;
}

export interface CreateFilmStructureTemplateSceneDto {
  name: string;
  mode?: SceneType;
  suggested_duration_seconds?: number;
  order_index: number;
  notes?: string;
}

export interface UpdateFilmStructureTemplateSceneDto {
  name?: string;
  mode?: SceneType;
  suggested_duration_seconds?: number | null;
  order_index?: number;
  notes?: string | null;
}
