// System Content Seed — Montage Presets + Film Structure Templates
import { PrismaClient, FilmType, SceneType } from '@prisma/client';
import { createSeedLogger, SeedType, SeedSummary } from '../utils/seed-logger';

let prisma: PrismaClient;
const logger = createSeedLogger(SeedType.SYSTEM);

const MONTAGE_PRESETS = [
    { name: 'Trailer',        min_duration_seconds: 60,  max_duration_seconds: 90 },
    { name: 'Highlights',     min_duration_seconds: 240, max_duration_seconds: 480 },
    { name: 'Same-Day Edit',  min_duration_seconds: 180, max_duration_seconds: 300 },
];

const FILM_STRUCTURE_TEMPLATES = [
    {
        name: 'Classic 4-Scene',
        description: 'Traditional wedding highlights: Getting Ready -> Ceremony -> Portraits -> Reception',
        film_type: FilmType.MONTAGE,
        scenes: [
            { name: 'Getting Ready Montage',    mode: SceneType.MONTAGE, suggested_duration_seconds: 60,  order_index: 0, notes: 'Intercut bride & groom prep with detail shots' },
            { name: 'Ceremony Highlights',       mode: SceneType.MONTAGE, suggested_duration_seconds: 90,  order_index: 1, notes: 'Processional, vows, ring exchange, first kiss' },
            { name: 'Portraits & Couple Session',mode: SceneType.MONTAGE, suggested_duration_seconds: 45,  order_index: 2, notes: 'Best couples shots with romantic audio overlay' },
            { name: 'Reception Highlights',      mode: SceneType.MONTAGE, suggested_duration_seconds: 60,  order_index: 3, notes: 'Entrance, first dance, speeches highlights, party' },
        ],
    },
    {
        name: 'Emotional Arc',
        description: 'Story-driven structure: Hook -> Build -> Climax -> Resolution',
        film_type: FilmType.MONTAGE,
        scenes: [
            { name: 'The Hook',        mode: SceneType.MONTAGE, suggested_duration_seconds: 30,  order_index: 0, notes: 'Tease the best moment - a vow excerpt, a reaction, a sparkler exit' },
            { name: 'The Build',       mode: SceneType.MONTAGE, suggested_duration_seconds: 90,  order_index: 1, notes: 'Getting ready, morning details, anticipation' },
            { name: 'The Climax',      mode: SceneType.MONTAGE, suggested_duration_seconds: 120, order_index: 2, notes: 'Ceremony, vows, emotional peaks - the core of the story' },
            { name: 'The Celebration', mode: SceneType.MONTAGE, suggested_duration_seconds: 60,  order_index: 3, notes: 'Reception energy, toasts, dancing, joy' },
            { name: 'The Resolution',  mode: SceneType.MONTAGE, suggested_duration_seconds: 30,  order_index: 4, notes: 'Quiet closer - sparkler exit, final kiss, last look' },
        ],
    },
    {
        name: 'Music-Driven 3-Act',
        description: 'Structured around music: Intro verse -> Build chorus -> Finale bridge',
        film_type: FilmType.MONTAGE,
        scenes: [
            { name: 'Act I - Verse',            mode: SceneType.MONTAGE, suggested_duration_seconds: 60,  order_index: 0, notes: 'Slow build - details, prep, quiet moments aligned with verse tempo' },
            { name: 'Act II - Chorus',           mode: SceneType.MONTAGE, suggested_duration_seconds: 120, order_index: 1, notes: 'Energy peak - ceremony moments, first look, emotional highlights on chorus' },
            { name: 'Act III - Bridge & Outro',  mode: SceneType.MONTAGE, suggested_duration_seconds: 60,  order_index: 2, notes: 'Wind down - reception joy, golden hour, final send-off on music bridge' },
        ],
    },
    {
        name: 'Full Day Documentary',
        description: 'Chronological full-day coverage with realtime scenes for key moments',
        film_type: FilmType.FEATURE,
        scenes: [
            { name: 'Morning Preparations', mode: SceneType.MONTAGE, suggested_duration_seconds: 180, order_index: 0, notes: 'Both sides getting ready, intercut' },
            { name: 'First Look / Reveal',   mode: SceneType.MOMENTS, suggested_duration_seconds: 120, order_index: 1, notes: 'Realtime first look if applicable' },
            { name: 'Ceremony',              mode: SceneType.MOMENTS, suggested_duration_seconds: null, order_index: 2, notes: 'Full ceremony - realtime coverage' },
            { name: 'Couple Session',        mode: SceneType.MONTAGE, suggested_duration_seconds: 120, order_index: 3, notes: 'Portraits and couples shots' },
            { name: 'Reception Speeches',    mode: SceneType.MOMENTS, suggested_duration_seconds: null, order_index: 4, notes: 'Full speeches - realtime' },
            { name: 'First Dance',           mode: SceneType.MOMENTS, suggested_duration_seconds: null, order_index: 5, notes: 'Full first dance - realtime' },
            { name: 'Party & Dancing',       mode: SceneType.MONTAGE, suggested_duration_seconds: 180, order_index: 6, notes: 'Party highlights montage' },
            { name: 'Send-Off / Sparkler Exit', mode: SceneType.MONTAGE, suggested_duration_seconds: 60, order_index: 7, notes: 'Final moments of the night' },
        ],
    },
];

async function main(db: PrismaClient): Promise<SeedSummary> {
    prisma = db;
    logger.sectionHeader('System Content');
    logger.startTimer('system-content');

    let created = 0;
    let updated = 0;
    let skipped = 0;

    logger.processing('Seeding montage presets...');
    for (const preset of MONTAGE_PRESETS) {
        const existing = await prisma.montagePreset.findFirst({ where: { name: preset.name, brand_id: null } });
        if (existing) {
            await prisma.montagePreset.update({ where: { id: existing.id }, data: { ...preset, is_system_seeded: true, is_active: true } });
            updated++;
        } else {
            await prisma.montagePreset.create({ data: { brand_id: null, ...preset, is_system_seeded: true, is_active: true } });
            created++;
        }
    }

    logger.processing('Seeding film structure templates...');
    for (const template of FILM_STRUCTURE_TEMPLATES) {
        const existing = await prisma.filmStructureTemplate.findFirst({ where: { name: template.name, brand_id: null } });
        const templateData = { brand_id: null, name: template.name, description: template.description, film_type: template.film_type, is_system_seeded: true, is_active: true };

        if (existing) {
            await prisma.filmStructureTemplate.update({ where: { id: existing.id }, data: templateData });
            await prisma.filmStructureTemplateScene.deleteMany({ where: { film_structure_template_id: existing.id } });
            await prisma.filmStructureTemplateScene.createMany({
                data: template.scenes.map((s) => ({ film_structure_template_id: existing.id, ...s })),
            });
            updated++;
        } else {
            await prisma.filmStructureTemplate.create({
                data: { ...templateData, scenes: { create: template.scenes } },
            });
            created++;
        }
    }

    skipped = MONTAGE_PRESETS.length + FILM_STRUCTURE_TEMPLATES.length - created - updated;
    const total = created + updated + skipped;

    logger.smartSummary('Montage presets + film templates', created, updated, total);
    logger.success(`System Content done — Created: ${created}, Updated: ${updated}`);
    logger.endTimer('system-content', 'System Content');
    return { created, updated, skipped, total };
}

export default main;
