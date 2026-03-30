/**
 * One-off patch: create PackageCrewSlotActivity junction records for any
 * package that has crew slots and activities but is missing the links.
 * Run with: npx ts-node -r tsconfig-paths/register scripts/patch-crew-slot-activities.ts
 */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    // Fetch all packages that have at least one crew slot
    const packages = await prisma.service_packages.findMany({
        include: {
            package_crew_slots: { select: { id: true } },
            package_activities: { select: { id: true } },
        },
    });

    let created = 0;
    let skipped = 0;

    for (const pkg of packages) {
        for (const slot of pkg.package_crew_slots) {
            for (const activity of pkg.package_activities) {
                try {
                    await prisma.packageCrewSlotActivity.create({
                        data: { package_crew_slot_id: slot.id, package_activity_id: activity.id },
                    });
                    created++;
                } catch {
                    // @@unique constraint violation = already exists
                    skipped++;
                }
            }
        }
    }

    console.log(`Done — created: ${created}, already existed: ${skipped}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
