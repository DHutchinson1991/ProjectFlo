/**
 * One-off backfill: create PackageSpaceSlots for existing packages that have none.
 * Run: cd packages/backend && npx ts-node scripts/backfill-space-slots.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Map: wedding-type location name → space labels to seed
const SPACES_BY_LOCATION: Record<string, string[]> = {
  "Bride's Getting Ready Location": ['Bridal Suite'],
  "Groom's Getting Ready Location": ["Groom's Room"],
  'Ceremony Venue': ['Ceremony Space'],
  'Reception Venue/Marquee': ['Reception Hall'],
  'Photo Locations (Garden/Grounds)': ['Photo Area'],
};

async function main() {
  const brandId = 1; // Moonrise Films
  const weddingDay = await prisma.eventDay.findFirst({ where: { brand_id: brandId, name: 'Wedding Day' } });
  if (!weddingDay) { console.log('No Wedding Day event day found'); return; }

  const weddingType = await prisma.eventSubtype.findFirst({
    where: { name: '🇬🇧 Traditional British Wedding' },
    include: {
      locations: { orderBy: { order_index: 'asc' } },
      activities: {
        orderBy: { order_index: 'asc' },
        include: { activity_locations: true },
      },
    },
  });
  if (!weddingType) { console.log('No Traditional British Wedding type found'); return; }

  console.log(`Wedding type: ${weddingType.name}, ${weddingType.locations.length} locations`);
  console.log('Locations:', weddingType.locations.map((l, i) => `[${i}] ${l.name}`).join(', '));

  // Find all Moonrise packages
  const packages = await prisma.service_packages.findMany({
    where: { brand_id: brandId },
  });

  for (const pkg of packages) {
    const existingSpaces = await prisma.packageSpaceSlot.count({ where: { package_id: pkg.id } });
    if (existingSpaces > 0) {
      console.log(`  ⏭️ "${pkg.name}" (id ${pkg.id}) — already has ${existingSpaces} spaces`);
      continue;
    }

    const locationSlots = await prisma.packageLocationSlot.findMany({
      where: { package_id: pkg.id },
      include: { activity_assignments: { include: { package_activity: true } } },
      orderBy: { location_number: 'asc' },
    });

    if (locationSlots.length === 0) {
      console.log(`  ⏭️ "${pkg.name}" (id ${pkg.id}) — no location slots`);
      continue;
    }

    console.log(`\n📦 "${pkg.name}" (id ${pkg.id}) — ${locationSlots.length} location slot(s)`);

    // Build a map: activity name → WT location names
    const activityLocationMap = new Map<string, string[]>();
    for (const wtActivity of weddingType.activities) {
      const locNames: string[] = [];
      for (const al of wtActivity.activity_locations) {
        const wtLoc = weddingType.locations.find((l: any) => l.id === al.wedding_type_location_id);
        if (wtLoc) locNames.push(wtLoc.name);
      }
      activityLocationMap.set(wtActivity.name, locNames);
    }

    // For each location slot, find its assigned activities, look up which WT
    // location those activities map to, and use the first match to pick spaces
    for (const locSlot of locationSlots) {
      const activityNames = locSlot.activity_assignments.map((a: any) => a.package_activity.name as string);

      // Find which WT location name most activities in this slot belong to
      const locNameCounts = new Map<string, number>();
      for (const actName of activityNames) {
        for (const locName of (activityLocationMap.get(actName) ?? [])) {
          locNameCounts.set(locName, (locNameCounts.get(locName) ?? 0) + 1);
        }
      }
      const bestLocName = [...locNameCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
      const spaceLabels = bestLocName ? (SPACES_BY_LOCATION[bestLocName] ?? []) : [];

      console.log(`  Location slot ${locSlot.id} (location_number ${locSlot.location_number})`);
      console.log(`    Activities: [${activityNames.join(', ')}]`);
      console.log(`    Best WT location match: "${bestLocName}" → spaces: [${spaceLabels.join(', ')}]`);

      for (const label of spaceLabels) {
        const space = await prisma.packageSpaceSlot.create({
          data: {
            package_id: pkg.id,
            event_day_template_id: weddingDay.id,
            label,
            location_slot_id: locSlot.id,
          },
        });
        console.log(`    ✅ Created space "${label}" (id ${space.id})`);

        for (const aa of locSlot.activity_assignments) {
          await prisma.spaceActivityAssignment.create({
            data: { package_space_slot_id: space.id, package_activity_id: aa.package_activity_id },
          });
          console.log(`      → Assigned activity "${aa.package_activity.name}"`);
        }
      }
    }
  }

  console.log('\n✅ Done!');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
