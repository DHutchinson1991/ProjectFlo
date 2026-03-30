import { useState, useEffect, useCallback } from 'react';
import { CalendarEvent, EventType, Priority, Project } from '@/features/workflow/calendar/types/calendar-types';
import { CrewOption } from '@/features/workflow/calendar/hooks/use-crew-members';

export interface EventFormData {
    title: string;
    description: string;
    start: Date;
    end: Date;
    allDay: boolean;
    type: EventType;
    priority: Priority;
    assignee?: { id: string; name: string; email: string; role: string };
    project?: Project;
    location: string;
    id?: string;
}

interface FormState {
    title: string;
    description: string;
    start: Date;
    end: Date;
    allDay: boolean;
    type: EventType;
    priority: Priority;
    assignee: CrewOption | null;
    project: Project | null;
    location: string;
}

const defaultForm: FormState = {
    title: '', description: '', start: new Date(), end: new Date(),
    allDay: false, type: 'meeting' as EventType, priority: 'medium' as Priority,
    assignee: null, project: null, location: '',
};

export function formatDateTimeLocal(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${d}T${h}:${min}`;
}

interface UseEventFormOptions {
    open: boolean;
    mode: 'create' | 'edit';
    event?: CalendarEvent | null;
    initialData?: { start: Date; end: Date; title: string };
    currentUserCrew: CrewOption | null;
    onSave: (data: EventFormData) => void;
    onDelete?: (id: string) => void;
    onClose: () => void;
}

export function useEventForm({
    open, mode, event, initialData, currentUserCrew, onSave, onDelete, onClose,
}: UseEventFormOptions) {
    const [formData, setFormData] = useState<FormState>({ ...defaultForm });
    const [isFormInitialized, setIsFormInitialized] = useState(false);

    useEffect(() => {
        if (open && !isFormInitialized) {
            setIsFormInitialized(true);
            if (mode === 'edit' && event) {
                setFormData({
                    title: event.title, description: event.description || '',
                    start: new Date(event.start), end: new Date(event.end),
                    allDay: event.allDay || false, type: event.type, priority: event.priority,
                    assignee: event.assignee ? {
                        id: event.assignee.id, name: event.assignee.name, email: event.assignee.email,
                        initials: event.assignee.name.split(' ').map(n => n[0]).join('').toUpperCase(),
                        isCurrentUser: event.assignee.id === currentUserCrew?.id,
                    } : null,
                    project: event.project || null, location: event.location || '',
                });
            } else if (mode === 'create' && initialData) {
                setFormData({
                    ...defaultForm, title: initialData.title,
                    start: initialData.start, end: initialData.end,
                    assignee: currentUserCrew,
                });
            }
        }
    }, [open, mode, event, initialData, currentUserCrew, isFormInitialized]);

    useEffect(() => { if (!open) setIsFormInitialized(false); }, [open]);

    const handleSave = useCallback(() => {
        const data: EventFormData = {
            title: formData.title, description: formData.description,
            start: formData.start, end: formData.end, allDay: formData.allDay,
            type: formData.type, priority: formData.priority,
            assignee: formData.assignee ? {
                id: formData.assignee.id, name: formData.assignee.name,
                email: formData.assignee.email, role: 'crew',
            } : undefined,
            project: formData.project || undefined, location: formData.location,
        };
        if (mode === 'edit' && event) data.id = event.id;
        onSave(data);
        handleClose();
    }, [formData, mode, event, onSave]);

    const handleDelete = useCallback(() => {
        if (mode === 'edit' && event && onDelete) { onDelete(event.id); handleClose(); }
    }, [mode, event, onDelete]);

    const handleClose = useCallback(() => {
        setFormData({ ...defaultForm });
        setIsFormInitialized(false);
        onClose();
    }, [onClose]);

    return { formData, setFormData, handleSave, handleDelete, handleClose };
}
