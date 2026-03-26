import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import type { ApiClient } from '@/lib/api/api-client.types';
import { createProjectsApi } from '../api';
import { useProjects } from './useProjects';
import type { Project } from '../types/project.types';

type ProjectEventDay = { id: number; name?: string; order_index?: number };
type ProjectFilmRecord = { id: number; film_id: number; order_index?: number; film?: { id: number; name?: string } };

const projectsApi = createProjectsApi(apiClient as unknown as ApiClient);

export function useProjectProduction(project: Project) {
    const { syncScheduleFromPackage } = useProjects();
    const [eventDays, setEventDays] = useState<ProjectEventDay[]>([]);
    const [projectFilms, setProjectFilms] = useState<ProjectFilmRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [syncing, setSyncing] = useState(false);

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const [days, films] = await Promise.all([
                projectsApi.getProjectEventDays(project.id),
                projectsApi.getProjectFilms(project.id),
            ]);
            setEventDays(days ?? []);
            setProjectFilms(films ?? []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load production data');
        } finally {
            setLoading(false);
        }
    }, [project.id]);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    const handleSyncFromPackage = useCallback(async () => {
        if (!project.source_package_id) {
            return;
        }

        setSyncing(true);
        try {
            const success = await syncScheduleFromPackage(project.id);
            if (success) {
                await refresh();
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to sync schedule from package');
        } finally {
            setSyncing(false);
        }
    }, [project.id, project.source_package_id, refresh, syncScheduleFromPackage]);

    const deleteProjectFilm = useCallback(async (projectFilmId: number) => {
        await projectsApi.deleteProjectFilm(projectFilmId);
        setProjectFilms((prev) => prev.filter((film) => film.id !== projectFilmId));
    }, []);

    return { eventDays, projectFilms, loading, error, syncing, refresh, handleSyncFromPackage, deleteProjectFilm };
}
