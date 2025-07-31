# Calendar Management System

A comprehensive, responsive calendar application built with React, Material-UI, and TypeScript for managing events and tasks in the ProjectFlo studio management system.

## Features

### 📅 Multiple View Types
- **Month View**: Traditional calendar grid with events and tasks displayed as chips
- **Week View**: Weekly timeline with time slots and detailed event display
- **Day View**: Detailed daily schedule with time slots and task sidebar
- **Agenda View**: List-based view showing upcoming events and tasks with expandable daily sections

### 🎯 Event Management
- Create, view, and manage events with:
  - Title, description, start/end times
  - Event types (meeting, shooting, editing, client call, deadline, etc.)
  - Priority levels (low, medium, high, urgent)
  - Project associations
  - Assignee management
  - Location tracking
  - All-day event support

### ✅ Task Management
- Create, view, and manage tasks with:
  - Title, description, due dates
  - Task types (production, post-production, client work, etc.)
  - Priority levels
  - Estimated hours tracking
  - Completion status
  - Project associations
  - Assignee management

### 🔍 Advanced Filtering & Search
- Search across event and task titles, descriptions, assignees
- Filter by:
  - Projects
  - Event types
  - Task types
  - Priority levels
  - Assignees
  - Completion status
- Real-time filter application

### 📊 Analytics & Insights
- Upcoming deadlines tracking
- Overdue tasks monitoring
- Task completion rates
- Event and task statistics
- Visual priority indicators

### 🎨 User Experience
- Responsive design for desktop and mobile
- Material Design components
- Intuitive navigation and interactions
- Drag-and-drop interactions (planned)
- Real-time updates
- Accessibility support

## Project Structure

```
calendar/
├── page.tsx                 # Main calendar page component
├── types.ts                 # TypeScript type definitions
├── utils.ts                 # Utility functions for date/time operations
├── mockData.ts              # Mock data for development and testing
└── components/
    ├── index.ts             # Component exports
    ├── CalendarHeader.tsx   # Navigation and view controls
    ├── MonthView.tsx        # Month calendar grid view
    ├── WeekView.tsx         # Weekly timeline view
    ├── DayView.tsx          # Daily detailed view
    └── AgendaView.tsx       # List-based agenda view
```

## Types & Data Models

### Core Types
- `CalendarEvent`: Event data structure with scheduling and metadata
- `CalendarTask`: Task data structure with due dates and completion tracking
- `CalendarView`: View state management (type and current date)
- `CalendarFilters`: Filter state for search and filtering
- `User`: User information for assignments
- `Project`: Project data for categorization

### Event Types
- Meeting, Shooting, Editing, Client Call
- Deadline, Milestone, Review, Planning
- Personal, Other

### Task Types
- Production, Post-Production, Client Work
- Administrative, Creative, Technical
- Review, Planning, Other

### Priority Levels
- Low, Medium, High, Urgent

## Key Components

### CalendarHeader
- View type selection (Month/Week/Day/Agenda)
- Date navigation (Previous/Next/Today)
- Statistics display
- Responsive design

### MonthView
- Calendar grid with day cells
- Event and task chips
- Hover interactions
- Current day highlighting
- Cross-month navigation

### WeekView
- Time-slot based layout
- All-day events section
- Timed events display
- Click-to-create functionality

### DayView
- Detailed time slots
- Event positioning
- Tasks sidebar
- All-day events section

### AgendaView
- Upcoming deadlines overview
- Overdue tasks alerts
- Expandable daily sections
- Comprehensive item details

## Utility Functions

### Date Operations
- `formatDate()`, `formatTime()`, `formatDateTime()`
- `isToday()`, `isPast()`, `isThisWeek()`
- `addDays()`, `startOfWeek()`, `endOfWeek()`
- `getCalendarDays()`, `getWeekDays()`

### Data Filtering
- `searchEvents()`, `searchTasks()`
- `filterEventsByDate()`, `filterTasksByDate()`
- `getEventsInDateRange()`, `getTasksInDateRange()`

### Analytics
- `getUpcomingDeadlines()`, `getOverdueTasks()`
- `getCompletionRate()`, `getPriorityWeight()`
- `sortEventsByPriority()`, `sortTasksByPriority()`

## Getting Started

### Prerequisites
- React 18+
- Material-UI 5+
- TypeScript
- Next.js (for routing)

### Installation
The calendar is integrated into the ProjectFlo frontend package. No additional installation required.

### Usage
Navigate to `/manager/calendar` in the application to access the calendar management system.

## Development

### Adding New Features
1. Define types in `types.ts`
2. Add utility functions in `utils.ts`
3. Create/modify components as needed
4. Update mock data if necessary
5. Test across all view types

### Extending Event/Task Types
1. Add new types to `EventType` or `TaskType` in `types.ts`
2. Update configuration in `mockData.ts`
3. Update UI components to handle new types

### Custom Styling
The application uses Material-UI's theming system. Customize colors, spacing, and components through the theme provider.

## Future Enhancements

### Planned Features
- Drag-and-drop event/task rescheduling
- Recurring events and tasks
- Calendar sharing and collaboration
- Email reminders and notifications
- Integration with external calendar systems
- Advanced analytics and reporting
- Mobile app support
- Offline functionality

### Performance Optimizations
- Virtual scrolling for large datasets
- Lazy loading of calendar views
- Optimistic updates
- Caching strategies

## Contributing

When contributing to the calendar system:
1. Follow TypeScript best practices
2. Maintain responsive design principles
3. Add proper error handling
4. Include comprehensive type definitions
5. Test across all view types and screen sizes
6. Update documentation as needed

## Dependencies

### Core Dependencies
- `@mui/material`: UI components
- `@mui/icons-material`: Icons
- `react`: Core framework
- `typescript`: Type safety

### Utility Dependencies
- Date manipulation utilities (built-in)
- Search and filtering functions (custom)

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Accessibility

The calendar system follows WCAG 2.1 guidelines:
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support
- Focus management
- ARIA labels and descriptions

## License

Part of the ProjectFlo studio management system.
