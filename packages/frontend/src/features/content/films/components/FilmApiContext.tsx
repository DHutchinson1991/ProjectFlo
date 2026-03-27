'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { instanceFilmsApi } from '@/features/content/films/api/instance-films.api';
import { scenesApi } from '@/features/content/scenes/api';
import { beatsApi } from '@/features/content/beats/api';
import type { CreateSceneMomentDto, UpdateSceneMomentDto } from '@/features/content/moments/types';
import type { CreateFilmSceneDto } from '@/features/content/scenes/types';
import type { FilmContentApi, FilmApiMode } from '@/features/content/films/types/film-api.types';

export type { FilmContentApi, FilmApiMode };

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
      create: (sceneId, data) => beatsApi.create(sceneId, data),
      update: (beatId, data) => beatsApi.update(beatId, data),
      delete: (beatId) => beatsApi.delete(beatId),

      recordingSetup: {
        get: (beatId) => beatsApi.recordingSetup.get(beatId),
        upsert: (beatId, data) => beatsApi.recordingSetup.upsert(beatId, data),
        delete: (beatId) => beatsApi.recordingSetup.delete(beatId),
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
      getByFilm: () => instanceFilmsApi.scenes.getAll(projectFilmId),
      getById: (id) => instanceFilmsApi.scenes.getById(id),
      create: (data) =>
        instanceFilmsApi.scenes.create(projectFilmId, {
          name: data.name,
          mode: data.mode,
          order_index: data.order_index,
          duration_seconds: data.duration_seconds,
          source_scene_id: data.source_scene_id ?? data.scene_template_id,
          scene_template_id: data.scene_template_id,
        }),
      update: (id, data) => instanceFilmsApi.scenes.update(id, data),
      delete: (id) => instanceFilmsApi.scenes.delete(id),

      recordingSetup: {
        get: (sceneId) => instanceFilmsApi.scenes.recordingSetup.get(sceneId),
        upsert: (sceneId, data) => instanceFilmsApi.scenes.recordingSetup.upsert(sceneId, data),
        delete: (sceneId) => instanceFilmsApi.scenes.recordingSetup.delete(sceneId),
      },
    },

    moments: {
      getByScene: (sceneId) => instanceFilmsApi.moments.getByScene(sceneId),
      getById: (id) => instanceFilmsApi.moments.getById(id),
      create: (data) => {
        const sceneId = data.film_scene_id;
        if (!sceneId) throw new Error('film_scene_id is required for moment creation');
        return instanceFilmsApi.moments.create(sceneId, {
          name: data.name,
          order_index: data.order_index,
          duration: data.duration,
        });
      },
      update: (id, data) => instanceFilmsApi.moments.update(id, data),
      delete: (id) => instanceFilmsApi.moments.delete(id),
      clearRecordingSetup: (id) => instanceFilmsApi.moments.recordingSetup.delete(id),
      upsertRecordingSetup: (id, data) => instanceFilmsApi.moments.recordingSetup.upsert(id, data),
    },

    beats: {
      create: (sceneId, data) => instanceFilmsApi.beats.create(sceneId, data),
      update: (beatId, data) => instanceFilmsApi.beats.update(beatId, data),
      delete: (beatId) => instanceFilmsApi.beats.delete(beatId),

      recordingSetup: {
        get: (beatId) => instanceFilmsApi.beats.recordingSetup.get(beatId),
        upsert: (beatId, data) => instanceFilmsApi.beats.recordingSetup.upsert(beatId, data),
        delete: (beatId) => instanceFilmsApi.beats.recordingSetup.delete(beatId),
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
