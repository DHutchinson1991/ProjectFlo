// ─── Film Content API Adapter Interface ────────────────────────────────
// Normalized interface for film content CRUD operations (scenes, moments,
// beats, recording setups). Decouples ContentBuilder hooks from whether
// they are editing a library film, a project-instance film, or an
// inquiry-instance film.

export type FilmApiMode = 'library' | 'project' | 'inquiry';

export interface FilmContentApi {
  readonly mode: FilmApiMode;
  readonly filmId: number;

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
