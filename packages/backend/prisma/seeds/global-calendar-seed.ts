import { PrismaClient, calendar_event_type } from '@prisma/client';
import { createSeedLogger, SeedType, SeedSummary } from '../utils/seed-logger';

const prisma = new PrismaClient();
const logger = createSeedLogger(SeedType.CALENDAR);

async function seedCalendar(): Promise<SeedSummary> {
    logger.sectionHeader('Calendar System Setup', 'STEP 6/6: Calendar');
    logger.startTimer('calendar-seed');

    try {
        // Find the global admin contributor to use for calendar events
        const globalAdmin = await prisma.contributors.findFirst({
            include: {
                contact: true
            },
            where: {
                contact: {
                    email: 'info@dhutchinson.co.uk'
                }
            }
        });

        if (!globalAdmin) {
            logger.warning('No global admin found yet, creating basic calendar setup');
            logger.processing('Creating video production tags...');

            // Create tags with duplicate checking
            const videoProductionTags = [
                { name: 'Meeting', color: '#1976d2', description: 'Client meetings, team meetings, consultations' },
                { name: 'Shoot', color: '#d32f2f', description: 'Filming sessions, photography, on-location work' },
                { name: 'Travel', color: '#7b1fa2', description: 'Location scouting, travel to shoots' },
                { name: 'Work', color: '#f57c00', description: 'General work tasks, admin, planning' },
                { name: 'Editing', color: '#388e3c', description: 'Post-production, video editing, color grading' },
                { name: 'Client', color: '#0288d1', description: 'Client-related events, deliveries, reviews' }
            ];

            let tagsCreated = 0;
            let tagsSkipped1 = 0;

            for (const tagData of videoProductionTags) {
                const existing = await prisma.tags.findUnique({ where: { name: tagData.name } });
                if (existing) {
                    tagsSkipped1++;
                    logger.skipped(`Tag "${tagData.name}"`, 'already exists', 'verbose');
                } else {
                    await prisma.tags.create({ data: tagData });
                    tagsCreated++;
                    logger.created(`Tag "${tagData.name}"`, undefined, 'verbose');
                }
            }

            logger.smartSummary('Calendar tags', tagsCreated, tagsSkipped1, videoProductionTags.length);
            logger.info('Events will be created after contributors are seeded');
            logger.success('Basic calendar system ready');
            return {
                created: tagsCreated,
                updated: 0,
                skipped: tagsSkipped1,
                total: tagsCreated + tagsSkipped1
            };
        }

        logger.success(`Using global admin (ID: ${globalAdmin.id}) for calendar events`);

        // Find all contributors for calendar events and settings
        const allContributors = await prisma.contributors.findMany({
            orderBy: { id: 'asc' }
        });

        logger.info(`Found ${allContributors.length} contributors for calendar setup`);
        if (allContributors.length < 3) {
            logger.warning('Need at least 3 contributors for full calendar demo, using available contributors');
        }

        // Create video production tags with duplicate checking
        logger.processing('Creating video production tags...');
        const videoProductionTags = [
            { name: 'Meeting', color: '#1976d2', description: 'Client meetings, team meetings, consultations' },
            { name: 'Shoot', color: '#d32f2f', description: 'Filming sessions, photography, on-location work' },
            { name: 'Travel', color: '#7b1fa2', description: 'Location scouting, travel to shoots' },
            { name: 'Work', color: '#f57c00', description: 'General work tasks, admin, planning' },
            { name: 'Editing', color: '#388e3c', description: 'Post-production, video editing, color grading' },
            { name: 'Client', color: '#0288d1', description: 'Client-related events, deliveries, reviews' }
        ];

        const createdTags: { id: number; name: string; color: string; description: string | null }[] = [];
        let tagsCreated = 0;
        let tagsSkipped2 = 0;

        for (const tagData of videoProductionTags) {
            const existing = await prisma.tags.findUnique({ where: { name: tagData.name } });
            if (existing) {
                createdTags.push(existing);
                tagsSkipped2++;
                logger.skipped(`Tag "${tagData.name}"`, 'already exists', 'verbose');
            } else {
                const tag = await prisma.tags.create({ data: tagData });
                createdTags.push(tag);
                tagsCreated++;
                logger.created(`Tag "${tagData.name}"`, undefined, 'verbose');
            }
        }

        logger.smartSummary('Calendar tags', tagsCreated, tagsSkipped2, videoProductionTags.length);

        // Create realistic calendar events for video production workflow
        logger.sectionDivider('Creating Events');
        logger.processing('Creating video production calendar events...');

        // Use available contributors for events (cycling through them if we have fewer than needed)
        const getContributorId = (index: number) => {
            if (allContributors.length === 0) return globalAdmin.id;
            return allContributors[index % allContributors.length].id;
        };

        const calendarEvents = [
            // Week 1 - Project Planning and Setup
            {
                title: 'Project Kickoff Meeting - Anderson Music Video',
                description: 'Initial client meeting to discuss vision, budget, and timeline for Anderson music video project',
                start_time: new Date('2025-07-14T10:00:00Z'),
                end_time: new Date('2025-07-14T11:30:00Z'),
                event_type: 'PROJECT_ASSIGNMENT',
                contributor_id: getContributorId(0),
                location: 'Conference Room A',
                tags: ['Meeting', 'Client']
            },
            {
                title: 'Pre-Production Planning Session',
                description: 'Team meeting to plan shoot logistics, equipment needs, and crew assignments',
                start_time: new Date('2025-07-14T14:00:00Z'),
                end_time: new Date('2025-07-14T16:00:00Z'),
                event_type: 'PROJECT_ASSIGNMENT',
                contributor_id: getContributorId(1),
                location: 'Planning Room',
                tags: ['Meeting', 'Work']
            },
            {
                title: 'Location Scout - Urban Warehouse District',
                description: 'Scout potential filming locations for Anderson music video - industrial/urban aesthetic',
                start_time: new Date('2025-07-15T09:00:00Z'),
                end_time: new Date('2025-07-15T12:00:00Z'),
                event_type: 'PROJECT_ASSIGNMENT',
                contributor_id: getContributorId(2),
                location: 'Downtown Warehouse District',
                tags: ['Travel', 'Work']
            },
            {
                title: 'Equipment Prep and Testing',
                description: 'Prepare and test all camera equipment, lighting rigs, and audio gear for upcoming shoots',
                start_time: new Date('2025-07-15T13:00:00Z'),
                end_time: new Date('2025-07-15T17:00:00Z'),
                event_type: 'PROJECT_ASSIGNMENT',
                contributor_id: getContributorId(0),
                location: 'Equipment Room',
                tags: ['Work']
            },

            // Week 2 - Main Production
            {
                title: 'Wedding Shoot - Smith Family',
                description: 'Full day wedding videography - ceremony and reception coverage',
                start_time: new Date('2025-07-19T08:00:00Z'),
                end_time: new Date('2025-07-19T22:00:00Z'),
                event_type: 'PROJECT_ASSIGNMENT',
                contributor_id: getContributorId(0),
                location: 'Riverside Manor, 123 Wedding Lane',
                tags: ['Shoot']
            },
            {
                title: 'Corporate Interview Shoot - TechCorp CEO',
                description: 'Executive interview for company promotional video',
                start_time: new Date('2025-07-20T10:00:00Z'),
                end_time: new Date('2025-07-20T15:00:00Z'),
                event_type: 'PROJECT_ASSIGNMENT',
                contributor_id: getContributorId(1),
                location: 'TechCorp HQ, Downtown',
                tags: ['Shoot', 'Client']
            },
            {
                title: 'Music Video Shoot - Anderson Artist',
                description: 'Principal photography for Anderson music video at warehouse location',
                start_time: new Date('2025-07-21T09:00:00Z'),
                end_time: new Date('2025-07-21T18:00:00Z'),
                event_type: 'PROJECT_ASSIGNMENT',
                contributor_id: getContributorId(2),
                location: 'Warehouse Studio B',
                tags: ['Shoot']
            },

            // Week 3 - Post-Production
            {
                title: 'Rough Cut Review - Wedding Footage',
                description: 'Initial edit review with team, select best footage and create story structure',
                start_time: new Date('2025-07-22T10:00:00Z'),
                end_time: new Date('2025-07-22T12:00:00Z'),
                event_type: 'PROJECT_ASSIGNMENT',
                contributor_id: getContributorId(0),
                location: 'Edit Suite A',
                tags: ['Editing', 'Meeting']
            },
            {
                title: 'Color Grading Session - Corporate Video',
                description: 'Professional color correction and grading for TechCorp promotional video',
                start_time: new Date('2025-07-23T09:00:00Z'),
                end_time: new Date('2025-07-23T17:00:00Z'),
                event_type: 'PROJECT_ASSIGNMENT',
                contributor_id: getContributorId(1),
                location: 'Color Suite',
                tags: ['Editing']
            },
            {
                title: 'Music Video Edit - First Cut',
                description: 'Initial edit assembly for Anderson music video, sync to music track',
                start_time: new Date('2025-07-24T09:00:00Z'),
                end_time: new Date('2025-07-24T18:00:00Z'),
                event_type: 'PROJECT_ASSIGNMENT',
                contributor_id: getContributorId(2),
                location: 'Edit Suite B',
                tags: ['Editing']
            },

            // Week 4 - Client Reviews and Delivery
            {
                title: 'Client Review - Wedding Preview',
                description: 'Present wedding video preview to Smith family for feedback',
                start_time: new Date('2025-07-25T14:00:00Z'),
                end_time: new Date('2025-07-25T15:30:00Z'),
                event_type: 'PROJECT_ASSIGNMENT',
                contributor_id: getContributorId(0),
                location: 'Client Screening Room',
                tags: ['Client', 'Meeting']
            },
            {
                title: 'Final Delivery - Corporate Video',
                description: 'Deliver final TechCorp promotional video with all required formats and versions',
                start_time: new Date('2025-07-26T11:00:00Z'),
                end_time: new Date('2025-07-26T12:00:00Z'),
                event_type: 'PROJECT_ASSIGNMENT',
                contributor_id: getContributorId(1),
                location: 'Conference Room A',
                tags: ['Client']
            },
            {
                title: 'Music Video Final Review',
                description: 'Final client approval session for Anderson music video before release',
                start_time: new Date('2025-07-27T15:00:00Z'),
                end_time: new Date('2025-07-27T16:30:00Z'),
                event_type: 'PROJECT_ASSIGNMENT',
                contributor_id: getContributorId(2),
                location: 'Client Screening Room',
                tags: ['Client', 'Meeting']
            },

            // Additional regular events
            {
                title: 'Team Weekly Standup',
                description: 'Weekly team check-in and project status updates',
                start_time: new Date('2025-07-21T09:00:00Z'),
                end_time: new Date('2025-07-21T09:30:00Z'),
                event_type: 'PROJECT_ASSIGNMENT',
                contributor_id: getContributorId(0),
                location: 'Main Conference Room',
                tags: ['Meeting', 'Work']
            },
            {
                title: 'Equipment Maintenance Day',
                description: 'Scheduled maintenance and cleaning of all video equipment',
                start_time: new Date('2025-07-28T09:00:00Z'),
                end_time: new Date('2025-07-28T17:00:00Z'),
                event_type: 'PROJECT_ASSIGNMENT',
                contributor_id: getContributorId(1),
                location: 'Equipment Room',
                tags: ['Work']
            }
        ];

        const createdEvents: Array<{
            id: number;
            title: string;
            contributor_id: number;
            start_time: Date;
            requestedTags?: string[];
        }> = [];
        let eventsCreated = 0;
        let eventsSkipped = 0;

        for (const eventData of calendarEvents) {
            const { tags, ...eventWithoutTags } = eventData;

            // Check if event already exists by title, contributor, and start time
            const existingEvent = await prisma.calendar_events.findFirst({
                where: {
                    title: eventWithoutTags.title,
                    contributor_id: eventWithoutTags.contributor_id,
                    start_time: eventWithoutTags.start_time
                }
            });

            if (existingEvent) {
                createdEvents.push({ ...existingEvent, requestedTags: tags });
                eventsSkipped++;
            } else {
                // Fix event_type to be proper enum
                const eventToCreate = {
                    ...eventWithoutTags,
                    event_type: eventWithoutTags.event_type as calendar_event_type
                };
                const event = await prisma.calendar_events.create({
                    data: eventToCreate
                });
                createdEvents.push({ ...event, requestedTags: tags });
                eventsCreated++;
            }
        }

        logger.smartSummary('Calendar events', eventsCreated, eventsSkipped, calendarEvents.length);

        // Create calendar settings for all contributors
        logger.sectionDivider('Calendar Settings');
        logger.processing('Creating calendar settings...');

        // Create settings for each available contributor
        interface CalendarSetting {
            contributor_id: number;
            default_view: string;
            first_day_of_week: number;
            working_hours_start: string;
            working_hours_end: string;
            timezone: string;
            show_weekends: boolean;
            default_event_duration: number;
        }

        const settingsData: CalendarSetting[] = [];
        for (let i = 0; i < Math.min(allContributors.length, 3); i++) {
            const contributor = allContributors[i];
            const settingsOptions = [
                {
                    contributor_id: contributor.id,
                    default_view: 'WEEK',
                    first_day_of_week: 1, // Monday
                    working_hours_start: '08:00',
                    working_hours_end: '18:00',
                    timezone: 'America/New_York',
                    show_weekends: true,
                    default_event_duration: 60
                },
                {
                    contributor_id: contributor.id,
                    default_view: 'DAY',
                    first_day_of_week: 0, // Sunday
                    working_hours_start: '09:00',
                    working_hours_end: '17:00',
                    timezone: 'America/Chicago',
                    show_weekends: false,
                    default_event_duration: 90
                },
                {
                    contributor_id: contributor.id,
                    default_view: 'MONTH',
                    first_day_of_week: 1, // Monday
                    working_hours_start: '09:30',
                    working_hours_end: '17:30',
                    timezone: 'America/Los_Angeles',
                    show_weekends: true,
                    default_event_duration: 120
                }
            ];
            settingsData.push(settingsOptions[i % 3]); // Use different settings for each contributor
        }

        for (const setting of settingsData) {
            // Check if settings already exist for this contributor
            const existingSettings = await prisma.calendar_settings.findUnique({
                where: { contributor_id: setting.contributor_id }
            });

            if (!existingSettings) {
                await prisma.calendar_settings.create({ data: setting });
                logger.created(`Calendar settings for contributor ${setting.contributor_id}`, undefined, 'verbose');
            } else {
                logger.skipped(`Calendar settings for contributor ${setting.contributor_id}`, 'already exists', 'verbose');
            }
        }

        // Create task library for video production workflow
        logger.sectionDivider('Task Library');
        logger.processing('Creating task library...');

        // First, get the Moonrise Films brand for tasks
        const moonriseBrand = await prisma.brands.findFirst({
            where: { name: "Moonrise Films" }
        });

        if (!moonriseBrand) {
            logger.warning('Moonrise Films brand not found, skipping task creation');
        } else {
            const taskLibraryItems = [
                // LEAD PHASE
                {
                    name: "Lead Qualification",
                    description: "Initial assessment of lead quality and fit",
                    phase: 'Lead' as const,
                    pricing_type: 'Fixed' as const,
                    effort_hours: 0.5,
                    order_index: 1,
                    brand_id: moonriseBrand.id,
                    skills_needed: ['Sales', 'Communication'],
                    complexity_score: 2,
                },
                {
                    name: "Portfolio Presentation",
                    description: "Present work samples and discuss style preferences",
                    phase: 'Inquiry' as const,
                    pricing_type: 'Fixed' as const,
                    effort_hours: 1.0,
                    order_index: 1,
                    brand_id: moonriseBrand.id,
                    skills_needed: ['Presentation', 'Client Relations'],
                    complexity_score: 3,
                },
                {
                    name: "Requirements Discovery",
                    description: "Detailed discussion of client needs and expectations",
                    phase: 'Inquiry' as const,
                    pricing_type: 'Fixed' as const,
                    effort_hours: 1.5,
                    order_index: 2,
                    brand_id: moonriseBrand.id,
                    skills_needed: ['Consultation', 'Planning'],
                    complexity_score: 4,
                },

                // BOOKING PHASE
                {
                    name: "Quote Generation",
                    description: "Create detailed quote based on requirements",
                    phase: 'Booking' as const,
                    pricing_type: 'Fixed' as const,
                    effort_hours: 1.0,
                    order_index: 1,
                    brand_id: moonriseBrand.id,
                    skills_needed: ['Pricing', 'Documentation'],
                    complexity_score: 3,
                },
                {
                    name: "Contract Preparation",
                    description: "Prepare and customize contract for client",
                    phase: 'Booking' as const,
                    pricing_type: 'Fixed' as const,
                    effort_hours: 0.5,
                    order_index: 2,
                    brand_id: moonriseBrand.id,
                    skills_needed: ['Legal', 'Documentation'],
                    complexity_score: 2,
                },

                // CREATIVE DEVELOPMENT PHASE
                {
                    name: "Creative Brief Development",
                    description: "Develop comprehensive creative brief with client",
                    phase: 'Creative_Development' as const,
                    pricing_type: 'Fixed' as const,
                    effort_hours: 2.0,
                    order_index: 1,
                    brand_id: moonriseBrand.id,
                    skills_needed: ['Creative Direction', 'Communication', 'Planning'],
                    complexity_score: 6,
                },
                {
                    name: "Shot List Planning",
                    description: "Plan specific shots and sequences",
                    phase: 'Creative_Development' as const,
                    pricing_type: 'Fixed' as const,
                    effort_hours: 2.0,
                    order_index: 2,
                    brand_id: moonriseBrand.id,
                    skills_needed: ['Cinematography', 'Planning', 'Storytelling'],
                    complexity_score: 5,
                },
                {
                    name: "Style Guide Creation",
                    description: "Create visual style guide for the project",
                    phase: 'Creative_Development' as const,
                    pricing_type: 'Fixed' as const,
                    effort_hours: 1.5,
                    order_index: 3,
                    brand_id: moonriseBrand.id,
                    skills_needed: ['Design', 'Visual Arts', 'Documentation'],
                    complexity_score: 4,
                },

                // PRE-PRODUCTION PHASE
                {
                    name: "Location Scouting",
                    description: "Scout and assess filming locations",
                    phase: 'Pre_Production' as const,
                    pricing_type: 'Fixed' as const,
                    effort_hours: 3.0,
                    order_index: 1,
                    brand_id: moonriseBrand.id,
                    skills_needed: ['Location Management', 'Photography', 'Travel'],
                    complexity_score: 4,
                },
                {
                    name: "Equipment Preparation",
                    description: "Prepare and check all filming equipment",
                    phase: 'Pre_Production' as const,
                    pricing_type: 'Fixed' as const,
                    effort_hours: 2.0,
                    order_index: 2,
                    brand_id: moonriseBrand.id,
                    skills_needed: ['Equipment Management', 'Technical Knowledge'],
                    complexity_score: 3,
                },
                {
                    name: "Timeline Coordination",
                    description: "Coordinate timing with all parties involved",
                    phase: 'Pre_Production' as const,
                    pricing_type: 'Fixed' as const,
                    effort_hours: 1.5,
                    order_index: 3,
                    brand_id: moonriseBrand.id,
                    skills_needed: ['Project Management', 'Communication'],
                    complexity_score: 4,
                },

                // PRODUCTION PHASE
                {
                    name: "Getting Ready Coverage",
                    description: "Film preparation and getting ready moments",
                    phase: 'Production' as const,
                    pricing_type: 'Fixed' as const,
                    effort_hours: 3.0,
                    order_index: 1,
                    brand_id: moonriseBrand.id,
                    skills_needed: ['Cinematography', 'Lighting', 'Photography'],
                    complexity_score: 5,
                },
                {
                    name: "Ceremony Filming",
                    description: "Film the wedding ceremony",
                    phase: 'Production' as const,
                    pricing_type: 'Fixed' as const,
                    effort_hours: 4.0,
                    order_index: 2,
                    brand_id: moonriseBrand.id,
                    skills_needed: ['Cinematography', 'Audio Recording', 'Multi-Camera'],
                    complexity_score: 8,
                },
                {
                    name: "Reception Filming",
                    description: "Film reception events and celebrations",
                    phase: 'Production' as const,
                    pricing_type: 'Fixed' as const,
                    effort_hours: 6.0,
                    order_index: 3,
                    brand_id: moonriseBrand.id,
                    skills_needed: ['Event Coverage', 'Cinematography', 'Audio Recording'],
                    complexity_score: 7,
                },
                {
                    name: "B-Roll Footage",
                    description: "Capture detail shots and supplementary footage",
                    phase: 'Production' as const,
                    pricing_type: 'Fixed' as const,
                    effort_hours: 2.0,
                    order_index: 4,
                    brand_id: moonriseBrand.id,
                    skills_needed: ['Detail Photography', 'Cinematography', 'Creative Vision'],
                    complexity_score: 4,
                },

                // POST-PRODUCTION PHASE
                {
                    name: "Footage Review and Selection",
                    description: "Review all footage and select best takes",
                    phase: 'Post_Production' as const,
                    pricing_type: 'Fixed' as const,
                    effort_hours: 4.0,
                    order_index: 1,
                    brand_id: moonriseBrand.id,
                    skills_needed: ['Content Review', 'Storytelling', 'Organization'],
                    complexity_score: 5,
                },
                {
                    name: "Audio Enhancement",
                    description: "Clean and enhance audio from ceremony and reception",
                    phase: 'Post_Production' as const,
                    pricing_type: 'Fixed' as const,
                    effort_hours: 3.0,
                    order_index: 2,
                    brand_id: moonriseBrand.id,
                    skills_needed: ['Audio Engineering', 'Sound Design', 'Technical Skills'],
                    complexity_score: 6,
                },
                {
                    name: "Color Grading",
                    description: "Color correct and grade all footage",
                    phase: 'Post_Production' as const,
                    pricing_type: 'Fixed' as const,
                    effort_hours: 6.0,
                    order_index: 3,
                    brand_id: moonriseBrand.id,
                    skills_needed: ['Color Grading', 'Visual Arts', 'Technical Skills'],
                    complexity_score: 7,
                },
                {
                    name: "Video Editing - Highlight Reel",
                    description: "Create 3-5 minute highlight reel",
                    phase: 'Post_Production' as const,
                    pricing_type: 'Fixed' as const,
                    effort_hours: 8.0,
                    order_index: 4,
                    brand_id: moonriseBrand.id,
                    skills_needed: ['Video Editing', 'Storytelling', 'Music Sync', 'Creative Vision'],
                    complexity_score: 9,
                },
                {
                    name: "Video Editing - Ceremony Edit",
                    description: "Edit full ceremony footage",
                    phase: 'Post_Production' as const,
                    pricing_type: 'Fixed' as const,
                    effort_hours: 6.0,
                    order_index: 5,
                    brand_id: moonriseBrand.id,
                    skills_needed: ['Video Editing', 'Multi-Camera Editing', 'Audio Sync'],
                    complexity_score: 7,
                },
                {
                    name: "Music Selection and Licensing",
                    description: "Select and license appropriate music",
                    phase: 'Post_Production' as const,
                    pricing_type: 'Fixed' as const,
                    effort_hours: 2.0,
                    order_index: 6,
                    brand_id: moonriseBrand.id,
                    skills_needed: ['Music Knowledge', 'Licensing', 'Creative Direction'],
                    complexity_score: 3,
                },

                // DELIVERY PHASE
                {
                    name: "Final Export and Rendering",
                    description: "Export final videos in all required formats",
                    phase: 'Delivery' as const,
                    pricing_type: 'Fixed' as const,
                    effort_hours: 2.0,
                    order_index: 1,
                    brand_id: moonriseBrand.id,
                    skills_needed: ['Technical Skills', 'File Management', 'Quality Control'],
                    complexity_score: 3,
                },
                {
                    name: "Quality Control Check",
                    description: "Final quality check of all deliverables",
                    phase: 'Delivery' as const,
                    pricing_type: 'Fixed' as const,
                    effort_hours: 1.0,
                    order_index: 2,
                    brand_id: moonriseBrand.id,
                    skills_needed: ['Quality Assurance', 'Attention to Detail'],
                    complexity_score: 2,
                },
                {
                    name: "Online Gallery Setup",
                    description: "Set up online gallery for client access",
                    phase: 'Delivery' as const,
                    pricing_type: 'Fixed' as const,
                    effort_hours: 1.0,
                    order_index: 3,
                    brand_id: moonriseBrand.id,
                    skills_needed: ['Web Management', 'Client Relations', 'Technical Skills'],
                    complexity_score: 3,
                },
                {
                    name: "Client Delivery Coordination",
                    description: "Coordinate delivery with client",
                    phase: 'Delivery' as const,
                    pricing_type: 'Fixed' as const,
                    effort_hours: 0.5,
                    order_index: 4,
                    brand_id: moonriseBrand.id,
                    skills_needed: ['Client Relations', 'Communication', 'Project Management'],
                    complexity_score: 2,
                }
            ];

            for (const task of taskLibraryItems) {
                const existing = await prisma.task_library.findFirst({
                    where: {
                        name: task.name,
                        brand_id: task.brand_id
                    },
                });

                if (!existing) {
                    await prisma.task_library.create({
                        data: task,
                    });
                    logger.created(`Task "${task.name}" (${task.effort_hours}h)`, undefined, 'verbose');
                } else {
                    logger.skipped(`Task "${task.name}"`, 'already exists', 'verbose');
                }
            }
            logger.success(`Task library complete: ${taskLibraryItems.length} tasks processed`);
        }

        // Add event tags with duplicate checking
        logger.sectionDivider('Event Tags');
        logger.processing('Adding event tags...');
        let tagsAdded = 0;
        let tagsSkipped3 = 0;

        for (const event of createdEvents) {
            if (event.requestedTags && event.requestedTags.length > 0) {
                for (const tagName of event.requestedTags) {
                    const tag = createdTags.find(t => t.name === tagName);
                    if (tag) {
                        // Check if tag relationship already exists
                        const existingTagRelation = await prisma.event_tags.findUnique({
                            where: {
                                event_id_tag_id: {
                                    event_id: event.id,
                                    tag_id: tag.id
                                }
                            }
                        });

                        if (!existingTagRelation) {
                            await prisma.event_tags.create({
                                data: {
                                    event_id: event.id,
                                    tag_id: tag.id
                                }
                            });
                            tagsAdded++;
                        } else {
                            tagsSkipped3++;
                        }
                    }
                }
            }
        }

        logger.smartSummary('Event tags', tagsAdded, tagsSkipped3, createdEvents.length * 2); // Rough estimate

        // Add event attendees with duplicate checking
        logger.sectionDivider('Event Attendees');
        logger.processing('Adding event attendees...');

        // Create attendee assignments using actual contributor IDs
        const contributorIds = allContributors.map(c => c.id);
        const attendeeAssignments = [
            { eventTitle: 'Project Kickoff Meeting - Anderson Music Video', attendees: contributorIds.slice(0, 3) },
            { eventTitle: 'Pre-Production Planning Session', attendees: contributorIds.slice(0, 2) },
            { eventTitle: 'Location Scout - Urban Warehouse District', attendees: [contributorIds[0], contributorIds[2] || contributorIds[0]] },
            { eventTitle: 'Client Review - Wedding Preview', attendees: contributorIds.slice(0, 2) },
            { eventTitle: 'Final Delivery - Corporate Video', attendees: [contributorIds[1] || contributorIds[0], contributorIds[2] || contributorIds[0]] },
            { eventTitle: 'Music Video Final Review', attendees: [contributorIds[0], contributorIds[2] || contributorIds[0]] },
            { eventTitle: 'Team Weekly Standup', attendees: contributorIds.slice(0, 3) },
            { eventTitle: 'Rough Cut Review - Wedding Footage', attendees: contributorIds.slice(0, 2) }
        ];

        let attendeesAdded = 0;
        let attendeesSkipped = 0;

        for (const assignment of attendeeAssignments) {
            const event = createdEvents.find(e => e.title === assignment.eventTitle);
            if (event) {
                for (const contributorId of assignment.attendees) {
                    // Check if attendee already exists to avoid duplicate constraint error
                    const existingAttendee = await prisma.event_attendees.findUnique({
                        where: {
                            event_id_contributor_id: {
                                event_id: event.id,
                                contributor_id: contributorId
                            }
                        }
                    });

                    if (!existingAttendee) {
                        const status = contributorId === event.contributor_id ? 'ACCEPTED' : 'PENDING';
                        await prisma.event_attendees.create({
                            data: {
                                event_id: event.id,
                                contributor_id: contributorId,
                                status: status
                            }
                        });
                        attendeesAdded++;
                    } else {
                        attendeesSkipped++;
                    }
                }
            }
        }

        logger.smartSummary('Event attendees', attendeesAdded, attendeesSkipped, attendeeAssignments.length * 3); // Rough estimate

        // Add event reminders for important events with duplicate checking
        logger.sectionDivider('Event Reminders');
        logger.processing('Adding event reminders...');
        const reminderEvents = [
            { title: 'Project Kickoff Meeting - Anderson Music Video', minutesBefore: [60, 15] },
            { title: 'Wedding Shoot - Smith Family', minutesBefore: [1440, 60] }, // 24 hours and 1 hour
            { title: 'Music Video Shoot - Anderson Artist', minutesBefore: [480, 30] }, // 8 hours and 30 min
            { title: 'Client Review - Wedding Preview', minutesBefore: [120, 15] },
            { title: 'Final Delivery - Corporate Video', minutesBefore: [60] }
        ];

        let remindersAdded = 0;
        let remindersSkipped = 0;

        for (const reminderConfig of reminderEvents) {
            const event = createdEvents.find(e => e.title === reminderConfig.title);
            if (event) {
                for (const minutes of reminderConfig.minutesBefore) {
                    const reminderTime = new Date(new Date(event.start_time).getTime() - minutes * 60 * 1000);

                    // Check if reminder already exists
                    const existingReminder = await prisma.event_reminders.findFirst({
                        where: {
                            event_id: event.id,
                            reminder_time: reminderTime,
                            method: 'EMAIL'
                        }
                    });

                    if (!existingReminder) {
                        await prisma.event_reminders.create({
                            data: {
                                event_id: event.id,
                                reminder_time: reminderTime,
                                method: 'EMAIL'
                            }
                        });
                        remindersAdded++;
                    } else {
                        remindersSkipped++;
                    }
                }
            }
        }

        logger.smartSummary('Event reminders', remindersAdded, remindersSkipped, reminderEvents.length * 2); // Rough estimate

        // Show final statistics
        logger.sectionDivider('Final Summary');
        const eventCount = await prisma.calendar_events.count();
        const tagCount = await prisma.tags.count();
        const attendeeCount = await prisma.event_attendees.count();
        const reminderCount = await prisma.event_reminders.count();
        const settingsCount = await prisma.calendar_settings.count();
        const taskCount = await prisma.task_library.count();

        logger.success(`Calendar system seeding completed`);
        logger.endTimer('calendar-seed', 'Calendar seeding');
        logger.info(`📅 Events: ${eventCount}`);
        logger.info(`🏷️  Tags: ${tagCount}`);
        logger.info(`👥 Attendees: ${attendeeCount}`);
        logger.info(`⏰ Reminders: ${reminderCount}`);
        logger.info(`⚙️  Settings: ${settingsCount}`);
        logger.info(`📋 Tasks: ${taskCount}`);

        logger.success('Video Production Calendar & Task Library Ready!');

        return {
            created: eventsCreated + tagsCreated + attendeesAdded + remindersAdded,
            updated: 0,
            skipped: eventsSkipped + tagsSkipped2 + attendeesSkipped + remindersSkipped,
            total: (eventsCreated + tagsCreated + attendeesAdded + remindersAdded) + (eventsSkipped + tagsSkipped2 + attendeesSkipped + remindersSkipped)
        };
    } catch (error) {
        console.error('❌ Error seeding calendar:', error);
        throw error;
    }
}

// Export the function for use in other modules
export { seedCalendar };

// Run this seed
if (require.main === module) {
    seedCalendar().catch(console.error);
}
