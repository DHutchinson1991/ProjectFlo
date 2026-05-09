/**
 * One-off: Clear stale subject_ids from CameraSubjectAssignment records
 * for the Moonrise Ceremony Package film moments.
 *
 * Usage: cd packages/backend && npx tsx scripts/clear-stale-subject-ids.ts
 */
import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  try {
    // Find all camera assignments that have subject_ids set
    const assignments = await prisma.cameraSubjectAssignment.findMany({
      where: { subject_ids: { isEmpty: false } },
      include: {
        recording_setup: {
          include: { moment: { select: { id: true, name: true } } },
        },
        track: { select: { name: true } },
      },
    });

    console.log(`Found ${assignments.length} camera assignments with subject_ids`);

    for (const a of assignments) {
      const momentName = a.recording_setup?.moment?.name ?? 'unknown';
      const trackName = a.track?.name ?? 'unknown';
      console.log(`  Assignment ${a.id} (${trackName} on "${momentName}"): subject_ids=${JSON.stringify(a.subject_ids)} → clearing`);

      await prisma.cameraSubjectAssignment.update({
        where: { id: a.id },
        data: { subject_ids: [] },
      });
    }

    console.log('\n✅ All stale subject_ids cleared. Re-run AI Director to repopulate.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
