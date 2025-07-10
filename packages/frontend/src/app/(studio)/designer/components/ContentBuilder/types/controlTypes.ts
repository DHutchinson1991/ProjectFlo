import { TimelineScene } from './sceneTypes';

export interface ContentBuilderProps {
    initialScenes?: TimelineScene[];
    onSave?: (scenes: TimelineScene[]) => void;
    readOnly?: boolean;
}

export interface SaveState {
    hasUnsavedChanges: boolean;
    lastSavedAt: Date | null;
    isSaving: boolean;
    saveError: string | null;
}
