/**
 * Seed: Wedding Subject Type Templates
 *
 * Creates subject type templates linked to the "Wedding" event type:
 *
 * PEOPLE templates:
 *   - Couple (core: Bride, Groom)
 *   - Wedding Party (core: Best Man, Maid of Honor; optional: Bridesmaids, Groomsmen, Flower Girl, Ring Bearer)
 *   - Family (Parents of Bride, Parents of Groom, Grandparents)
 *   - Officiant & Vendors (Officiant, DJ, Coordinator, Photographer)
 *   - Guests
 *
 * Run from backend directory:
 *   node scripts/seed-wedding-subject-templates.js
 *
 * Requires: backend server NOT running (direct Prisma access)
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SUBJECT_TYPES = [
    {
        name: 'Couple',
        description: 'The couple getting married',
        category: 'PEOPLE',
        roles: [
            { role_name: 'Bride', description: 'The bride', is_core: true },
            { role_name: 'Groom', description: 'The groom', is_core: true },
        ],
    },
    {
        name: 'Wedding Party',
        description: 'Bridal party and groomsmen',
        category: 'PEOPLE',
        roles: [
            { role_name: 'Maid of Honor', description: 'Maid / matron of honor', is_core: true },
            { role_name: 'Best Man', description: 'Best man', is_core: true },
            { role_name: 'Bridesmaids', description: 'Bridesmaids', is_core: false },
            { role_name: 'Groomsmen', description: 'Groomsmen', is_core: false },
            { role_name: 'Flower Girl', description: 'Flower girl', is_core: false },
            { role_name: 'Ring Bearer', description: 'Ring bearer', is_core: false },
        ],
    },
    {
        name: 'Family',
        description: 'Immediate family members',
        category: 'PEOPLE',
        roles: [
            { role_name: 'Father of Bride', description: 'Father of the bride', is_core: true },
            { role_name: 'Mother of Bride', description: 'Mother of the bride', is_core: true },
            { role_name: 'Father of Groom', description: 'Father of the groom', is_core: true },
            { role_name: 'Mother of Groom', description: 'Mother of the groom', is_core: true },
            { role_name: 'Grandparents', description: 'Grandparents of either side', is_core: false },
            { role_name: 'Siblings', description: 'Brothers and sisters', is_core: false },
        ],
    },
    {
        name: 'Officiant & Vendors',
        description: 'Ceremony officiant and key vendors',
        category: 'PEOPLE',
        roles: [
            { role_name: 'Officiant', description: 'Ceremony officiant / celebrant', is_core: true },
            { role_name: 'DJ / Band', description: 'Music and entertainment', is_core: false },
            { role_name: 'Coordinator', description: 'Wedding planner / day-of coordinator', is_core: false },
            { role_name: 'Photographer', description: 'Still photographer', is_core: false },
        ],
    },
    {
        name: 'Guests',
        description: 'General wedding guests',
        category: 'PEOPLE',
        roles: [
            { role_name: 'Guest', description: 'General guest', is_core: true },
            { role_name: 'VIP Guest', description: 'Important guest / close friend', is_core: false },
        ],
    },
];

async function main() {
    console.log('🎬 === Seed Wedding Subject Type Templates ===\n');

    // Find brand
    const brand = await prisma.brands.findFirst({
        where: { name: 'Moonrise Films' },
    });
    if (!brand) {
        console.error('❌ Moonrise Films brand not found');
        process.exit(1);
    }
    console.log(`✅ Brand: ${brand.name} (ID: ${brand.id})`);

    // Find Wedding event type
    const weddingET = await prisma.eventType.findFirst({
        where: { brand_id: brand.id, name: 'Wedding' },
    });
    if (!weddingET) {
        console.error('❌ Wedding event type not found — run the event types seed first');
        process.exit(1);
    }
    console.log(`✅ Event type: ${weddingET.name} (ID: ${weddingET.id})\n`);

    let createdCount = 0;
    let skippedCount = 0;
    let linkedCount = 0;

    for (const st of SUBJECT_TYPES) {
        // Check if already exists for this brand
        const existing = await prisma.subjectTypeTemplate.findFirst({
            where: { brand_id: brand.id, name: st.name },
        });

        let templateId;

        if (existing) {
            console.log(`  ⏭  "${st.name}" already exists (ID: ${existing.id}) — skipping`);
            templateId = existing.id;
            skippedCount++;
        } else {
            const created = await prisma.subjectTypeTemplate.create({
                data: {
                    brand_id: brand.id,
                    name: st.name,
                    description: st.description,
                    category: st.category,
                    is_active: true,
                    roles: {
                        create: st.roles.map((r, i) => ({
                            role_name: r.role_name,
                            description: r.description,
                            is_core: r.is_core,
                            order_index: i,
                        })),
                    },
                },
                include: { roles: true },
            });
            templateId = created.id;
            const coreCount = created.roles.filter((r) => r.is_core).length;
            console.log(`  ✅ Created "${st.name}" (ID: ${created.id}) — ${created.roles.length} roles (${coreCount} core)`);
            createdCount++;
        }

        // Link to Wedding event type if not already linked
        const alreadyLinked = await prisma.eventTypeSubjectType.findFirst({
            where: {
                event_type_id: weddingET.id,
                subject_type_template_id: templateId,
            },
        });

        if (!alreadyLinked) {
            const maxOrder = await prisma.eventTypeSubjectType.aggregate({
                where: { event_type_id: weddingET.id },
                _max: { order_index: true },
            });
            await prisma.eventTypeSubjectType.create({
                data: {
                    event_type_id: weddingET.id,
                    subject_type_template_id: templateId,
                    order_index: (maxOrder._max.order_index ?? -1) + 1,
                    is_default: true,
                },
            });
            console.log(`     ↳ Linked to Wedding event type`);
            linkedCount++;
        } else {
            console.log(`     ↳ Already linked to Wedding`);
        }
    }

    console.log(`\n📊 Summary: ${createdCount} created, ${skippedCount} skipped, ${linkedCount} linked`);
    console.log('✅ Done!\n');
}

main()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
