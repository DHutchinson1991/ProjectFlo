import type {
    CreateMusicLibraryItemDto,
    MusicLibraryItem,
    UpdateMusicLibraryItemDto,
} from '@/features/content/music/types';
import { apiClient } from '@/shared/api/client';
import type { ApiClient } from '@/shared/api/client';

const buildMusicLibraryPath = (projectId?: number, sceneId?: number) => {
    const queryParams = new URLSearchParams();
    if (projectId) queryParams.append('project_id', projectId.toString());
    if (sceneId) queryParams.append('scene_id', sceneId.toString());
    const queryString = queryParams.toString();

    return `/api/music/library${queryString ? `?${queryString}` : ''}`;
};

export const createMusicLibraryApi = (client: ApiClient) => ({
    getMusicLibrary: (projectId?: number, sceneId?: number): Promise<MusicLibraryItem[]> =>
        client.get(buildMusicLibraryPath(projectId, sceneId)),

    getMusicTemplates: async (): Promise<MusicLibraryItem[]> => {
        const allMusic = await client.get<MusicLibraryItem[]>('/api/music/library');
        return allMusic.filter((item) => !item.project_id && item.assignment_number?.startsWith('M'));
    },

    getMusicLibraryItem: (itemId: number): Promise<MusicLibraryItem> =>
        client.get(`/api/music/library/${itemId}`),

    createMusicLibraryItem: (data: CreateMusicLibraryItemDto): Promise<MusicLibraryItem> =>
        client.post('/api/music/library', data),

    updateMusicLibraryItem: (itemId: number, data: UpdateMusicLibraryItemDto): Promise<MusicLibraryItem> =>
        client.patch(`/api/music/library/${itemId}`, data),

    deleteMusicLibraryItem: (itemId: number): Promise<void> =>
        client.delete(`/api/music/library/${itemId}`),

    attachMusicToMoment: (momentId: number, musicLibraryItemId: number): Promise<void> =>
        client.post(`/api/music/moments/${momentId}/attach`, {
            music_library_item_id: musicLibraryItemId,
        }),

    detachMusicFromMoment: (momentId: number): Promise<void> =>
        client.post(`/api/music/moments/${momentId}/detach`, undefined),
});

export type MusicLibraryApi = ReturnType<typeof createMusicLibraryApi>;

export const musicApi = createMusicLibraryApi(apiClient);
