// Calendar types for event and task management
export interface CalendarEvent {
    id: string;
    title: string;
    description?: string;
    start: Date;
    end: Date;
    allDay?: boolean;
    type: EventType;
    status: EventStatus;
    priority: Priority;
    assignee?: User;
    project?: Project;
    location?: string;
    attendees?: User[];
    reminders?: Reminder[];
    tags?: string[];
    color?: string;
    recurring?: RecurringPattern;
    created_at: Date;
    updated_at: Date;
}

export interface CalendarTask {
    id: string;
    title: string;
    description?: string;
    dueDate: Date;
    completed: boolean;
    type: TaskType;
    priority: Priority;
    assignee?: User;
    project?: Project;
    estimatedHours?: number;
    actualHours?: number;
    tags?: string[];
    dependencies?: string[]; // Task IDs this task depends on
    subtasks?: CalendarTask[];
    created_at: Date;
    updated_at: Date;
}

export type EventType =
    | 'meeting'
    | 'shooting'
    | 'editing'
    | 'client_call'
    | 'deadline'
    | 'milestone'
    | 'review'
    | 'planning'
    | 'personal'
    | 'discovery_call'
    | 'proposal_review'
    | 'other'
    | 'PROJECT_ASSIGNMENT'
    | 'ABSENCE'
    | 'HOLIDAY'
    | 'EXTERNAL_SYNC'
    | 'PERSONAL'
    | 'DISCOVERY_CALL'
    | 'PROPOSAL_REVIEW';

export type MeetingType =
    | 'ONLINE'
    | 'PHONE_CALL'
    | 'IN_PERSON'
    | 'VIDEO_CALL';

export type TaskType =
    | 'production'
    | 'post_production'
    | 'client_work'
    | 'admin'
    | 'creative'
    | 'technical'
    | 'review'
    | 'planning'
    | 'other';

export type EventStatus =
    | 'confirmed'
    | 'tentative'
    | 'cancelled'
    | 'completed';

export type Priority =
    | 'low'
    | 'medium'
    | 'high'
    | 'urgent';

export interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role: string;
}

export interface Project {
    id: string;
    name: string;
    color: string;
    status: 'active' | 'completed' | 'on_hold';
}

export interface Reminder {
    id: string;
    type: 'email' | 'notification' | 'sms';
    minutesBefore: number;
}

export interface RecurringPattern {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number; // Every X days/weeks/months/years
    endDate?: Date;
    occurrences?: number;
    daysOfWeek?: number[]; // 0-6, Sunday-Saturday
}

export interface CalendarView {
    type: 'month' | 'week' | 'day' | 'agenda';
    date: Date;
}

export interface CalendarFilters {
    projects: string[];
    eventTypes: EventType[];
    taskTypes: TaskType[];
    priorities: Priority[];
    assignees: string[];
    showCompleted: boolean;
    searchTerm: string;
}

export interface CalendarSettings {
    defaultView: CalendarView['type'];
    weekStartsOn: 0 | 1; // Sunday or Monday
    workingHours: {
        start: string; // HH:mm format
        end: string;
    };
    timeZone: string;
    notifications: {
        email: boolean;
        browser: boolean;
        defaultReminder: number; // minutes before
    };
}

export interface DragDropData {
    type: 'event' | 'task';
    id: string;
    date: Date;
}

export interface CalendarStats {
    totalEvents: number;
    totalTasks: number;
    completedTasks: number;
    upcomingDeadlines: number;
    overdueTasks: number;
}
