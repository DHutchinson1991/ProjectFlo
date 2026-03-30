// Transform backend calendar events ↔ frontend CalendarEvent format
import { CalendarEvent, EventType, EventStatus, Priority, User } from '../types/calendar-types';
import type { BackendCalendarEvent } from '../types/calendar-api.types';

// Map backend event types to frontend event types
const eventTypeMap: Record<string, EventType> = {
    'PROJECT_ASSIGNMENT': 'meeting',
    'PERSONAL': 'personal',
    'HOLIDAY': 'personal',
    'ABSENCE': 'personal',
    'EXTERNAL_SYNC': 'meeting'
};

const tagToEventTypeMap: Record<string, EventType> = {
    'Meeting': 'meeting',
    'Shoot': 'shooting',
    'Travel': 'other',
    'Work': 'planning',
    'Editing': 'editing',
    'Client': 'client_call'
};

function determinePriority(backendEvent: BackendCalendarEvent): Priority {
    const tags = backendEvent.event_tags?.map(et => et.tag.name.toLowerCase()) || [];

    if (tags.includes('client') || tags.includes('shoot')) return 'high';
    if (tags.includes('meeting') || tags.includes('work')) return 'medium';
    return 'low';
}

function determineStatus(): EventStatus {
    return 'confirmed';
}

function transformCrew(crew?: BackendCalendarEvent['crew']): User | undefined {
    if (!crew?.contact) return undefined;

    const { contact } = crew;
    return {
        id: crew.id.toString(),
        name: `${contact.first_name} ${contact.last_name}`.trim(),
        email: contact.email,
        avatar: `/avatars/${contact.first_name.toLowerCase()}.jpg`,
        role: 'Crew'
    };
}

function transformAttendees(attendees?: BackendCalendarEvent['event_attendees']): User[] {
    if (!attendees) return [];
    return attendees
        .filter(attendee => attendee.crew?.contact)
        .map(attendee => transformCrew(attendee.crew))
        .filter(Boolean) as User[];
}

function getEventColor(backendEvent: BackendCalendarEvent): string {
    const primaryTag = backendEvent.event_tags?.[0]?.tag;
    return primaryTag?.color || '#1976d2';
}

export function transformBackendEvent(backendEvent: BackendCalendarEvent): CalendarEvent {
    const primaryTag = backendEvent.event_tags?.[0]?.tag;

    let extractedType: EventType | undefined;
    let extractedPriority: Priority | undefined;
    let cleanDescription = backendEvent.description;

    if (backendEvent.description) {
        const metadataMatch = backendEvent.description.match(/__METADATA__:(.+)$/);
        if (metadataMatch) {
            try {
                const metadata = JSON.parse(metadataMatch[1]);
                extractedType = metadata.type;
                extractedPriority = metadata.priority;
                cleanDescription = backendEvent.description.replace(/\n?__METADATA__:.+$/, '');
                if (cleanDescription === '') cleanDescription = undefined;
            } catch {
                // Failed to parse event metadata
            }
        }
    }

    const eventType = extractedType ||
        (primaryTag ? (tagToEventTypeMap[primaryTag.name] || eventTypeMap[backendEvent.event_type]) : eventTypeMap[backendEvent.event_type]);

    return {
        id: backendEvent.id.toString(),
        title: backendEvent.title,
        description: cleanDescription,
        start: new Date(backendEvent.start_time),
        end: new Date(backendEvent.end_time),
        allDay: backendEvent.is_all_day || false,
        type: eventType || 'meeting',
        status: determineStatus(),
        priority: extractedPriority || determinePriority(backendEvent),
        assignee: transformCrew(backendEvent.crew),
        project: backendEvent.project ? {
            id: backendEvent.project.id.toString(),
            name: backendEvent.project.name,
            color: getEventColor(backendEvent),
            status: 'active' as const
        } : undefined,
        location: backendEvent.location,
        attendees: transformAttendees(backendEvent.event_attendees),
        reminders: backendEvent.event_reminders?.map(reminder => {
            const reminderTime = new Date(reminder.reminder_time);
            const eventTime = new Date(backendEvent.start_time);
            const minutesBefore = Math.floor((eventTime.getTime() - reminderTime.getTime()) / (1000 * 60));

            return {
                id: reminder.id.toString(),
                type: reminder.method.toLowerCase() as 'email' | 'notification' | 'sms',
                minutesBefore: Math.max(0, minutesBefore)
            };
        }),
        tags: backendEvent.event_tags?.map(et => et.tag.name) || [],
        color: getEventColor(backendEvent),
        created_at: new Date(),
        updated_at: new Date()
    };
}

export function transformBackendEvents(backendEvents: BackendCalendarEvent[]): CalendarEvent[] {
    return backendEvents.map(transformBackendEvent);
}

export function transformToBackendEvent(frontendEvent: Partial<CalendarEvent>): Partial<BackendCalendarEvent> {
    const backendEvent: Partial<BackendCalendarEvent> = {};

    if (frontendEvent.title) {
        backendEvent.title = frontendEvent.title;
    }

    if (frontendEvent.description) {
        const metadata = { type: frontendEvent.type, priority: frontendEvent.priority };
        backendEvent.description = frontendEvent.description + '\n__METADATA__:' + JSON.stringify(metadata);
    } else if (frontendEvent.type || frontendEvent.priority) {
        const metadata = { type: frontendEvent.type, priority: frontendEvent.priority };
        backendEvent.description = '__METADATA__:' + JSON.stringify(metadata);
    }

    if (frontendEvent.start) backendEvent.start_time = frontendEvent.start.toISOString();
    if (frontendEvent.end) backendEvent.end_time = frontendEvent.end.toISOString();
    if (frontendEvent.allDay !== undefined) backendEvent.is_all_day = frontendEvent.allDay;
    if (frontendEvent.location) backendEvent.location = frontendEvent.location;

    if (frontendEvent.type) {
        const reverseEventTypeMap: Record<string, 'PROJECT_ASSIGNMENT' | 'PERSONAL' | 'HOLIDAY' | 'ABSENCE' | 'EXTERNAL_SYNC'> = {
            'planning': 'PROJECT_ASSIGNMENT',
            'personal': 'PERSONAL',
            'meeting': 'PROJECT_ASSIGNMENT',
            'shooting': 'PROJECT_ASSIGNMENT',
            'editing': 'PROJECT_ASSIGNMENT',
            'client_call': 'PROJECT_ASSIGNMENT',
            'deadline': 'PROJECT_ASSIGNMENT',
            'milestone': 'PROJECT_ASSIGNMENT',
            'review': 'PROJECT_ASSIGNMENT',
            'other': 'PROJECT_ASSIGNMENT'
        };
        backendEvent.event_type = reverseEventTypeMap[frontendEvent.type] || 'PROJECT_ASSIGNMENT';
    }

    if (frontendEvent.assignee?.id) backendEvent.crew_id = parseInt(frontendEvent.assignee.id);
    if (frontendEvent.project?.id) backendEvent.project_id = parseInt(frontendEvent.project.id);

    return backendEvent;
}

export function formatDateForApi(date: Date): string {
    return date.toISOString().split('T')[0];
}

export function formatDateTimeForApi(date: Date): string {
    return date.toISOString();
}

// Date range calculation for different view types
export function getDateRangeForView(viewDate: Date, viewType: 'month' | 'week' | 'day'): { start: Date; end: Date } {
    const start = new Date(viewDate);
    const end = new Date(viewDate);

    switch (viewType) {
        case 'day':
            end.setHours(23, 59, 59, 999);
            start.setHours(0, 0, 0, 0);
            break;

        case 'week': {
            const dayOfWeek = start.getDay();
            start.setDate(start.getDate() - dayOfWeek);
            start.setHours(0, 0, 0, 0);
            end.setDate(start.getDate() + 6);
            end.setHours(23, 59, 59, 999);
            break;
        }

        case 'month':
            start.setDate(1);
            start.setHours(0, 0, 0, 0);
            end.setMonth(end.getMonth() + 1);
            end.setDate(0);
            end.setHours(23, 59, 59, 999);
            break;
    }

    return { start, end };
}
