// Calendar API service for backend communication

export interface CalendarApiConfig {
    baseUrl: string;
    authToken?: string;
}

export interface BackendCalendarEvent {
    id: number;
    title: string;
    description?: string;
    start_time: string;
    end_time: string;
    is_all_day?: boolean;
    event_type: 'PROJECT_ASSIGNMENT' | 'ABSENCE' | 'HOLIDAY' | 'EXTERNAL_SYNC' | 'PERSONAL' | 'DISCOVERY_CALL' | 'CONSULTATION';
    meeting_type?: 'ONLINE' | 'PHONE_CALL' | 'IN_PERSON' | 'VIDEO_CALL';
    contributor_id: number;
    project_id?: number;
    inquiry_id?: number;
    location?: string;
    meeting_url?: string;
    outcome_notes?: string;
    contributor?: {
        id: number;
        contact: {
            first_name: string;
            last_name: string;
            email: string;
        };
    };
    project?: {
        id: number;
        name: string;
    };
    inquiry?: {
        id: number;
        contact: {
            first_name: string;
            last_name: string;
            email: string;
            company_name?: string;
        };
    };
    event_tags?: Array<{
        tag: {
            id: number;
            name: string;
            color: string;
            description?: string;
        };
    }>;
    event_attendees?: Array<{
        contributor: {
            id: number;
            contact: {
                first_name: string;
                last_name: string;
                email: string;
            };
        };
        status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'TENTATIVE';
    }>;
    event_reminders?: Array<{
        id: number;
        reminder_time: string;
        method: 'EMAIL' | 'NOTIFICATION' | 'SMS';
    }>;
}

export interface BackendTag {
    id: number;
    name: string;
    color: string;
    description?: string;
}

export interface BackendCalendarStats {
    total_events: number;
    project_events: number;
    personal_events: number;
    holiday_events: number;
    upcoming_events: number;
    past_events: number;
}

/** A unified task item returned by GET /calendar/tasks */
export interface BackendCalendarTask {
    id: number;
    source: 'inquiry' | 'project';
    inquiry_id: number | null;
    project_id: number | null;
    name: string;
    description: string | null;
    phase: string;
    status: string;
    due_date: string | null;
    estimated_hours: number | null;
    completed_at: string | null;
    context_label: string;
    project_name: string | null;
    assignee: { id: number; name: string; email: string } | null;
}

export interface CalendarApiQuery {
    start_date?: string;
    end_date?: string;
    contributor_id?: number;
    event_type?: string;
    limit?: number;
}

class CalendarApiService {
    private config: CalendarApiConfig;

    constructor(config: CalendarApiConfig) {
        this.config = config;
    }

    private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const url = `${this.config.baseUrl}${endpoint}`;

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(options.headers as Record<string, string>),
        };

        // Get auth token from localStorage if not provided in config
        const authToken = this.config.authToken || localStorage.getItem('authToken');
        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }

        // Get brand context from localStorage - this is crucial for multi-brand support
        const brandId = localStorage.getItem('projectflo_current_brand');
        if (brandId) {
            headers['X-Brand-Context'] = brandId;
        }

        console.log('📅 Calendar API Request:', url, 'with headers:', Object.keys(headers));

        const response = await fetch(url, {
            ...options,
            headers,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('📅 Calendar API Error Response:', response.status, errorText);
            throw new Error(`Calendar API Error: ${response.status} ${response.statusText}`);
        }

        // For DELETE requests, check if there's content to parse
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return response.json();
        } else {
            // For DELETE requests or empty responses, return empty object or null
            const text = await response.text();
            return text ? JSON.parse(text) : ({} as T);
        }
    }

    // Calendar Events
    async getEvents(query?: CalendarApiQuery): Promise<BackendCalendarEvent[]> {
        const searchParams = new URLSearchParams();

        if (query) {
            Object.entries(query).forEach(([key, value]) => {
                if (value !== undefined) {
                    searchParams.append(key, value.toString());
                }
            });
        }

        const endpoint = `/calendar/events${searchParams.toString() ? `?${searchParams}` : ''}`;
        return this.makeRequest<BackendCalendarEvent[]>(endpoint);
    }

    async getEventById(id: number): Promise<BackendCalendarEvent> {
        return this.makeRequest<BackendCalendarEvent>(`/calendar/events/${id}`);
    }

    async createEvent(event: Partial<BackendCalendarEvent>): Promise<BackendCalendarEvent> {
        return this.makeRequest<BackendCalendarEvent>('/calendar/events', {
            method: 'POST',
            body: JSON.stringify(event),
        });
    }

    async updateEvent(id: number, event: Partial<BackendCalendarEvent>): Promise<BackendCalendarEvent> {
        return this.makeRequest<BackendCalendarEvent>(`/calendar/events/${id}`, {
            method: 'PUT',
            body: JSON.stringify(event),
        });
    }

    async deleteEvent(id: number): Promise<void> {
        return this.makeRequest<void>(`/calendar/events/${id}`, {
            method: 'DELETE',
        });
    }

    // Utility endpoints
    async getEventsForDateRange(startDate: Date, endDate: Date, contributorId?: number): Promise<BackendCalendarEvent[]> {
        // Format dates as YYYY-MM-DD for backend
        const formatDate = (date: Date): string => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        const query: CalendarApiQuery = {
            start_date: formatDate(startDate),
            end_date: formatDate(endDate),
        };

        if (contributorId) {
            query.contributor_id = contributorId;
        }

        const queryParams = new URLSearchParams(query as Record<string, string>).toString();
        // Use the main events endpoint with query parameters instead of the date-range specific endpoint
        return this.makeRequest<BackendCalendarEvent[]>(`/calendar/events?${queryParams}`);
    }

    async getTodaysEvents(contributorId?: number): Promise<BackendCalendarEvent[]> {
        const searchParams = new URLSearchParams();
        if (contributorId) {
            searchParams.append('contributor_id', contributorId.toString());
        }

        const endpoint = `/calendar/events/today${searchParams.toString() ? `?${searchParams}` : ''}`;
        return this.makeRequest<BackendCalendarEvent[]>(endpoint);
    }

    async getUpcomingEvents(contributorId?: number, limit?: number): Promise<BackendCalendarEvent[]> {
        const searchParams = new URLSearchParams();
        if (contributorId) {
            searchParams.append('contributor_id', contributorId.toString());
        }
        if (limit) {
            searchParams.append('limit', limit.toString());
        }

        const endpoint = `/calendar/events/upcoming${searchParams.toString() ? `?${searchParams}` : ''}`;
        return this.makeRequest<BackendCalendarEvent[]>(endpoint);
    }

    // Tags
    async getTags(): Promise<BackendTag[]> {
        return this.makeRequest<BackendTag[]>('/calendar/tags');
    }

    async createTag(tag: Omit<BackendTag, 'id'>): Promise<BackendTag> {
        return this.makeRequest<BackendTag>('/calendar/tags', {
            method: 'POST',
            body: JSON.stringify(tag),
        });
    }

    // Statistics
    async getCalendarStats(userId?: number): Promise<BackendCalendarStats> {
        const searchParams = new URLSearchParams();
        if (userId) {
            searchParams.append('user_id', userId.toString());
        }

        const endpoint = `/calendar/stats${searchParams.toString() ? `?${searchParams}` : ''}`;
        return this.makeRequest<BackendCalendarStats>(endpoint);
    }

    // Tasks (inquiry_tasks + project_tasks with due dates)
    async getTasksForDateRange(startDate: Date, endDate: Date): Promise<BackendCalendarTask[]> {
        const formatDate = (date: Date): string => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        const params = new URLSearchParams({
            start_date: formatDate(startDate),
            end_date: formatDate(endDate),
        });

        return this.makeRequest<BackendCalendarTask[]>(`/calendar/tasks?${params}`);
    }
}

// Create singleton instance
let calendarApiInstance: CalendarApiService | null = null;

export function createCalendarApi(config: CalendarApiConfig): CalendarApiService {
    calendarApiInstance = new CalendarApiService(config);
    return calendarApiInstance;
}

export function getCalendarApi(): CalendarApiService {
    if (!calendarApiInstance) {
        // Default configuration - you can override this
        calendarApiInstance = new CalendarApiService({
            baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002',
        });
    }
    return calendarApiInstance;
}

export { CalendarApiService };
