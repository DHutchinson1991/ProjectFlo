// Data transformation utilities for mapping backend data to frontend types
import { CalendarEvent, CalendarTask, EventType, EventStatus, Priority, TaskType, User } from '../types';
import { BackendCalendarEvent, BackendCalendarTask } from './calendarApi';

// Date range calculation for different view types
export function getDateRangeForView(viewDate: Date, viewType: 'month' | 'week' | 'day'): { start: Date; end: Date } {
    const start = new Date(viewDate);
    const end = new Date(viewDate);

    switch (viewType) {
        case 'day':
            // Same day
            end.setHours(23, 59, 59, 999);
            start.setHours(0, 0, 0, 0);
            break;

        case 'week':
            // Start of week (Sunday) to end of week (Saturday)
            const dayOfWeek = start.getDay();
            start.setDate(start.getDate() - dayOfWeek);
            start.setHours(0, 0, 0, 0);

            end.setDate(start.getDate() + 6);
            end.setHours(23, 59, 59, 999);
            break;

        case 'month':
            // First day of month to last day of month
            start.setDate(1);
            start.setHours(0, 0, 0, 0);

            end.setMonth(end.getMonth() + 1);
            end.setDate(0); // Last day of current month
            end.setHours(23, 59, 59, 999);
            break;
    }

    return { start, end };
}

// Map backend event types to frontend event types
const eventTypeMap: Record<string, EventType> = {
    'PROJECT_ASSIGNMENT': 'meeting', // Default to 'meeting' instead of 'planning'
    'PERSONAL': 'personal',
    'HOLIDAY': 'personal',
    'ABSENCE': 'personal',
    'EXTERNAL_SYNC': 'meeting'
};

// Map backend tag names to frontend event types for better categorization
const tagToEventTypeMap: Record<string, EventType> = {
    'Meeting': 'meeting',
    'Shoot': 'shooting',
    'Travel': 'other',
    'Work': 'planning',
    'Editing': 'editing',
    'Client': 'client_call'
};

// Priority mapping based on event type and tags
function determinePriority(backendEvent: BackendCalendarEvent): Priority {
    const tags = backendEvent.event_tags?.map(et => et.tag.name.toLowerCase()) || [];

    // High priority for client meetings and shoots
    if (tags.includes('client') || tags.includes('shoot')) {
        return 'high';
    }

    // Medium priority for meetings and work
    if (tags.includes('meeting') || tags.includes('work')) {
        return 'medium';
    }

    // Low priority for travel and editing
    return 'low';
}

// Status mapping - for now, we'll use 'confirmed' for all events
function determineStatus(): EventStatus {
    // You could enhance this based on attendee responses
    return 'confirmed';
}

// Transform backend contributor to frontend user
function transformContributor(contributor?: BackendCalendarEvent['contributor']): User | undefined {
    if (!contributor?.contact) {
        return undefined;
    }

    const { contact } = contributor;
    return {
        id: contributor.id.toString(),
        name: `${contact.first_name} ${contact.last_name}`.trim(),
        email: contact.email,
        avatar: `/avatars/${contact.first_name.toLowerCase()}.jpg`, // Default avatar path
        role: 'Contributor' // Default role
    };
}

// Transform backend attendees to frontend users
function transformAttendees(attendees?: BackendCalendarEvent['event_attendees']): User[] {
    if (!attendees) {
        return [];
    }

    return attendees
        .filter(attendee => attendee.contributor?.contact)
        .map(attendee => transformContributor(attendee.contributor))
        .filter(Boolean) as User[];
}

// Get primary color from tags
function getEventColor(backendEvent: BackendCalendarEvent): string {
    const primaryTag = backendEvent.event_tags?.[0]?.tag;
    return primaryTag?.color || '#1976d2'; // Default blue color
}

// Transform backend event to frontend event
export function transformBackendEvent(backendEvent: BackendCalendarEvent): CalendarEvent {
    console.log('🔄 transformBackendEvent input:', backendEvent);

    const primaryTag = backendEvent.event_tags?.[0]?.tag;

    // Extract metadata from description if present
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
                console.log('🔍 Extracted metadata:', { extractedType, extractedPriority });
            } catch (e) {
                console.warn('Failed to parse event metadata:', e);
            }
        }
    }

    // Use extracted type if available, otherwise fall back to tag/type mapping
    const eventType = extractedType ||
        (primaryTag ? (tagToEventTypeMap[primaryTag.name] || eventTypeMap[backendEvent.event_type]) : eventTypeMap[backendEvent.event_type]);

    const result = {
        id: backendEvent.id.toString(),
        title: backendEvent.title,
        description: cleanDescription,
        start: new Date(backendEvent.start_time),
        end: new Date(backendEvent.end_time),
        allDay: backendEvent.is_all_day || false,
        type: eventType || 'meeting',
        status: determineStatus(),
        priority: extractedPriority || determinePriority(backendEvent),
        assignee: transformContributor(backendEvent.contributor),
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
        created_at: new Date(), // Backend doesn't return this, using current time
        updated_at: new Date()  // Backend doesn't return this, using current time
    };

    console.log('🔄 transformBackendEvent output:', result);
    return result;
}

// Transform multiple backend events
export function transformBackendEvents(backendEvents: BackendCalendarEvent[]): CalendarEvent[] {
    return backendEvents.map(transformBackendEvent);
}

// Transform frontend event to backend format for API calls
export function transformToBackendEvent(frontendEvent: Partial<CalendarEvent>): Partial<BackendCalendarEvent> {
    console.log('🔄 transformToBackendEvent input:', frontendEvent);

    const backendEvent: Partial<BackendCalendarEvent> = {};

    if (frontendEvent.title) {
        backendEvent.title = frontendEvent.title;
    }

    if (frontendEvent.description) {
        // Encode event type and priority in description for preservation
        const metadata = {
            type: frontendEvent.type,
            priority: frontendEvent.priority
        };
        backendEvent.description = frontendEvent.description + '\n__METADATA__:' + JSON.stringify(metadata);
    } else if (frontendEvent.type || frontendEvent.priority) {
        // Create description with just metadata if no description provided
        const metadata = {
            type: frontendEvent.type,
            priority: frontendEvent.priority
        };
        backendEvent.description = '__METADATA__:' + JSON.stringify(metadata);
    }

    if (frontendEvent.start) {
        backendEvent.start_time = frontendEvent.start.toISOString();
    }

    if (frontendEvent.end) {
        backendEvent.end_time = frontendEvent.end.toISOString();
    }

    if (frontendEvent.allDay !== undefined) {
        backendEvent.is_all_day = frontendEvent.allDay;
    }

    if (frontendEvent.location) {
        backendEvent.location = frontendEvent.location;
    }

    // Map frontend event type back to backend type
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

    // Set contributor_id if assignee is provided
    if (frontendEvent.assignee?.id) {
        backendEvent.contributor_id = parseInt(frontendEvent.assignee.id);
    }

    // Set project_id if project is provided  
    if (frontendEvent.project?.id) {
        backendEvent.project_id = parseInt(frontendEvent.project.id);
    }

    console.log('🔄 transformToBackendEvent output:', backendEvent);
    return backendEvent;
}

// Helper function to format date for API calls
export function formatDateForApi(date: Date): string {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
}

// Helper function to format datetime for API calls
export function formatDateTimeForApi(date: Date): string {
    return date.toISOString();
}

// ─── Task transforms ─────────────────────────────────────────────────

const phaseToTaskType: Record<string, TaskType> = {
    Inquiry: 'client_work',
    Booking: 'admin',
    Production: 'production',
    Post_Production: 'post_production',
    Delivery: 'review',
};

/** Transform backend tasks (inquiry + project) into frontend CalendarTask[] */
export function transformBackendTasks(backendTasks: BackendCalendarTask[]): CalendarTask[] {
    return backendTasks
        .filter(t => t.due_date) // only tasks with a due date make sense on the calendar
        .map(t => {
            const isCompleted = t.status === 'Completed';
            // Parse as local date to avoid timezone shift (UTC midnight → wrong local day)
            const [y, m, d] = t.due_date!.split('T')[0].split('-').map(Number);
            const dueDate = new Date(y, m - 1, d);
            const now = new Date();
            const isOverdue = !isCompleted && dueDate < now;

            return {
                id: `${t.source}-task-${t.id}`,
                title: t.name,
                description: t.context_label
                    ? `${t.context_label} · ${t.phase}`
                    : t.description ?? undefined,
                dueDate,
                completed: isCompleted,
                type: phaseToTaskType[t.phase] ?? 'other',
                priority: isOverdue ? 'high' : 'medium',
                assignee: t.assignee
                    ? { id: t.assignee.id.toString(), name: t.assignee.name, email: t.assignee.email, role: 'Contributor' }
                    : undefined,
                project: t.project_name
                    ? { id: (t.project_id ?? 0).toString(), name: t.project_name, color: '#6366f1', status: 'active' as const }
                    : undefined,
                estimatedHours: t.estimated_hours ?? undefined,
                tags: [t.source, t.phase],
                created_at: new Date(),
                updated_at: new Date(),
            };
        });
}
