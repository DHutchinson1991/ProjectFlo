import { PrismaClient } from '@prisma/client';
import { logger, type SeedSummary } from './seed-logger';

// Snapshot types for global and per-brand counts
export interface GlobalCountSnapshot {
    brands: number;
    crew: number;
    films: number;
    tasks: number;
    coverage: number;
    projects: number;
    inquiries: number;
    venues: number;
    equipment: number;
    events: number;
    tags: number;
    attendees: number;
    reminders: number;
    settings: number;
    refactorFilms: number;
    refactorFilmTracks: number;
    refactorFilmSubjects: number;
    refactorFilmScenes: number;
    refactorFilmMoments: number;
    refactorRecordingSetups: number;
    refactorCameraAssignments: number;
    refactorSubjectTemplates: number;
    refactorSceneTemplates: number;
    refactorSceneMusic: number;
    refactorMomentMusic: number;
}

export interface BrandCountSnapshot {
    crew: number; // via user_brands for brand
    films: number;
    tasks: number;
    equipment: number;
    projects: number;
    inquiries: number; // via inquiries.contact.brand_id
    venues: number;
}

export async function getGlobalCounts(prisma: PrismaClient): Promise<GlobalCountSnapshot> {
    logger.sectionHeader('Final Database Metrics');
    // Core entities
    const [brands, crew, films, tasks, coverage, projects, inquiries, venues, equipment,
        refactorFilms, refactorFilmTracks, refactorFilmSubjects, refactorFilmScenes, refactorFilmMoments, refactorRecordingSetups, refactorCameraAssignments,
        refactorSubjectTemplates, refactorSceneTemplates, refactorSceneMusic, refactorMomentMusic] = await Promise.all([
        prisma.brands.count(),
        prisma.crew.count(),
        prisma.filmLibrary.count(),
        prisma.task_library.count(),
        prisma.coverage.count(),
        prisma.projects.count(),
        prisma.inquiries.count(),
        prisma.locationsLibrary.count(),
        prisma.equipment.count(),
        prisma.film.count(),
        prisma.filmTimelineTrack.count(),
        prisma.filmSubject.count(),
        prisma.filmScene.count(),
        prisma.sceneMoment.count(),
        prisma.momentRecordingSetup.count(),
        prisma.cameraSubjectAssignment.count(),
        prisma.subjectTemplate.count(),
        prisma.sceneTemplate.count(),
        prisma.sceneMusic.count(),
        prisma.momentMusic.count()
    ]);

    // Calendar entities
    const [events, tags, attendees, reminders, settings] = await Promise.all([
        prisma.calendar_events.count(),
        prisma.tags.count(),
        prisma.event_attendees.count(),
        prisma.event_reminders.count(),
        prisma.calendar_settings.count()
    ]);

    return {
        brands,
        crew,
        films,
        tasks,
        coverage,
        projects,
        inquiries,
        venues,
        equipment,
        events,
        tags,
        attendees,
        reminders,
        settings,
        refactorFilms,
        refactorFilmTracks,
        refactorFilmSubjects,
        refactorFilmScenes,
        refactorFilmMoments,
        refactorRecordingSetups,
        refactorCameraAssignments,
        refactorSubjectTemplates,
        refactorSceneTemplates,
        refactorSceneMusic,
        refactorMomentMusic
    };
}

export async function getBrandCounts(prisma: PrismaClient, brandId: number): Promise<BrandCountSnapshot> {
    const [crew, films, tasks, equipment, projects, inquiries, venues] = await Promise.all([
        prisma.brandMember.count({ where: { brand_id: brandId } }),
        prisma.filmLibrary.count({ where: { brand_id: brandId } }),
        prisma.task_library.count({ where: { brand_id: brandId } }),
        prisma.equipment.count({ where: { brand_id: brandId } }),
        prisma.projects.count({ where: { brand_id: brandId } }),
        prisma.inquiries.count({ where: { contact: { brand_id: brandId } } }),
        prisma.locationsLibrary.count({ where: { brand_id: brandId } }),
    ]);
    return { crew, films, tasks, equipment, projects, inquiries, venues };
}

function diff(after: number, before?: number): number {
    const b = typeof before === 'number' ? before : 0;
    return Math.max(0, after - b);
}

// Optionally provide before-snapshots to display per-item created deltas
export type PerBrandRun = Record<string, Partial<Record<
    | 'crew'
    | 'films'
    | 'scenes'
    | 'tasks'
    | 'subjects'
    | 'music'
    | 'equipment'
    | 'projects'
    | 'inquiries'
    | 'venues'
    | 'sceneAssignments'
    , SeedSummary>>>;

export async function printFinalMetrics(
    prisma: PrismaClient,
    runSummary?: SeedSummary,
    beforeGlobal?: Partial<GlobalCountSnapshot>,
    beforeBrand?: Record<string, Partial<BrandCountSnapshot>>,
    perBrandRun?: PerBrandRun
) {
    // Inline color helpers for mixed-color metric segments
    const ANSI = {
        reset: '\x1b[0m',
        blue: '\x1b[34m',
        yellow: '\x1b[33m'
    } as const;

    const fmtDeltas = (createdDelta: number, skippedThisRun?: number, fallbackTotal?: number) => {
        const fallback = typeof fallbackTotal === 'number' ? Math.max(0, fallbackTotal - createdDelta) : 0;
        const skipped = typeof skippedThisRun === 'number' ? skippedThisRun : fallback;
        return ` (${ANSI.yellow}skipped +${skipped}${ANSI.reset} - ${ANSI.blue}created +${createdDelta}${ANSI.reset})`;
    };

    // Compute authoritative post-run counts
    const afterGlobal = await getGlobalCounts(prisma);

    // Resolve brand IDs and post-run brand counts
    const [moonriseBrand, layer5Brand] = await Promise.all([
        prisma.brands.findFirst({ where: { name: 'Moonrise Films' } }),
        prisma.brands.findFirst({ where: { name: 'Layer5' } })
    ]);
    const afterMoonrise = moonriseBrand ? await getBrandCounts(prisma, moonriseBrand.id) : undefined;
    const afterLayer5 = layer5Brand ? await getBrandCounts(prisma, layer5Brand.id) : undefined;

    logger.sectionDivider('🏢 Brands & Teams');
    logger.success(`🏢 Brands:${fmtDeltas(diff(afterGlobal.brands, beforeGlobal?.brands), undefined, afterGlobal.brands)}`);
    logger.success(`👥 Crew:${fmtDeltas(diff(afterGlobal.crew, beforeGlobal?.crew), undefined, afterGlobal.crew)}`);

    // Optional run summary (created/skipped this run)
    if (runSummary) {
        logger.sectionDivider('📈 Run Summary');
        logger.success(`✅ Created this run: ${ANSI.blue}${runSummary.created}${ANSI.reset}`);
        logger.success(`⏭️ Skipped this run: ${ANSI.yellow}${runSummary.skipped}${ANSI.reset}`);
    }

    // Brand-specific breakdowns
    if (afterMoonrise) {
        logger.sectionDivider('🌙 Moonrise Films');
        const m = perBrandRun?.['Moonrise Films'] || {};
        logger.success(`👥 Crew:${fmtDeltas(diff(afterMoonrise.crew, beforeBrand?.['Moonrise Films']?.crew), m.crew?.skipped, afterMoonrise.crew)}`);
        logger.success(`🎬 Films:${fmtDeltas(diff(afterMoonrise.films, beforeBrand?.['Moonrise Films']?.films), m.films?.skipped, afterMoonrise.films)}`);
        logger.success(`📋 Tasks:${fmtDeltas(diff(afterMoonrise.tasks, beforeBrand?.['Moonrise Films']?.tasks), m.tasks?.skipped, afterMoonrise.tasks)}`);
        logger.success(`🎥 Equipment Items:${fmtDeltas(diff(afterMoonrise.equipment, beforeBrand?.['Moonrise Films']?.equipment), m.equipment?.skipped, afterMoonrise.equipment)}`);
        logger.success(`💼 Projects:${fmtDeltas(diff(afterMoonrise.projects, beforeBrand?.['Moonrise Films']?.projects), m.projects?.skipped, afterMoonrise.projects)}`);
        logger.success(`📧 Inquiries:${fmtDeltas(diff(afterMoonrise.inquiries, beforeBrand?.['Moonrise Films']?.inquiries), m.inquiries?.skipped, afterMoonrise.inquiries)}`);
        logger.success(`🏰 Venues:${fmtDeltas(diff(afterMoonrise.venues, beforeBrand?.['Moonrise Films']?.venues), m.venues?.skipped, afterMoonrise.venues)}`);
        logger.success(`🎬 New Films:${fmtDeltas(diff(afterGlobal.refactorFilms, beforeGlobal?.refactorFilms), undefined, afterGlobal.refactorFilms)}`);
        logger.success(`🎞️ New Tracks:${fmtDeltas(diff(afterGlobal.refactorFilmTracks, beforeGlobal?.refactorFilmTracks), undefined, afterGlobal.refactorFilmTracks)}`);
        logger.success(`👥 New Film Subjects:${fmtDeltas(diff(afterGlobal.refactorFilmSubjects, beforeGlobal?.refactorFilmSubjects), undefined, afterGlobal.refactorFilmSubjects)}`);
        logger.success(`🎭 New Film Scenes:${fmtDeltas(diff(afterGlobal.refactorFilmScenes, beforeGlobal?.refactorFilmScenes), undefined, afterGlobal.refactorFilmScenes)}`);
        logger.success(`⏱️ New Film Moments:${fmtDeltas(diff(afterGlobal.refactorFilmMoments, beforeGlobal?.refactorFilmMoments), undefined, afterGlobal.refactorFilmMoments)}`);
        logger.success(`🎙️ New Recording Setups:${fmtDeltas(diff(afterGlobal.refactorRecordingSetups, beforeGlobal?.refactorRecordingSetups), undefined, afterGlobal.refactorRecordingSetups)}`);
        logger.success(`🎯 New Camera Assignments:${fmtDeltas(diff(afterGlobal.refactorCameraAssignments, beforeGlobal?.refactorCameraAssignments), undefined, afterGlobal.refactorCameraAssignments)}`);
        logger.success(`👰 New Subject Templates:${fmtDeltas(diff(afterGlobal.refactorSubjectTemplates, beforeGlobal?.refactorSubjectTemplates), undefined, afterGlobal.refactorSubjectTemplates)}`);
        logger.success(`📚 New Scene Templates:${fmtDeltas(diff(afterGlobal.refactorSceneTemplates, beforeGlobal?.refactorSceneTemplates), undefined, afterGlobal.refactorSceneTemplates)}`);
        logger.success(`🎵 New Scene Music:${fmtDeltas(diff(afterGlobal.refactorSceneMusic, beforeGlobal?.refactorSceneMusic), undefined, afterGlobal.refactorSceneMusic)}`);
        logger.success(`🎼 New Moment Music:${fmtDeltas(diff(afterGlobal.refactorMomentMusic, beforeGlobal?.refactorMomentMusic), undefined, afterGlobal.refactorMomentMusic)}`);
    }
    if (afterLayer5) {
        logger.sectionDivider('🏢 Layer5 Corporate');
        logger.success(`👥 Crew:${fmtDeltas(diff(afterLayer5.crew, beforeBrand?.['Layer5']?.crew), undefined, afterLayer5.crew)}`);
        logger.success(`🎬 Films:${fmtDeltas(diff(afterLayer5.films, beforeBrand?.['Layer5']?.films), undefined, afterLayer5.films)}`);
        logger.success(`📋 Tasks:${fmtDeltas(diff(afterLayer5.tasks, beforeBrand?.['Layer5']?.tasks), undefined, afterLayer5.tasks)}`);
        logger.success(`🎥 Equipment Items:${fmtDeltas(diff(afterLayer5.equipment, beforeBrand?.['Layer5']?.equipment), undefined, afterLayer5.equipment)}`);
        logger.success(`💼 Projects:${fmtDeltas(diff(afterLayer5.projects, beforeBrand?.['Layer5']?.projects), undefined, afterLayer5.projects)}`);
        logger.success(`📧 Inquiries:${fmtDeltas(diff(afterLayer5.inquiries, beforeBrand?.['Layer5']?.inquiries), undefined, afterLayer5.inquiries)}`);
        logger.success(`🏰 Venues:${fmtDeltas(diff(afterLayer5.venues, beforeBrand?.['Layer5']?.venues), undefined, afterLayer5.venues)}`);
    }
    logger.sectionDivider('📁 Projects & Inquiries');
    logger.success(`💼 Projects:${fmtDeltas(diff(afterGlobal.projects, beforeGlobal?.projects), undefined, afterGlobal.projects)}`);
    logger.success(`📧 Inquiries:${fmtDeltas(diff(afterGlobal.inquiries, beforeGlobal?.inquiries), undefined, afterGlobal.inquiries)}`);
    logger.success(`🏰 Venues:${fmtDeltas(diff(afterGlobal.venues, beforeGlobal?.venues), undefined, afterGlobal.venues)}`);

    logger.sectionDivider('📅 Calendar');
    logger.success(`📅 Events:${fmtDeltas(diff(afterGlobal.events, beforeGlobal?.events), undefined, afterGlobal.events)}`);
    logger.success(`🏷️ Tags:${fmtDeltas(diff(afterGlobal.tags, beforeGlobal?.tags), undefined, afterGlobal.tags)}`);
    logger.success(`👥 Attendees:${fmtDeltas(diff(afterGlobal.attendees, beforeGlobal?.attendees), undefined, afterGlobal.attendees)}`);
    logger.success(`⏰ Reminders:${fmtDeltas(diff(afterGlobal.reminders, beforeGlobal?.reminders), undefined, afterGlobal.reminders)}`);
    logger.success(`⚙️ Settings:${fmtDeltas(diff(afterGlobal.settings, beforeGlobal?.settings), undefined, afterGlobal.settings)}`);

    logger.success('Metrics generated. These reflect the current database state.');
}
