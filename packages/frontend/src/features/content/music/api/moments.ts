import {
    MomentTemplate,
    SceneMoment,
    SceneMomentMusic,
    CreateMomentTemplateDto,
    UpdateMomentTemplateDto,
    CreateSceneMomentDto,
    UpdateSceneMomentDto,
    CreateSceneMomentMusicDto,
    UpdateSceneMomentMusicDto,
    ReorderMomentsDto,
    SceneType
} from '@/features/content/moments/types/moments-legacy';
import { apiClient } from '@/shared/api/client';
import type { ApiClient } from '@/shared/api/client';

const buildSceneMomentsPath = (sceneId: number, projectId?: number) => {
    const queryParams = new URLSearchParams();
    if (projectId) {
        queryParams.append('project_id', projectId.toString());
    }
    const queryString = queryParams.toString();

    return `/api/moments/scenes/${sceneId}${queryString ? `?${queryString}` : ''}`;
};

export const createMusicMomentsApi = (client: ApiClient) => ({
    getAllMomentTemplates: (): Promise<MomentTemplate[]> =>
        client.get('/api/moments/templates'),

    getMomentTemplatesBySceneType: (sceneType: SceneType): Promise<MomentTemplate[]> =>
        client.get(`/api/moments/templates?scene_type=${sceneType}`),

    createMomentTemplate: (data: CreateMomentTemplateDto): Promise<MomentTemplate> =>
        client.post('/api/moments/templates', data),

    updateMomentTemplate: (id: number, data: UpdateMomentTemplateDto): Promise<MomentTemplate> =>
        client.patch(`/api/moments/templates/${id}`, data),

    deleteMomentTemplate: (id: number): Promise<MomentTemplate> =>
        client.delete(`/api/moments/templates/${id}`),

    getSceneMoments: (sceneId: number, projectId?: number): Promise<SceneMoment[]> =>
        client.get(buildSceneMomentsPath(sceneId, projectId)),

    createSceneMoment: (sceneId: number, data: Omit<CreateSceneMomentDto, 'scene_id'>): Promise<SceneMoment> =>
        client.post(`/api/moments/scenes/${sceneId}`, { ...data, scene_id: sceneId }),

    createMomentsFromTemplate: (sceneId: number, sceneType: SceneType, projectId?: number): Promise<SceneMoment[]> =>
        client.post(`/api/moments/scenes/${sceneId}/from-template`, { scene_type: sceneType, project_id: projectId }),

    updateSceneMoment: (sceneId: number, momentId: number, data: UpdateSceneMomentDto): Promise<SceneMoment> =>
        client.patch(`/api/moments/scenes/${sceneId}/${momentId}`, data),

    reorderSceneMoments: (sceneId: number, momentIds: number[]): Promise<SceneMoment[]> =>
        client.post(`/api/moments/scenes/${sceneId}/reorder`, { moment_ids: momentIds }),

    deleteSceneMoment: (sceneId: number, momentId: number): Promise<SceneMoment> =>
        client.delete(`/api/moments/scenes/${sceneId}/${momentId}`),

    assignCoverageToMoment: (momentId: number, coverageId: number): Promise<SceneMoment> =>
        client.post(`/api/moments/${momentId}/coverage/${coverageId}`, undefined),

    removeCoverageFromMoment: (momentId: number, coverageId: number): Promise<SceneMoment> =>
        client.delete(`/api/moments/${momentId}/coverage/${coverageId}`),

    updateSceneCoverageAssignments: (sceneId: number): Promise<{ updated: number }> =>
        client.patch(`/api/moments/scenes/${sceneId}/update-assignments`, undefined),

    getSceneMomentMusic: async (momentId: number): Promise<SceneMomentMusic | null> => {
        try {
            return await client.get(`/api/music/moments/${momentId}/music`);
        } catch {
            return null;
        }
    },

    createSceneMomentMusic: (momentId: number, data: Omit<CreateSceneMomentMusicDto, 'moment_id'>): Promise<SceneMomentMusic> =>
        client.post(`/api/music/moments/${momentId}/music`, data),

    updateSceneMomentMusic: (momentId: number, data: UpdateSceneMomentMusicDto): Promise<SceneMomentMusic> =>
        client.patch(`/api/music/moments/${momentId}/music`, data),

    deleteSceneMomentMusic: (momentId: number): Promise<void> =>
        client.delete(`/api/music/moments/${momentId}/music`),
});

export type MusicMomentsApi = ReturnType<typeof createMusicMomentsApi>;

export const momentsApi = createMusicMomentsApi(apiClient);
