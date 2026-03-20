'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { api, apiClient } from '@/lib/api';
import { createScenesApi } from '@/lib/api/scenes.api';
import type { ApiClient } from '@/lib/api/api-client.types';
import type { CreateSceneMomentDto, UpdateSceneMomentDto } from '@/lib/types/domains/moments';
import type { CreateFilmSceneDto } from '@/lib/types/domains/scenes';

// ─── Film Content API Adapter Interface ────────────────────────────────
// Normalized interface for film content CRUD operations (scenes, moments,
// beats, recording setups). Decouples ContentBuilder hooks from whether
// they are editing a library film, a project-instance film, or an
// inquiry-instance film.
//
// Key convention: `filmId` = the ID used to resolve the owning film row:
//   • Library mode  → Film.id (from the component library)
//   • Project mode  → ProjectFilm.id (the cloned instance row)
//   • Inquiry mode  → ProjectFilm.id (inquiry-owned instance row)
//
// The adapter implementations route to the correct backend endpoints
// internally so callers never see /instance-films vs /scenes differences.
// ────────────────────────────────────────────────────────────────────────

export type FilmApiMode = 'library' | 'project' | 'inquiry';

export interface FilmContentApi {
  /** Which entity type this adapter targets */
  readonly mode: FilmApiMode;
  /** The owning film entity ID (filmId / projectFilmId) */
  readonly filmId: number;

  // ─── Scenes ────────────────────────────────────────────────────────
  scenes: {
    getByFilm(filmId: number): Promise<unknown[]>;
    getById(id: number): Promise<unknown>;
    create(data: {
      film_id?: number;
      name: string;
      scene_template_id?: number;
      order_index?: number;
      mode?: string;
      duration_seconds?: number;
      source_scene_id?: number;
    }): Promise<unknown>;
    update(id: number, data: {
      name?: string;
      order_index?: number;
      duration_seconds?: number;
    }): Promise<unknown>;
    delete(id: number): Promise<void>;

    recordingSetup: {
      get(sceneId: number): Promise<unknown>;
      upsert(sceneId: number, data: {
        camera_track_ids?: number[];
        audio_track_ids?: number[];
        graphics_enabled?: boolean;
      }): Promise<unknown>;
      delete(sceneId: number): Promise<unknown>;
    };
  };

  // ─── Moments ───────────────────────────────────────────────────────
  moments: {
    getByScene(sceneId: number): Promise<unknown[]>;
    getById(id: number): Promise<unknown>;
    create(data: {
      film_scene_id?: number;
      name: string;
      order_index?: number;
      duration?: number;
    }): Promise<unknown>;
    update(id: number, data: {
      name?: string;
      order_index?: number;
      duration?: number;
    }): Promise<unknown>;
    delete(id: number): Promise<void>;
    clearRecordingSetup(id: number): Promise<unknown>;
    upsertRecordingSetup(id: number, data: {
      camera_track_ids?: number[];
      camera_assignments?: Array<{ track_id: number; subject_ids?: number[]; shot_type?: string | null }>;
      audio_track_ids?: number[];
      graphics_enabled?: boolean;
      graphics_title?: string | null;
    }): Promise<unknown>;
  };

  // ─── Beats ─────────────────────────────────────────────────────────
  beats: {
    create(sceneId: number, data: {
      name: string;
      duration_seconds?: number;
      order_index?: number;
      shot_count?: number | null;
    }): Promise<unknown>;
    update(beatId: number, data: {
      name?: string;
      duration_seconds?: number;
      order_index?: number;
      shot_count?: number | null;
    }): Promise<unknown>;
    delete(beatId: number): Promise<void>;

    recordingSetup: {
      get(beatId: number): Promise<unknown>;
      upsert(beatId: number, data: {
        camera_track_ids?: number[];
        audio_track_ids?: number[];
        graphics_enabled?: boolean;
      }): Promise<unknown>;
      delete(beatId: number): Promise<unknown>;
    };
  };
}

// ─── React Context ─────────────────────────────────────────────────────

const FilmApiContext = createContext<FilmContentApi | null>(null);

export function useFilmApi(): FilmContentApi {
  const ctx = useContext(FilmApiContext);
  if (!ctx) {
    throw new Error('useFilmApi must be used within a FilmApiProvider');
  }
  return ctx;
}

/** Optional hook that returns null when outside a provider (for backward compat) */
export function useOptionalFilmApi(): FilmContentApi | null {
  return useContext(FilmApiContext);
}

// ─── Factory: Library Mode ─────────────────────────────────────────────
// Routes to the original /scenes, /moments, /beats endpoints for editing
// film content in the component library.

export function createLibraryFilmApi(filmId: number): FilmContentApi {
  const scenesApi = createScenesApi(apiClient as unknown as ApiClient);

  return {
    mode: 'library',
    filmId,

    scenes: {
      getByFilm: (fId) => scenesApi.scenes.getByFilm(fId),
      getById: (id) => scenesApi.scenes.getById(id),
      create: (data) => scenesApi.scenes.create({
        ...data,
        film_id: filmId,
        order_index: data.order_index ?? 0,
        mode: data.mode as CreateFilmSceneDto['mode'],
      }),
      update: (id, data) => scenesApi.scenes.update(id, data),
      delete: (id) => scenesApi.scenes.delete(id),

      recordingSetup: {
        get: (sceneId) => scenesApi.scenes.recordingSetup.get(sceneId),
        upsert: (sceneId, data) => scenesApi.scenes.recordingSetup.upsert(sceneId, data),
        delete: (sceneId) => scenesApi.scenes.recordingSetup.delete(sceneId),
      },
    },

    moments: {
      getByScene: (sceneId) => scenesApi.moments.getByScene(sceneId),
      getById: (id) => scenesApi.moments.getById(id),
      create: (data) => scenesApi.moments.create({
        film_scene_id: data.film_scene_id!,
        name: data.name,
        order_index: data.order_index ?? 0,
        duration: data.duration,
      } satisfies CreateSceneMomentDto),
      update: (id, data) => scenesApi.moments.update(id, data as UpdateSceneMomentDto),
      delete: (id) => scenesApi.moments.delete(id),
      clearRecordingSetup: (id) => scenesApi.moments.clearRecordingSetup(id),
      upsertRecordingSetup: (id, data) => scenesApi.moments.upsertRecordingSetup(id, data),
    },

    beats: {
      create: (sceneId, data) => api.beats.create(sceneId, data),
      update: (beatId, data) => api.beats.update(beatId, data),
      delete: (beatId) => api.beats.delete(beatId),

      recordingSetup: {
        get: (beatId) => api.beats.recordingSetup.get(beatId),
        upsert: (beatId, data) => api.beats.recordingSetup.upsert(beatId, data),
        delete: (beatId) => api.beats.recordingSetup.delete(beatId),
      },
    },
  };
}

// ─── Factory: Project Instance Mode ────────────────────────────────────
// Routes to /instance-films/* endpoints for editing film content
// on a project-owned instance.

export function createProjectFilmApi(projectFilmId: number): FilmContentApi {
  return {
    mode: 'project',
    filmId: projectFilmId,

    scenes: {
      getByFilm: () => api.instanceFilms.scenes.getAll(projectFilmId),
      getById: (id) => api.instanceFilms.scenes.getById(id),
      create: (data) =>
        api.instanceFilms.scenes.create(projectFilmId, {
          name: data.name,
          mode: data.mode,
          order_index: data.order_index,
          duration_seconds: data.duration_seconds,
          source_scene_id: data.source_scene_id ?? data.scene_template_id,
          scene_template_id: data.scene_template_id,
        }),
      update: (id, data) => api.instanceFilms.scenes.update(id, data),
      delete: (id) => api.instanceFilms.scenes.delete(id),

      recordingSetup: {
        get: (sceneId) => api.instanceFilms.scenes.recordingSetup.get(sceneId),
        upsert: (sceneId, data) => api.instanceFilms.scenes.recordingSetup.upsert(sceneId, data),
        delete: (sceneId) => api.instanceFilms.scenes.recordingSetup.delete(sceneId),
      },
    },

    moments: {
      getByScene: (sceneId) => api.instanceFilms.moments.getByScene(sceneId),
      getById: (id) => api.instanceFilms.moments.getById(id),
      create: (data) => {
        const sceneId = data.film_scene_id;
        if (!sceneId) throw new Error('film_scene_id is required for moment creation');
        return api.instanceFilms.moments.create(sceneId, {
          name: data.name,
          order_index: data.order_index,
          duration: data.duration,
        });
      },
      update: (id, data) => api.instanceFilms.moments.update(id, data),
      delete: (id) => api.instanceFilms.moments.delete(id),
      clearRecordingSetup: (id) => api.instanceFilms.moments.recordingSetup.delete(id),
      upsertRecordingSetup: (id, data) => api.instanceFilms.moments.recordingSetup.upsert(id, data),
    },

    beats: {
      create: (sceneId, data) => api.instanceFilms.beats.create(sceneId, data),
      update: (beatId, data) => api.instanceFilms.beats.update(beatId, data),
      delete: (beatId) => api.instanceFilms.beats.delete(beatId),

      recordingSetup: {
        get: (beatId) => api.instanceFilms.beats.recordingSetup.get(beatId),
        upsert: (beatId, data) => api.instanceFilms.beats.recordingSetup.upsert(beatId, data),
        delete: (beatId) => api.instanceFilms.beats.recordingSetup.delete(beatId),
      },
    },
  };
}

// ─── Factory: Inquiry Instance Mode ────────────────────────────────────
// Same as project mode — both use /instance-films endpoints. The only
// difference is semantic (the ProjectFilm row has inquiry_id set instead
// of project_id), but the CRUD routes are identical.

export function createInquiryFilmApi(projectFilmId: number): FilmContentApi {
  return {
    ...createProjectFilmApi(projectFilmId),
    mode: 'inquiry',
  };
}

// ─── Provider Component ────────────────────────────────────────────────

interface FilmApiProviderProps {
  children: React.ReactNode;
  filmApi: FilmContentApi;
}

export function FilmApiProvider({ children, filmApi }: FilmApiProviderProps) {
  return (
    <FilmApiContext.Provider value={filmApi}>
      {children}
    </FilmApiContext.Provider>
  );
}

/** Convenience hook: memoize a film API adapter by mode+filmId */
export function useFilmApiAdapter(
  mode: FilmApiMode,
  filmId: number,
): FilmContentApi {
  return useMemo(() => {
    switch (mode) {
      case 'library':
        return createLibraryFilmApi(filmId);
      case 'project':
        return createProjectFilmApi(filmId);
      case 'inquiry':
        return createInquiryFilmApi(filmId);
    }
  }, [mode, filmId]);
}
