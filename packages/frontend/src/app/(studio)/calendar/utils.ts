// Utility functions for calendar operations
import { CalendarEvent, CalendarTask, CalendarView, Priority } from './types';

// Date utility functions
export const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

export const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
};

export const formatDateTime = (date: Date): string => {
    return `${formatDate(date)} at ${formatTime(date)}`;
};

export const isSameDay = (date1: Date, date2: Date): boolean => {
    return (
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate()
    );
};

export const isToday = (date: Date): boolean => {
    return isSameDay(date, new Date());
};

export const isPast = (date: Date): boolean => {
    const now = new Date();
    return date.getTime() < now.getTime();
};

export const isThisWeek = (date: Date): boolean => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return date >= startOfWeek && date <= endOfWeek;
};

export const addDays = (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

export const startOfWeek = (date: Date, weekStartsOn: 0 | 1 = 0): Date => {
    const result = new Date(date);
    const day = result.getDay();
    const diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn;
    result.setDate(result.getDate() - diff);
    result.setHours(0, 0, 0, 0);
    return result;
};

export const endOfWeek = (date: Date, weekStartsOn: 0 | 1 = 0): Date => {
    const result = startOfWeek(date, weekStartsOn);
    result.setDate(result.getDate() + 6);
    result.setHours(23, 59, 59, 999);
    return result;
};

export const startOfMonth = (date: Date): Date => {
    const result = new Date(date);
    result.setDate(1);
    result.setHours(0, 0, 0, 0);
    return result;
};

export const endOfMonth = (date: Date): Date => {
    const result = new Date(date);
    result.setMonth(result.getMonth() + 1, 0);
    result.setHours(23, 59, 59, 999);
    return result;
};

export const getDaysInMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
};

export const getWeekDays = (date: Date, weekStartsOn: 0 | 1 = 0): Date[] => {
    const start = startOfWeek(date, weekStartsOn);
    const days: Date[] = [];

    for (let i = 0; i < 7; i++) {
        days.push(addDays(start, i));
    }

    return days;
};

export const getCalendarDays = (date: Date, weekStartsOn: 0 | 1 = 0): Date[] => {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    const calendarStart = startOfWeek(monthStart, weekStartsOn);
    const calendarEnd = endOfWeek(monthEnd, weekStartsOn);

    const days: Date[] = [];
    let current = new Date(calendarStart);

    while (current <= calendarEnd) {
        days.push(new Date(current));
        current = addDays(current, 1);
    }

    return days;
};

// Event and task filtering
export const filterEventsByDate = (events: CalendarEvent[], date: Date): CalendarEvent[] => {
    return events.filter(event => {
        if (event.allDay) {
            return isSameDay(event.start, date);
        }

        // For non-all-day events, check if the event spans this date
        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);

        // Get start of day for the target date
        const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const nextDay = new Date(targetDate);
        nextDay.setDate(nextDay.getDate() + 1);

        // Event is on this day if:
        // 1. Event starts on this day, OR
        // 2. Event started before this day and ends on or after this day
        return (eventStart >= targetDate && eventStart < nextDay) ||
            (eventStart < targetDate && eventEnd >= targetDate);
    });
};

export const filterTasksByDate = (tasks: CalendarTask[], date: Date): CalendarTask[] => {
    return tasks.filter(task => isSameDay(task.dueDate, date));
};

export const getEventsInDateRange = (
    events: CalendarEvent[],
    startDate: Date,
    endDate: Date
): CalendarEvent[] => {
    return events.filter(event => {
        return (
            (event.start >= startDate && event.start <= endDate) ||
            (event.end >= startDate && event.end <= endDate) ||
            (event.start <= startDate && event.end >= endDate)
        );
    });
};

export const getTasksInDateRange = (
    tasks: CalendarTask[],
    startDate: Date,
    endDate: Date
): CalendarTask[] => {
    return tasks.filter(task =>
        task.dueDate >= startDate && task.dueDate <= endDate
    );
};

// Priority and sorting utilities
export const getPriorityWeight = (priority: Priority): number => {
    const weights = { low: 1, medium: 2, high: 3, urgent: 4 };
    return weights[priority];
};

export const sortEventsByPriority = (events: CalendarEvent[]): CalendarEvent[] => {
    return [...events].sort((a, b) => {
        const priorityDiff = getPriorityWeight(b.priority) - getPriorityWeight(a.priority);
        if (priorityDiff !== 0) return priorityDiff;
        return a.start.getTime() - b.start.getTime();
    });
};

export const sortTasksByPriority = (tasks: CalendarTask[]): CalendarTask[] => {
    return [...tasks].sort((a, b) => {
        // Completed tasks go to bottom
        if (a.completed !== b.completed) {
            return a.completed ? 1 : -1;
        }

        const priorityDiff = getPriorityWeight(b.priority) - getPriorityWeight(a.priority);
        if (priorityDiff !== 0) return priorityDiff;
        return a.dueDate.getTime() - b.dueDate.getTime();
    });
};

// Calendar view utilities
export const getViewDateRange = (view: CalendarView): { start: Date; end: Date } => {
    const { type, date } = view;

    switch (type) {
        case 'day':
            return {
                start: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0),
                end: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59)
            };

        case 'week':
            return {
                start: startOfWeek(date),
                end: endOfWeek(date)
            };

        case 'month':
            const calendarDays = getCalendarDays(date);
            return {
                start: calendarDays[0],
                end: calendarDays[calendarDays.length - 1]
            };

        case 'agenda':
            // Show next 30 days for agenda view
            return {
                start: new Date(),
                end: addDays(new Date(), 30)
            };

        default:
            return {
                start: startOfMonth(date),
                end: endOfMonth(date)
            };
    }
};

// Time slot utilities for day/week views
export const generateTimeSlots = (startHour: number = 0, endHour: number = 24): string[] => {
    const slots: string[] = [];

    for (let hour = startHour; hour < endHour; hour++) {
        slots.push(`${hour.toString().padStart(2, '0')}:00`);
        slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }

    return slots;
};

export const getEventPosition = (event: CalendarEvent): {
    top: number;
    height: number;
} => {
    const startHour = event.start.getHours();
    const startMinute = event.start.getMinutes();
    const endHour = event.end.getHours();
    const endMinute = event.end.getMinutes();

    const startSlot = startHour * 2 + (startMinute >= 30 ? 1 : 0);
    const endSlot = endHour * 2 + (endMinute > 30 ? 1 : endMinute > 0 ? 1 : 0);

    const slotHeight = 30; // pixels per 30-minute slot

    return {
        top: startSlot * slotHeight,
        height: Math.max((endSlot - startSlot) * slotHeight, slotHeight)
    };
};

// Search and filter utilities
export const searchEvents = (events: CalendarEvent[], searchTerm: string): CalendarEvent[] => {
    if (!searchTerm.trim()) return events;

    const term = searchTerm.toLowerCase();
    return events.filter(event =>
        event.title.toLowerCase().includes(term) ||
        event.description?.toLowerCase().includes(term) ||
        event.assignee?.name.toLowerCase().includes(term) ||
        event.project?.name.toLowerCase().includes(term) ||
        event.tags?.some(tag => tag.toLowerCase().includes(term))
    );
};

export const searchTasks = (tasks: CalendarTask[], searchTerm: string): CalendarTask[] => {
    if (!searchTerm.trim()) return tasks;

    const term = searchTerm.toLowerCase();
    return tasks.filter(task =>
        task.title.toLowerCase().includes(term) ||
        task.description?.toLowerCase().includes(term) ||
        task.assignee?.name.toLowerCase().includes(term) ||
        task.project?.name.toLowerCase().includes(term) ||
        task.tags?.some(tag => tag.toLowerCase().includes(term))
    );
};

// Statistics and analytics
export const getUpcomingDeadlines = (
    events: CalendarEvent[],
    tasks: CalendarTask[],
    days: number = 7
): Array<CalendarEvent | CalendarTask> => {
    const now = new Date();
    const endDate = addDays(now, days);

    const upcomingEvents = events.filter(event =>
        event.type === 'deadline' &&
        event.start >= now &&
        event.start <= endDate
    );

    const upcomingTasks = tasks.filter(task =>
        !task.completed &&
        task.dueDate >= now &&
        task.dueDate <= endDate
    );

    return [...upcomingEvents, ...upcomingTasks].sort((a, b) => {
        const aDate = 'start' in a ? a.start : a.dueDate;
        const bDate = 'start' in b ? b.start : b.dueDate;
        return aDate.getTime() - bDate.getTime();
    });
};

export const getOverdueTasks = (tasks: CalendarTask[]): CalendarTask[] => {
    const now = new Date();
    return tasks.filter(task =>
        !task.completed &&
        task.dueDate < now
    );
};

export const getCompletionRate = (tasks: CalendarTask[]): number => {
    if (tasks.length === 0) return 0;
    const completedCount = tasks.filter(task => task.completed).length;
    return Math.round((completedCount / tasks.length) * 100);
};

// Export all utilities
export const calendarUtils = {
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
    filterEventsByDate,
    filterTasksByDate,
    getEventsInDateRange,
    getTasksInDateRange,
    getPriorityWeight,
    sortEventsByPriority,
    sortTasksByPriority,
    getViewDateRange,
    generateTimeSlots,
    getEventPosition,
    searchEvents,
    searchTasks,
    getUpcomingDeadlines,
    getOverdueTasks,
    getCompletionRate
};
