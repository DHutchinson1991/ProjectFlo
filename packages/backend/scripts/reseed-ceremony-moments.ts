/**
 * Reseed ceremony moment descriptions for film 10 (package 9)
 * with visually descriptive, AI-prompt-friendly text.
 *
 * Also fills in missing Camera 2 shot types and subject assignments.
 *
 * Run: npx tsx packages/backend/scripts/reseed-ceremony-moments.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Subject IDs for package 9
const BRIDE = 111;
const GROOM = 112;
const BEST_MAN = 113;
const MAID_OF_HONOR = 114;
const FATHER_OF_BRIDE = 115;
const MOTHER_OF_BRIDE = 116;
const FATHER_OF_GROOM = 117;
const MOTHER_OF_GROOM = 118;
const BRIDESMAIDS = 119;
const GROOMSMEN = 120;
const FLOWER_GIRL = 121;
const RING_BEARER = 122;
const GUESTS = 123;

// ── Moment descriptions ──
// Each is a SHORT visual scene description that tells SD exactly what to draw.
// Format: who is doing what, where they are physically, key visual details.
const MOMENT_UPDATES: Record<number, { description: string }> = {
  // Guest Seating (id 7)
  7: {
    description:
      'ceremony venue interior, rows of wooden pews filling with guests, soft chatter, sunlight through stained glass windows, altar decorated with flowers at the far end',
  },
  // Bride Arrival (id 8)
  8: {
    description:
      'bridal car pulling up outside the venue entrance, doors about to open, anticipation building inside the ceremony space, guests seated and waiting',
  },
  // Officiant Welcome (id 9)
  9: {
    description:
      'ceremony altar area, officiant at the front addressing the congregation, all guests seated in pews, church interior, warm atmosphere',
  },
  // Groom Takes Position (id 10)
  10: {
    description:
      'centre aisle of the ceremony space, all eyes forward, best man and groomsmen taking their places at the altar, guests seated quietly',
  },
  // Bridal Party Processional (id 11)
  11: {
    description:
      'centre aisle procession, bridal party walking single-file toward the altar, seated guests watching from both sides, soft music playing',
  },
  // Bride Entrance (id 12)
  12: {
    description:
      'centre aisle from the entrance, all guests standing and turned to look back, ceremony space fully lit, altar visible at the far end',
  },
  // Giving Away (id 13)
  13: {
    description:
      'altar area, emotional handover moment, close family in the front row watching intently, bridal party standing to either side',
  },
  // Opening Remarks (id 14)
  14: {
    description:
      'altar area, officiant addressing the congregation, couple standing before them, bridal party flanking the altar, guests seated in pews',
  },
  // Readings (id 15)
  15: {
    description:
      'lectern at the front of the ceremony space, a reading being delivered to the congregation, quiet attentive atmosphere, church interior',
  },
  // Vows Exchange (id 16)
  16: {
    description:
      'altar area, intimate face-to-face moment, couple standing close together, hushed congregation, emotional atmosphere throughout',
  },
  // Ring Exchange (id 17)
  17: {
    description:
      'altar area, close detail of hands and rings, officiant standing just behind, bridal party looking on, quiet anticipation',
  },
  // Unity Ceremony (id 18)
  18: {
    description:
      'altar table with unity candle arrangement, two smaller candles on either side, warm candlelight glow, congregation watching quietly',
  },
  // Pronouncement (id 19)
  19: {
    description:
      'altar area, officiant making a declaration with raised hands, congregation leaning forward in anticipation, bridal party smiling',
  },
  // First Kiss (id 20)
  20: {
    description:
      'altar area, congregation erupting in applause and cheering, joyful emotional moment, bridal party celebrating to either side',
  },
  // Recessional (id 21)
  21: {
    description:
      'centre aisle, bridal party following the couple back toward the exit, guests standing and clapping on both sides, joyful energy',
  },
  // Confetti & Celebration (id 22)
  22: {
    description:
      'venue entrance and steps outside, confetti and petals filling the air, bright outdoor daylight, crowd gathered on both sides cheering',
  },
  // Receiving Line (id 23)
  23: {
    description:
      'outside the venue, a line of the bridal party greeting guests one by one, hugs and handshakes, crowd gathered in the open air',
  },
};

// ── Camera 2 assignments to fix (currently null shotType, empty subjects) ──
// Each moment has 2 recording setups. Camera 1 (first) has data, Camera 2 (second) needs filling.
// Format: momentId → { shotType, subjectIds } for Camera 2
const CAM2_FIXES: Record<number, { shotType: string; subjectIds: number[] }> = {
  // Groom Takes Position: cam2 = CU of groom's face (nervous anticipation)
  10: { shotType: 'CLOSE_UP', subjectIds: [GROOM] },
  // Bridal Party Processional: cam2 = MS of bridesmaids walking
  11: { shotType: 'MEDIUM_SHOT', subjectIds: [BRIDESMAIDS, MAID_OF_HONOR] },
  // Bride Entrance: cam2 = CU of groom's reaction seeing bride
  12: { shotType: 'CLOSE_UP', subjectIds: [GROOM] },
  // Giving Away: cam2 = CU of bride's face, emotional
  13: { shotType: 'CLOSE_UP', subjectIds: [BRIDE] },
  // Opening Remarks: cam2 = MS of officiant speaking
  14: { shotType: 'MEDIUM_SHOT', subjectIds: [BRIDE, GROOM] },
  // Readings: cam2 = CU of bride listening (reaction)
  15: { shotType: 'REACTION_SHOT', subjectIds: [BRIDE, GROOM] },
  // Vows Exchange: cam2 = CU of the one listening (groom when bride speaks)
  16: { shotType: 'CLOSE_UP', subjectIds: [GROOM] },
  // Ring Exchange: cam2 = DETAIL of hands and ring
  17: { shotType: 'DETAIL_SHOT', subjectIds: [BRIDE, GROOM] },
  // Unity Ceremony: cam2 = CU of hands with candle
  18: { shotType: 'CLOSE_UP', subjectIds: [BRIDE, GROOM] },
  // Pronouncement: cam2 = MS of couple reacting
  19: { shotType: 'MEDIUM_SHOT', subjectIds: [BRIDE, GROOM] },
  // First Kiss: cam2 = CU of the kiss
  20: { shotType: 'CLOSE_UP', subjectIds: [BRIDE, GROOM] },
  // Recessional: cam2 = MS from front as they walk toward camera
  21: { shotType: 'MEDIUM_SHOT', subjectIds: [BRIDE, GROOM] },
  // Confetti & Celebration: cam2 = CU of couple's faces laughing
  22: { shotType: 'CLOSE_UP', subjectIds: [BRIDE, GROOM] },
  // Receiving Line: cam2 = CU of bride hugging a guest
  23: { shotType: 'CLOSE_UP', subjectIds: [BRIDE] },
};

async function main() {
  console.log('=== Updating ceremony moment descriptions (film 10) ===\n');

  for (const [idStr, data] of Object.entries(MOMENT_UPDATES)) {
    const id = parseInt(idStr);
    const updated = await prisma.sceneMoment.update({
      where: { id },
      data: { description: data.description },
      select: { id: true, name: true, description: true },
    });
    console.log(`✓ [${updated.id}] ${updated.name}: "${updated.description}"`);
  }

  console.log('\n=== Fixing Camera 2 assignments ===\n');

  for (const [momentIdStr, fix] of Object.entries(CAM2_FIXES)) {
    const momentId = parseInt(momentIdStr);

    // Find the recording setup for this moment that has the null-shotType camera assignment
    const setups = await prisma.momentRecordingSetup.findMany({
      where: { moment_id: momentId },
      include: { camera_assignments: { orderBy: { id: 'asc' } } },
    });

    for (const setup of setups) {
      // Find the camera assignment with null shot_type (Camera 2)
      const cam2 = setup.camera_assignments.find((ca) => ca.shot_type === null);
      if (cam2) {
        await prisma.cameraSubjectAssignment.update({
          where: { id: cam2.id },
          data: {
            shot_type: fix.shotType as any,
            subject_ids: fix.subjectIds,
          },
        });
        const moment = await prisma.sceneMoment.findUnique({ where: { id: momentId }, select: { name: true } });
        console.log(`✓ [${moment?.name}] Camera 2 → ${fix.shotType}, subjects: [${fix.subjectIds.join(',')}]`);
      }
    }
  }

  console.log('\nDone!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
