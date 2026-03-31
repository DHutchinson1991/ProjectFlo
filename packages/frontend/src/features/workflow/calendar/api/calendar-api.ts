// Calendar API — backward-compat named exports.
// External consumers (DiscoveryCallCard, ProposalReviewCard) import individual functions from here.
// New code should import { calendarApi } from './index' instead.

export type {
    BackendCalendarEvent,
    BackendTag,
    BackendCalendarStats,
    BackendCalendarTask,
    CalendarApiQuery,
} from './index';

import { calendarApi } from './index';
import type { BackendCalendarEvent, BackendTag, CalendarApiQuery } from './index';

export function getEvents(query?: CalendarApiQuery): Promise<BackendCalendarEvent[]> {
    return calendarApi.getEvents(query);
}

export function getEventById(id: number): Promise<BackendCalendarEvent> {
    return calendarApi.getEventById(id);
}

export function createEvent(event: Partial<BackendCalendarEvent>): Promise<BackendCalendarEvent> {
    return calendarApi.createEvent(event);
}

export function updateEvent(id: number, event: Partial<BackendCalendarEvent>): Promise<BackendCalendarEvent> {
    return calendarApi.updateEvent(id, event);
}

export function deleteEvent(id: number): Promise<void> {
    return calendarApi.deleteEvent(id);
}

export function getEventsForDateRange(
    startDate: Date,
    endDate: Date,
    crewId?: number,
): Promise<BackendCalendarEvent[]> {
    return calendarApi.getEventsForDateRange(startDate, endDate, crewId);
}

export function getTodaysEvents(crewId?: number): Promise<BackendCalendarEvent[]> {
    return calendarApi.getTodaysEvents(crewId);
}

export function getUpcomingEvents(crewId?: number, limit?: number): Promise<BackendCalendarEvent[]> {
    return calendarApi.getUpcomingEvents(crewId, limit);
}

export function getTags(): ReturnType<typeof calendarApi.getTags> {
    return calendarApi.getTags();
}

export function createTag(tag: Omit<BackendTag, 'id'>): ReturnType<typeof calendarApi.createTag> {
    return calendarApi.createTag(tag);
}

export function getCalendarStats(userId?: number): ReturnType<typeof calendarApi.getCalendarStats> {
    return calendarApi.getCalendarStats(userId);
}

export function getTasksForDateRange(
    startDate: Date,
    endDate: Date,
): ReturnType<typeof calendarApi.getTasksForDateRange> {
    return calendarApi.getTasksForDateRange(startDate, endDate);
}

