/**
 * Restore missing package sets for brands that have enabled service types
 * but no corresponding package sets (e.g., user deleted them).
 *
 * Usage: node scripts/restore-package-sets.js
 * Run from packages/backend directory.
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const EMOJI_MAP = { WEDDING: '💒', BIRTHDAY: '🎂', ENGAGEMENT: '💍' };
const NAME_MAP = { WEDDING: 'Wedding', BIRTHDAY: 'Birthday', ENGAGEMENT: 'Engagement' };
const SLOT_TIERS = ['Budget', 'Basic', 'Standard', 'Premium'];

async function main() {
    // Find all brands with service types
    const brands = await prisma.brands.findMany({
        where: { service_types: { isEmpty: false } },
        select: { id: true, name: true, service_types: true },
    });

    console.log(`Found ${brands.length} brand(s) with service types enabled.\n`);

    for (const brand of brands) {
        console.log(`\n=== Brand: ${brand.name} (ID: ${brand.id}) ===`);
        console.log(`  Service types: ${brand.service_types.join(', ')}`);

        for (const key of brand.service_types) {
            const name = NAME_MAP[key];
            if (!name) { console.log(`  ⚠️ Unknown service type: ${key}`); continue; }

            // Find the event type for this brand by name
            const eventType = await prisma.eventType.findFirst({
                where: { brand_id: brand.id, name: name },
            });
            if (!eventType) {
                console.log(`  ⚠️ No EventType found for ${key} — skipping`);
                continue;
            }

            // Check if a package set already exists
            const existing = await prisma.package_sets.count({
                where: { brand_id: brand.id, event_type_id: eventType.id },
            });
            if (existing > 0) {
                console.log(`  ✅ ${name}: ${existing} set(s) already exist`);
                continue;
            }

            // Find or create category
            let category = await prisma.service_package_categories.findFirst({
                where: { brand_id: brand.id, event_type_id: eventType.id },
            });
            if (!category) {
                category = await prisma.service_package_categories.findFirst({
                    where: { brand_id: brand.id, name: { contains: name, mode: 'insensitive' }, event_type_id: null },
                });
                if (category) {
                    await prisma.service_package_categories.update({
                        where: { id: category.id },
                        data: { event_type_id: eventType.id },
                    });
                } else {
                    category = await prisma.service_package_categories.create({
                        data: { brand_id: brand.id, name, description: `${name} packages`, order_index: 0, is_active: true, event_type_id: eventType.id },
                    });
                }
            }

            // Create the package set
            const set = await prisma.package_sets.create({
                data: {
                    brand_id: brand.id,
                    name: `${name} Packages`,
                    description: `Our ${name.toLowerCase()} packages`,
                    emoji: EMOJI_MAP[key] || '📦',
                    category_id: category.id,
                    event_type_id: eventType.id,
                    is_active: true,
                    order_index: 0,
                },
            });

            // Create 4 tier slots
            for (let i = 0; i < SLOT_TIERS.length; i++) {
                await prisma.package_set_slots.create({
                    data: { package_set_id: set.id, slot_label: SLOT_TIERS[i], order_index: i },
                });
            }

            console.log(`  🔧 ${name}: Created set "${set.name}" (ID: ${set.id}) with ${SLOT_TIERS.length} slots`);
        }
    }

    console.log('\n✅ Done!');
}

main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
