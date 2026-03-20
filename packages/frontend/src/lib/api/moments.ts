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
} from '@/lib/types/moments';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

class MomentsApiService {
    // ==================== MOMENT TEMPLATES ====================

    async getAllMomentTemplates(): Promise<MomentTemplate[]> {
        const response = await fetch(`${API_BASE_URL}/moments/templates`);
        if (!response.ok) {
            throw new Error(`Failed to fetch moment templates: ${response.status}`);
        }
        return response.json();
    }

    async getMomentTemplatesBySceneType(sceneType: SceneType): Promise<MomentTemplate[]> {
        const response = await fetch(`${API_BASE_URL}/moments/templates?scene_type=${sceneType}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch moment templates for ${sceneType}: ${response.status}`);
        }
        return response.json();
    }

    async createMomentTemplate(data: CreateMomentTemplateDto): Promise<MomentTemplate> {
        const response = await fetch(`${API_BASE_URL}/moments/templates`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error(`Failed to create moment template: ${response.status}`);
        }
        return response.json();
    }

    async updateMomentTemplate(id: number, data: UpdateMomentTemplateDto): Promise<MomentTemplate> {
        const response = await fetch(`${API_BASE_URL}/moments/templates/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error(`Failed to update moment template: ${response.status}`);
        }
        return response.json();
    }

    async deleteMomentTemplate(id: number): Promise<MomentTemplate> {
        const response = await fetch(`${API_BASE_URL}/moments/templates/${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error(`Failed to delete moment template: ${response.status}`);
        }
        return response.json();
    }

    // ==================== SCENE MOMENTS ====================

    async getSceneMoments(sceneId: number, projectId?: number): Promise<SceneMoment[]> {
        const url = new URL(`${API_BASE_URL}/moments/scenes/${sceneId}`);
        if (projectId) {
            url.searchParams.append('project_id', projectId.toString());
        }

        const response = await fetch(url.toString());
        if (!response.ok) {
            throw new Error(`Failed to fetch scene moments: ${response.status}`);
        }
        return response.json();
    }

    async createSceneMoment(sceneId: number, data: Omit<CreateSceneMomentDto, 'scene_id'>): Promise<SceneMoment> {
        const response = await fetch(`${API_BASE_URL}/moments/scenes/${sceneId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ...data, scene_id: sceneId }),
        });

        if (!response.ok) {
            throw new Error(`Failed to create scene moment: ${response.status}`);
        }
        return response.json();
    }

    async createMomentsFromTemplate(sceneId: number, sceneType: SceneType, projectId?: number): Promise<SceneMoment[]> {
        const response = await fetch(`${API_BASE_URL}/moments/scenes/${sceneId}/from-template`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ scene_type: sceneType, project_id: projectId }),
        });

        if (!response.ok) {
            throw new Error(`Failed to create moments from template: ${response.status}`);
        }
        return response.json();
    }

    async updateSceneMoment(sceneId: number, momentId: number, data: UpdateSceneMomentDto): Promise<SceneMoment> {
        const response = await fetch(`${API_BASE_URL}/moments/scenes/${sceneId}/${momentId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error(`Failed to update scene moment: ${response.status}`);
        }
        return response.json();
    }

    async reorderSceneMoments(sceneId: number, momentIds: number[]): Promise<SceneMoment[]> {
        const response = await fetch(`${API_BASE_URL}/moments/scenes/${sceneId}/reorder`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ moment_ids: momentIds }),
        });

        if (!response.ok) {
            throw new Error(`Failed to reorder scene moments: ${response.status}`);
        }
        return response.json();
    }

    async deleteSceneMoment(sceneId: number, momentId: number): Promise<SceneMoment> {
        const response = await fetch(`${API_BASE_URL}/moments/scenes/${sceneId}/${momentId}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error(`Failed to delete scene moment: ${response.status}`);
        }
        return response.json();
    }
    // ==================== COVERAGE ASSIGNMENT ====================

    async assignCoverageToMoment(momentId: number, coverageId: number): Promise<SceneMoment> {
        const response = await fetch(`${API_BASE_URL}/moments/${momentId}/coverage/${coverageId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to assign coverage to moment: ${response.status}`);
        }
        return response.json();
    }

    async removeCoverageFromMoment(momentId: number, coverageId: number): Promise<SceneMoment> {
        const response = await fetch(`${API_BASE_URL}/moments/${momentId}/coverage/${coverageId}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error(`Failed to remove coverage from moment: ${response.status}`);
        }
        return response.json();
    }
    // ==================== COVERAGE ASSIGNMENTS ====================

    async updateSceneCoverageAssignments(sceneId: number): Promise<{ updated: number }> {
        const response = await fetch(`${API_BASE_URL}/moments/scenes/${sceneId}/update-assignments`, {
            method: 'PATCH',
        });

        if (!response.ok) {
            throw new Error(`Failed to update scene coverage assignments: ${response.status}`);
        }
        return response.json();
    }

    // ==================== MOMENT MUSIC ====================

    async getSceneMomentMusic(momentId: number): Promise<SceneMomentMusic | null> {
        const response = await fetch(`${API_BASE_URL}/moments/${momentId}/music`);
        if (response.status === 404) {
            return null; // No music found for this moment
        }
        if (!response.ok) {
            throw new Error(`Failed to get moment music: ${response.status}`);
        }
        return response.json();
    }

    async createSceneMomentMusic(momentId: number, data: Omit<CreateSceneMomentMusicDto, 'moment_id'>): Promise<SceneMomentMusic> {
        const response = await fetch(`${API_BASE_URL}/moments/${momentId}/music`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error(`Failed to create moment music: ${response.status}`);
        }
        return response.json();
    }

    async updateSceneMomentMusic(momentId: number, data: UpdateSceneMomentMusicDto): Promise<SceneMomentMusic> {
        const response = await fetch(`${API_BASE_URL}/moments/${momentId}/music`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error(`Failed to update moment music: ${response.status}`);
        }
        return response.json();
    }

    async deleteSceneMomentMusic(momentId: number): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/moments/${momentId}/music`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error(`Failed to delete moment music: ${response.status}`);
        }
    }
}

export const momentsApi = new MomentsApiService();
