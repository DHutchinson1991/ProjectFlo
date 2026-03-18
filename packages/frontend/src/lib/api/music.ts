import { MusicType } from '@/lib/types/moments';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

export interface MusicLibraryItem {
    id: number;
    assignment_number?: string;
    music_name?: string;
    artist?: string;
    duration?: number;
    music_type: MusicType;
    file_path?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
    project_id?: number;
    brand_id?: number;
    scene_id?: number;
    moment_id?: number;
    moment_name?: string;
    scene_name?: string;
}

export interface CreateMusicLibraryItemDto {
    assignment_number?: string;
    music_name?: string;
    artist?: string;
    duration?: number;
    music_type: MusicType;
    file_path?: string;
    notes?: string;
    project_id?: number;
    brand_id?: number;
    scene_id?: number;
}

export interface UpdateMusicLibraryItemDto {
    assignment_number?: string;
    music_name?: string;
    artist?: string;
    duration?: number;
    music_type?: MusicType;
    file_path?: string;
    notes?: string;
    project_id?: number;
    brand_id?: number;
    scene_id?: number;
}

class MusicApiService {
    // ==================== MUSIC LIBRARY ====================

    async getMusicLibrary(projectId?: number, sceneId?: number): Promise<MusicLibraryItem[]> {
        const queryParams = new URLSearchParams();
        if (projectId) queryParams.append('project_id', projectId.toString());
        if (sceneId) queryParams.append('scene_id', sceneId.toString());
        const queryString = queryParams.toString();
        const response = await fetch(`${API_BASE_URL}/music/library${queryString ? '?' + queryString : ''}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch music library: ${response.status}`);
        }
        return response.json();
    }

    async getMusicTemplates(): Promise<MusicLibraryItem[]> {
        // Get template music items (those without project_id)
        const response = await fetch(`${API_BASE_URL}/music/library`);
        if (!response.ok) {
            throw new Error(`Failed to fetch music templates: ${response.status}`);
        }
        const allMusic = await response.json();
        // Filter to get only template items (those without project_id and with assignment numbers)
        return allMusic.filter((item: MusicLibraryItem) =>
            !item.project_id && item.assignment_number?.startsWith('M')
        );
    }

    async getMusicLibraryItem(itemId: number): Promise<MusicLibraryItem> {
        const response = await fetch(`${API_BASE_URL}/music/library/${itemId}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch music item: ${response.status}`);
        }
        return response.json();
    }

    async createMusicLibraryItem(data: CreateMusicLibraryItemDto): Promise<MusicLibraryItem> {
        const response = await fetch(`${API_BASE_URL}/music/library`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error(`Failed to create music item: ${response.status}`);
        }
        return response.json();
    }

    async updateMusicLibraryItem(itemId: number, data: UpdateMusicLibraryItemDto): Promise<MusicLibraryItem> {
        const response = await fetch(`${API_BASE_URL}/music/library/${itemId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error(`Failed to update music item: ${response.status}`);
        }
        return response.json();
    }

    async deleteMusicLibraryItem(itemId: number): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/music/library/${itemId}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error(`Failed to delete music item: ${response.status}`);
        }
    }

    // ==================== ATTACH/DETACH MUSIC TO MOMENTS ====================

    async attachMusicToMoment(momentId: number, musicLibraryItemId: number): Promise<void> {
        console.log('🎵 attachMusicToMoment called with:', { momentId, musicLibraryItemId, musicLibraryItemIdType: typeof musicLibraryItemId });
        
        const response = await fetch(`${API_BASE_URL}/music/moments/${momentId}/attach`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ music_library_item_id: musicLibraryItemId }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Backend error response:', { status: response.status, body: errorText });
            throw new Error(`Failed to attach music to moment: ${response.status} - ${errorText}`);
        }
    }

    async detachMusicFromMoment(momentId: number): Promise<void> {
        console.log('🎵 detachMusicFromMoment called with:', { momentId });

        const response = await fetch(`${API_BASE_URL}/music/moments/${momentId}/detach`, {
            method: 'POST',
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Backend error response (detach):', { status: response.status, body: errorText });
            throw new Error(`Failed to detach music from moment: ${response.status} - ${errorText}`);
        }
    }
}

export const musicApi = new MusicApiService();
