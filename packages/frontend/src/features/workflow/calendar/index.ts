// Calendar feature barrel export
// Types
export type {
    CalendarEvent,
    CalendarTask,
    EventType,
    MeetingType,
    TaskType,
    EventStatus,
    Priority,
    User,
    Project,
    Reminder,
    RecurringPattern,
    CalendarView,
    CalendarFilters,
    CalendarSettings,
    DragDropData,
    CalendarStats,
} from './types/calendar-types';
export type {
    BackendCalendarEvent,
    BackendTag,
    BackendCalendarStats,
    BackendCalendarTask,
    CalendarApiQuery,
    BackendContributor,
    CalendarEventUpsertRequest,
} from './types/calendar-api.types';

// API
export {
    getEvents,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent,
    getEventsForDateRange,
    getTodaysEvents,
    getUpcomingEvents,
    getTags,
    createTag,
    getCalendarStats,
    getTasksForDateRange,
} from './api/calendar-api';

// Constants
export {
    eventTypeConfig,
    taskTypeConfig,
    priorityConfig,
    getEventColor,
    getTaskColor,
    getPriorityColor,
} from './constants/calendar-config';

// Hooks
export {
    useCalendarEvents,
    useCalendarStats,
    useTodaysEvents,
    useUpcomingEvents,
    useCalendarTags,
    useCalendarTasks,
    useFilteredEvents,
} from './hooks/use-calendar';
export { useCrewMembers } from './hooks/use-contributors';
export type { CrewMemberOption } from './hooks/use-contributors';

// Mappers
export {
    transformBackendEvent,
    transformBackendEvents,
    transformToBackendEvent,
    formatDateForApi,
    formatDateTimeForApi,
    getDateRangeForView,
} from './mappers/calendar-event-mapper';
export { transformBackendTasks } from './mappers/calendar-task-mapper';

// Screens
export { CalendarScreen } from './screens';

// Utils
export {
    formatDate,
    formatTime,
    formatDateTime,
    isSameDay,
    isToday,
    isPast,
    isThisWeek,
    addDays,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    getDaysInMonth,
    getWeekDays,
    getCalendarDays,
    generateTimeSlots,
} from './utils/calendar-date-helpers';
export {
    filterEventsByDate,
    filterTasksByDate,
    getEventsInDateRange,
    getTasksInDateRange,
    getPriorityWeight,
    sortEventsByPriority,
    sortTasksByPriority,
    getViewDateRange,
    getEventPosition,
    searchEvents,
    searchTasks,
    getUpcomingDeadlines,
    getOverdueTasks,
    getCompletionRate,
} from './utils/calendar-event-helpers';
