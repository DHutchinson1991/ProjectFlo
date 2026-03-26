import { CalendarEvent, CalendarTask, CalendarView, Priority } from '../types/calendar-types';
import {
    isSameDay,
    addDays,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    getCalendarDays,
} from './calendar-date-helpers';

// Event and task filtering
export const filterEventsByDate = (events: CalendarEvent[], date: Date): CalendarEvent[] => {
    return events.filter(event => {
        if (event.allDay) {
            return isSameDay(event.start, date);
        }

        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);
        const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const nextDay = new Date(targetDate);
        nextDay.setDate(nextDay.getDate() + 1);

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

        case 'month': {
            const calendarDays = getCalendarDays(date);
            return {
                start: calendarDays[0],
                end: calendarDays[calendarDays.length - 1]
            };
        }

        case 'agenda':
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

    const slotHeight = 30;

    return {
        top: startSlot * slotHeight,
        height: Math.max((endSlot - startSlot) * slotHeight, slotHeight)
    };
};

// Search utilities
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

// Statistics
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
