"use client";

import { useState, useCallback } from 'react';
import type { CalendarView } from '@/features/workflow/calendar/types/calendar-types';

export function useCalendarViewState() {
    const [currentView, setCurrentView] = useState<CalendarView>({ type: 'month', date: new Date() });
    const [refreshKey, setRefreshKey] = useState(0);

    const handleViewChange = useCallback((v: CalendarView) => setCurrentView(v), []);
    const handleTodayClick = useCallback(
        () => setCurrentView(prev => ({ ...prev, date: new Date() })),
        [],
    );
    const handleDateClick = useCallback((date: Date) => setCurrentView({ type: 'day', date }), []);
    const bumpRefreshKey = useCallback(() => setRefreshKey(prev => prev + 1), []);

    return { currentView, refreshKey, handleViewChange, handleTodayClick, handleDateClick, bumpRefreshKey };
}
