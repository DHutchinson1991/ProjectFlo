import { EventType, TaskType, Priority, CalendarTask, User, Project } from './types';

// Event type configuration
export const eventTypeConfig: Record<EventType, { label: string; color: string; icon: string }> = {
    'meeting': { label: 'Meeting', color: '#4A90E2', icon: '👥' },
    'shooting': { label: 'Shooting', color: '#ff6b6b', icon: '🎥' },
    'editing': { label: 'Editing', color: '#f39c12', icon: '✂️' },
    'client_call': { label: 'Client Call', color: '#2ecc71', icon: '📞' },
    'deadline': { label: 'Deadline', color: '#e74c3c', icon: '⏰' },
    'milestone': { label: 'Milestone', color: '#9b59b6', icon: '🎯' },
    'review': { label: 'Review', color: '#34495e', icon: '👁️' },
    'planning': { label: 'Planning', color: '#1abc9c', icon: '📋' },
    'personal': { label: 'Personal', color: '#95a5a6', icon: '👤' },
    'discovery_call': { label: 'Discovery Call', color: '#3498db', icon: '🔍' },
    'consultation': { label: 'Consultation', color: '#8e44ad', icon: '💬' },
    'other': { label: 'Other', color: '#7f8c8d', icon: '📝' }
};

// Task type configuration
export const taskTypeConfig: Record<TaskType, { label: string; color: string; icon: string }> = {
    'production': { label: 'Production', color: '#ff6b6b', icon: '🎬' },
    'post_production': { label: 'Post Production', color: '#f39c12', icon: '🎞️' },
    'client_work': { label: 'Client Work', color: '#2ecc71', icon: '🤝' },
    'admin': { label: 'Admin', color: '#95a5a6', icon: '📄' },
    'creative': { label: 'Creative', color: '#9b59b6', icon: '🎨' },
    'technical': { label: 'Technical', color: '#34495e', icon: '⚙️' },
    'review': { label: 'Review', color: '#1abc9c', icon: '👁️' },
    'planning': { label: 'Planning', color: '#4A90E2', icon: '📋' },
    'other': { label: 'Other', color: '#7f8c8d', icon: '📝' }
};

// Priority configuration
export const priorityConfig: Record<Priority, { label: string; color: string; icon: string }> = {
    'low': { label: 'Low', color: '#95a5a6', icon: '🔵' },
    'medium': { label: 'Medium', color: '#f39c12', icon: '🟡' },
    'high': { label: 'High', color: '#e67e22', icon: '🟠' },
    'urgent': { label: 'Urgent', color: '#e74c3c', icon: '🔴' }
};

// Temporary empty arrays to replace mock data (should be replaced with real API calls)
export const mockTasks: CalendarTask[] = [];
export const mockUsers: User[] = [];
export const mockProjects: Project[] = [];

// Simple event color helper function
export const getEventColor = (eventType: EventType): string => {
    return eventTypeConfig[eventType]?.color || '#4A90E2';
};

// Simple task color helper function  
export const getTaskColor = (taskType: TaskType): string => {
    return taskTypeConfig[taskType]?.color || '#4A90E2';
};

// Simple priority color helper function
export const getPriorityColor = (priority: Priority): string => {
    return priorityConfig[priority]?.color || '#95a5a6';
};
