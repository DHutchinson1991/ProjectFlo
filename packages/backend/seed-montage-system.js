/**
 * Seed System Montage Presets & Film Structure Templates
 * 
 * Creates the initial system-seeded data for:
 * - 3 Montage Presets (Trailer, Highlights, Same-Day Edit)
 * - 4 Film Structure Templates (with nested scenes)
 *
 * Run from packages/backend:
 *   node seed-montage-system.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedMontageSystem() {
  console.log('🎬 Seeding montage presets and film structure templates...\n');

  // ============================================================================
  // 1. MONTAGE PRESETS
  // ============================================================================
  const presets = [
    {
      name: 'Trailer',
      min_duration_seconds: 60,
      max_duration_seconds: 90,
      is_system_seeded: true,
    },
    {
      name: 'Highlights',
      min_duration_seconds: 240,
      max_duration_seconds: 480,
      is_system_seeded: true,
    },
    {
      name: 'Same-Day Edit',
      min_duration_seconds: 180,
      max_duration_seconds: 300,
      is_system_seeded: true,
    },
  ];

  for (const preset of presets) {
    const existing = await prisma.montagePreset.findFirst({
      where: { name: preset.name, brand_id: null },
    });
    if (existing) {
      console.log(`  ⏭️  Preset "${preset.name}" already exists (ID: ${existing.id})`);
    } else {
      const created = await prisma.montagePreset.create({ data: preset });
      console.log(`  ✅ Created preset "${preset.name}" (ID: ${created.id}) — ${preset.min_duration_seconds}-${preset.max_duration_seconds}s`);
    }
  }

  // ============================================================================
  // 2. FILM STRUCTURE TEMPLATES
  // ============================================================================
  const templates = [
    {
      name: 'Classic 4-Scene',
      description: 'Traditional wedding highlights: Getting Ready → Ceremony → Portraits → Reception',
      film_type: 'MONTAGE',
      is_system_seeded: true,
      scenes: [
        { name: 'Getting Ready Montage', mode: 'MONTAGE', suggested_duration_seconds: 60, order_index: 0, notes: 'Intercut bride & groom prep with detail shots' },
        { name: 'Ceremony Highlights', mode: 'MONTAGE', suggested_duration_seconds: 90, order_index: 1, notes: 'Processional, vows, ring exchange, first kiss' },
        { name: 'Portraits & Couple Session', mode: 'MONTAGE', suggested_duration_seconds: 45, order_index: 2, notes: 'Best couples shots with romantic audio overlay' },
        { name: 'Reception Highlights', mode: 'MONTAGE', suggested_duration_seconds: 60, order_index: 3, notes: 'Entrance, first dance, speeches highlights, party' },
      ],
    },
    {
      name: 'Emotional Arc',
      description: 'Story-driven structure: Hook → Build → Climax → Resolution',
      film_type: 'MONTAGE',
      is_system_seeded: true,
      scenes: [
        { name: 'The Hook', mode: 'MONTAGE', suggested_duration_seconds: 30, order_index: 0, notes: 'Tease the best moment — a vow excerpt, a reaction, a sparkler exit' },
        { name: 'The Build', mode: 'MONTAGE', suggested_duration_seconds: 90, order_index: 1, notes: 'Getting ready, morning details, anticipation' },
        { name: 'The Climax', mode: 'MONTAGE', suggested_duration_seconds: 120, order_index: 2, notes: 'Ceremony, vows, emotional peaks — the core of the story' },
        { name: 'The Celebration', mode: 'MONTAGE', suggested_duration_seconds: 60, order_index: 3, notes: 'Reception energy, toasts, dancing, joy' },
        { name: 'The Resolution', mode: 'MONTAGE', suggested_duration_seconds: 30, order_index: 4, notes: 'Quiet closer — sparkler exit, final kiss, last look' },
      ],
    },
    {
      name: 'Music-Driven 3-Act',
      description: 'Structured around music: Intro verse → Build chorus → Finale bridge',
      film_type: 'MONTAGE',
      is_system_seeded: true,
      scenes: [
        { name: 'Act I — Verse', mode: 'MONTAGE', suggested_duration_seconds: 60, order_index: 0, notes: 'Slow build — details, prep, quiet moments aligned with verse tempo' },
        { name: 'Act II — Chorus', mode: 'MONTAGE', suggested_duration_seconds: 120, order_index: 1, notes: 'Energy peak — ceremony moments, first look, emotional highlights on chorus' },
        { name: 'Act III — Bridge & Outro', mode: 'MONTAGE', suggested_duration_seconds: 60, order_index: 2, notes: 'Wind down — reception joy, golden hour, final send-off on music bridge' },
      ],
    },
    {
      name: 'Full Day Documentary',
      description: 'Chronological full-day coverage with realtime scenes for key moments',
      film_type: 'FEATURE',
      is_system_seeded: true,
      scenes: [
        { name: 'Morning Preparations', mode: 'MONTAGE', suggested_duration_seconds: 180, order_index: 0, notes: 'Both sides getting ready, intercut' },
        { name: 'First Look / Reveal', mode: 'MOMENTS', suggested_duration_seconds: 120, order_index: 1, notes: 'Realtime first look if applicable' },
        { name: 'Ceremony', mode: 'MOMENTS', suggested_duration_seconds: null, order_index: 2, notes: 'Full ceremony — realtime coverage' },
        { name: 'Couple Session', mode: 'MONTAGE', suggested_duration_seconds: 120, order_index: 3, notes: 'Portraits and couples shots' },
        { name: 'Reception Speeches', mode: 'MOMENTS', suggested_duration_seconds: null, order_index: 4, notes: 'Full speeches — realtime' },
        { name: 'First Dance', mode: 'MOMENTS', suggested_duration_seconds: null, order_index: 5, notes: 'Full first dance — realtime' },
        { name: 'Party & Dancing', mode: 'MONTAGE', suggested_duration_seconds: 180, order_index: 6, notes: 'Party highlights montage' },
        { name: 'Send-Off / Sparkler Exit', mode: 'MONTAGE', suggested_duration_seconds: 60, order_index: 7, notes: 'Final moments of the night' },
      ],
    },
  ];

  for (const tmpl of templates) {
    const { scenes, ...templateData } = tmpl;
    const existing = await prisma.filmStructureTemplate.findFirst({
      where: { name: tmpl.name, brand_id: null },
    });
    if (existing) {
      console.log(`  ⏭️  Template "${tmpl.name}" already exists (ID: ${existing.id})`);
      continue;
    }

    const created = await prisma.filmStructureTemplate.create({
      data: {
        ...templateData,
        scenes: {
          create: scenes,
        },
      },
      include: { scenes: true },
    });
    console.log(`  ✅ Created template "${created.name}" (ID: ${created.id}) — ${created.scenes.length} scenes [${tmpl.film_type}]`);
  }

  console.log('\n🎉 Montage system seed complete!');
}

seedMontageSystem()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
