/**
 * Films API - Film management, equipment, tracks, scenes, and timeline layers
 */

import { apiClient } from '@/shared/api/client';
import type { ApiClient } from '@/shared/api/client';
import type { Film, CreateFilmDto, UpdateFilmDto, TimelineLayer, CreateTimelineLayerDto, UpdateTimelineLayerDto } from '../types';
import type {
  FilmEquipment,
  SetEquipmentDto,
  EquipmentSummary,
  FilmEquipmentAssignment,
} from '../types/film-equipment.types';
import type {
  TimelineTrack,
  GenerateTracksDto,
  UpdateTrackDto,
  ReorderTracksDto,
  TracksByType,
  TrackStatistics,
} from '../types/film-timeline-tracks.types';
import type {
  CreateSceneFromTemplateDto,
  CreateBlankSceneDto,
  UpdateDurationModeDto,
  SceneDurationInfo,
  FilmLocalScene,
} from '../types/film-scenes.types';

export const createFilmsApi = (client: ApiClient) => ({
  films: {
    getAll: (brandId?: number): Promise<Film[]> => {
      const query = brandId ? `?brandId=${brandId}` : '';
      return client.get(`/api/films${query}`);
    },
    getById: (id: number): Promise<Film> =>
      client.get(`/api/films/${id}`),
    create: (data: CreateFilmDto): Promise<Film> =>
      client.post('/api/films', data),
    update: (id: number, data: UpdateFilmDto): Promise<Film> =>
      client.patch(`/api/films/${id}`, data),
    delete: (id: number): Promise<void> =>
      client.delete(`/api/films/${id}`),
  },

  equipment: {
    set: (filmId: number, data: SetEquipmentDto): Promise<FilmEquipment> =>
      client.post(`/api/films/${filmId}/equipment`, data),
    update: (filmId: number, data: { num_cameras?: number; num_audio?: number; allow_removal?: boolean }): Promise<unknown> =>
      client.patch(`/api/films/${filmId}/equipment`, data),
    getAll: (filmId: number): Promise<FilmEquipment[]> =>
      client.get(`/api/films/${filmId}/equipment`),
    getSummary: (filmId: number): Promise<EquipmentSummary> =>
      client.get(`/api/films/${filmId}/equipment/summary`),
    delete: (filmId: number, equipmentType: string): Promise<void> =>
      client.delete(`/api/films/${filmId}/equipment/${equipmentType}`),
  },

  equipmentAssignments: {
    getAll: (filmId: number): Promise<FilmEquipmentAssignment[]> =>
      client.get(`/api/films/${filmId}/equipment-assignments`),
    getSummary: (filmId: number): Promise<{ cameras: number; audio: number; music: number; lighting: number; other: number }> =>
      client.get(`/api/films/${filmId}/equipment-summary`),
    assign: (filmId: number, data: { equipment_id: number; quantity?: number; notes?: string }): Promise<FilmEquipmentAssignment> =>
      client.post(`/api/films/${filmId}/equipment-assignments`, data),
    update: (filmId: number, equipmentId: number, data: { quantity?: number; notes?: string }): Promise<FilmEquipmentAssignment> =>
      client.patch(`/api/films/${filmId}/equipment-assignments/${equipmentId}`, data),
    remove: (filmId: number, equipmentId: number): Promise<void> =>
      client.delete(`/api/films/${filmId}/equipment-assignments/${equipmentId}`),
  },

  tracks: {
    generate: (filmId: number, data?: GenerateTracksDto): Promise<TimelineTrack[]> =>
      client.post(`/api/films/${filmId}/tracks/generate`, data),
    getAll: (filmId: number, activeOnly?: boolean): Promise<TimelineTrack[]> => {
      const query = activeOnly !== undefined ? `?activeOnly=${activeOnly}` : '';
      return client.get(`/api/films/${filmId}/tracks${query}`);
    },
    getByType: (filmId: number): Promise<TracksByType> =>
      client.get(`/api/films/${filmId}/tracks/by-type`),
    update: (filmId: number, trackId: number, data: UpdateTrackDto): Promise<TimelineTrack> =>
      client.patch(`/api/films/${filmId}/tracks/${trackId}`, data),
    reorder: (filmId: number, data: ReorderTracksDto): Promise<TimelineTrack[]> =>
      client.post(`/api/films/${filmId}/tracks/reorder`, data),
    delete: (filmId: number, trackId: number): Promise<void> =>
      client.delete(`/api/films/${filmId}/tracks/${trackId}`),
    getStatistics: (filmId: number): Promise<TrackStatistics> =>
      client.get(`/api/films/${filmId}/tracks/statistics`),
  },

  localScenes: {
    createFromTemplate: (filmId: number, data: CreateSceneFromTemplateDto): Promise<FilmLocalScene> =>
      client.post(`/api/films/${filmId}/scenes/from-template`, data),
    createBlank: (filmId: number, data: CreateBlankSceneDto): Promise<FilmLocalScene> =>
      client.post(`/api/films/${filmId}/scenes/blank`, data),
    getAll: (filmId: number): Promise<FilmLocalScene[]> =>
      client.get(`/api/films/${filmId}/scenes`),
    updateDurationMode: (filmId: number, sceneId: number, data: UpdateDurationModeDto): Promise<FilmLocalScene> =>
      client.patch(`/api/films/${filmId}/scenes/${sceneId}/duration-mode`, data),
    getDuration: (filmId: number, sceneId: number): Promise<SceneDurationInfo> =>
      client.get(`/api/films/${filmId}/scenes/${sceneId}/duration`),
    getAllDurations: (filmId: number): Promise<SceneDurationInfo[]> =>
      client.get(`/api/films/${filmId}/scenes/durations`),
    create: (filmId: number, data: { name: string; scene_template_id?: number; order_index?: number; shot_count?: number | null; duration_seconds?: number | null; mode?: 'MOMENTS' | 'MONTAGE'; montage_style?: string; montage_bpm?: number }): Promise<FilmLocalScene> =>
      client.post(`/api/scenes/films/${filmId}/scenes`, data),
    reorder: (filmId: number, sceneOrderings: Array<{ id: number; order_index: number }>): Promise<unknown> =>
      client.post(`/api/scenes/${filmId}/reorder`, sceneOrderings),
  },

  timelineLayers: {
    getAll: (): Promise<TimelineLayer[]> =>
      client.get('/api/films/timeline-layers', { skipBrandContext: true }),
    create: (data: CreateTimelineLayerDto): Promise<TimelineLayer> =>
      client.post('/api/films/timeline-layers', data, { skipBrandContext: true }),
    update: (id: number, data: UpdateTimelineLayerDto): Promise<TimelineLayer> =>
      client.patch(`/api/films/timeline-layers/${id}`, data, { skipBrandContext: true }),
    delete: (id: number): Promise<void> =>
      client.delete(`/api/films/timeline-layers/${id}`, { skipBrandContext: true }),
  },
});

export const filmsApi = createFilmsApi(apiClient);
export type FilmsApi = ReturnType<typeof createFilmsApi>;
