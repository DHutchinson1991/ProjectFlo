// Date utility functions for calendar operations

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
    const startOfWeekDate = new Date(now);
    startOfWeekDate.setDate(now.getDate() - now.getDay());
    startOfWeekDate.setHours(0, 0, 0, 0);

    const endOfWeekDate = new Date(startOfWeekDate);
    endOfWeekDate.setDate(startOfWeekDate.getDate() + 6);
    endOfWeekDate.setHours(23, 59, 59, 999);

    return date >= startOfWeekDate && date <= endOfWeekDate;
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
    const monthStartDate = startOfMonth(date);
    const monthEndDate = endOfMonth(date);
    const calendarStart = startOfWeek(monthStartDate, weekStartsOn);
    const calendarEnd = endOfWeek(monthEndDate, weekStartsOn);

    const days: Date[] = [];
    let current = new Date(calendarStart);

    while (current <= calendarEnd) {
        days.push(new Date(current));
        current = addDays(current, 1);
    }

    return days;
};

export const generateTimeSlots = (startHour: number = 0, endHour: number = 24): string[] => {
    const slots: string[] = [];

    for (let hour = startHour; hour < endHour; hour++) {
        slots.push(`${hour.toString().padStart(2, '0')}:00`);
        slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }

    return slots;
};
