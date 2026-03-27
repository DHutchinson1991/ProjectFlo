import { useState, useEffect } from 'react';
import { filmsApi } from '@/features/content/films/api';
import { scenesApi } from '../api';
import type { ScenesLibrary } from '../types';
import type { DurationMode, SceneType } from '@/features/content/films/types/film-scenes.types';

export function useSceneCreation(filmId: number, onSceneCreated?: () => void) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [sceneTemplates, setSceneTemplates] = useState<ScenesLibrary[]>([]);
    const [selectedTab, setSelectedTab] = useState<'template' | 'blank'>('template');

    const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
    const [customName, setCustomName] = useState('');
    const [copyMoments, setCopyMoments] = useState(true);

    const [blankSceneName, setBlankSceneName] = useState('');
    const [blankSceneType, setBlankSceneType] = useState<SceneType>('VIDEO');
    const [blankSceneDescription, setBlankSceneDescription] = useState('');
    const [durationMode, setDurationMode] = useState<DurationMode>('MOMENTS');
    const [fixedDuration, setFixedDuration] = useState(60);

    useEffect(() => {
        if (open) {
            scenesApi.templates.getAll().then(setSceneTemplates).catch(console.error);
        }
    }, [open]);

    const handleCreateFromTemplate = async () => {
        if (!selectedTemplate) return;
        try {
            setLoading(true);
            await filmsApi.localScenes.createFromTemplate(filmId, {
                template_scene_id: selectedTemplate,
                custom_name: customName || undefined,
                copy_moments: copyMoments,
            });
            setSelectedTemplate(null);
            setCustomName('');
            setCopyMoments(true);
            setOpen(false);
            onSceneCreated?.();
        } catch (error) {
            console.error('Failed to create scene from template:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateBlankScene = async () => {
        if (!blankSceneName) return;
        try {
            setLoading(true);
            await filmsApi.localScenes.createBlank(filmId, {
                name: blankSceneName,
                type: blankSceneType,
                description: blankSceneDescription || undefined,
                duration_mode: durationMode,
                fixed_duration: durationMode === 'FIXED' ? fixedDuration : undefined,
            });
            setBlankSceneName('');
            setBlankSceneType('VIDEO');
            setBlankSceneDescription('');
            setDurationMode('MOMENTS');
            setFixedDuration(60);
            setOpen(false);
            onSceneCreated?.();
        } catch (error) {
            console.error('Failed to create blank scene:', error);
        } finally {
            setLoading(false);
        }
    };

    return {
        open, setOpen, loading, sceneTemplates, selectedTab, setSelectedTab,
        selectedTemplate, setSelectedTemplate, customName, setCustomName,
        copyMoments, setCopyMoments, blankSceneName, setBlankSceneName,
        blankSceneType, setBlankSceneType, blankSceneDescription, setBlankSceneDescription,
        durationMode, setDurationMode, fixedDuration, setFixedDuration,
        handleCreateFromTemplate, handleCreateBlankScene,
    };
}
