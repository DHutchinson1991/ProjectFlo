/**
 * Backfill moment descriptions from the knowledge base seed definitions
 * into both MomentKnowledgeEntry and PackageActivityMoment rows.
 *
 * Safe to run multiple times — only updates rows with null descriptions.
 *
 * Usage: npx ts-node scripts/backfill-moment-descriptions.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ── Description map: moment name → description ──────────────────────
// Must match the seed data exactly.
const DESCRIPTIONS: Record<string, string> = {
  // Getting Ready
  "Bride's Hair & Makeup": 'Professional stylist applies hair and makeup while bridesmaids get ready nearby.',
  'Bride Getting Dressed': 'Bride steps into her wedding dress with help from mother and bridesmaids.',
  'Groom Getting Ready': 'Groom puts on suit, adjusts tie and cufflinks.',
  'Final Touches & Veil': 'Mother places the veil and makes last adjustments to the dress.',
  'Bridesmaids Preparation': 'Bridesmaids get into matching dresses and help each other with accessories.',
  'Father of Bride Reaction': 'Father sees the bride in her dress for the first time.',

  // Ceremony Traditional
  'Guest Seating': 'Guests arrive and are directed to their seats while the groom waits at the altar.',
  'Groom Takes Position': 'Groom walks to the altar with the best man and groomsmen line up.',
  'Bridal Party Processional': 'Bridesmaids, flower girl and ring bearer walk down the aisle before the bride.',
  'Bride Arrival': 'Bride arrives at the venue and prepares to walk down the aisle with her father.',
  'Bride Entrance': 'Bride walks down the aisle arm-in-arm with her father as the groom sees her for the first time.',
  'Giving Away': "Father lifts the veil and places the bride's hand in the groom's.",
  'Officiant Welcome': 'Officiant opens the ceremony and welcomes the congregation.',
  'Opening Remarks': 'Officiant speaks about love and commitment to the couple and guests.',
  'Readings': 'Selected readings or poems are shared by members of the wedding party.',
  'Vows Exchange': 'Bride and groom face each other and read their vows.',
  'Ring Exchange': 'Best man presents the rings and the couple exchange wedding bands.',
  'Unity Ceremony': 'Couple performs a symbolic unity ritual such as lighting a candle or pouring sand.',
  'Pronouncement': 'Officiant declares the couple officially married.',
  'First Kiss': 'The couple share their first kiss as a married couple.',
  'Recessional': 'Couple walks back down the aisle together followed by the wedding party.',
  'Confetti & Celebration': 'Guests shower the couple with confetti as they exit the venue.',
  'Receiving Line': 'Couple greets each guest personally outside the venue.',

  // Confetti & Photos
  'Confetti Moment': 'Guests line up and throw confetti over the couple.',
  'Couple Portraits': 'Bride and groom pose for formal couple portraits in the venue grounds.',
  'Bridal Party Portraits': 'Group photos with bridesmaids and groomsmen.',
  'Family Portraits': 'Formal family group photos with both sides of the family.',

  // Reception Entry
  'Grand Entrance': 'Newlyweds are announced and enter the reception to applause.',
  'Welcome Drinks': 'Guests mingle and enjoy drinks while the couple greets everyone.',
  'Table Seating': 'Guests find their assigned tables and take their seats for dinner.',

  // Formal Dinner
  'Starters Served': 'First course is served and guests begin their meal.',
  'Main Course': 'Main course is served. Relaxed table conversation throughout.',
  'Dessert Service': 'Dessert is served as guests relax between courses.',

  // Cake Cut & Speeches
  'Cake Cutting': 'Couple cuts the wedding cake together.',
  'Best Man Speech': 'Best man delivers his speech, typically with stories and humour.',
  'Father of Bride Speech': 'Father of the bride shares memories and welcomes the groom to the family.',
  'Groom Speech': 'Groom thanks guests and family, and speaks about the bride.',

  // First Dance & Evening
  'First Dance': 'Couple takes the dance floor for their first dance as a married couple.',
  'Parent Dances': 'Bride dances with her father, groom dances with his mother.',
  'Open Dancing': 'Dance floor opens to all guests for the evening.',
  'Sparkler Exit': 'Guests form a sparkler tunnel for the couple to walk through as they leave.',

  // Civil
  'Welcome & Declarations': 'Registrar welcomes guests and the couple make their legal declarations.',
  'Vows & Ring Exchange': 'Couple exchange vows and wedding rings.',
  'Signing of Register': 'Couple and witnesses sign the marriage register.',
  'First Kiss & Exit': 'Couple share their first kiss and exit the ceremony room together.',

  // Indian
  'Baraat Procession': 'Groom arrives in a lively procession with music, dancing, and family.',
  'Bride & Groom Meet': 'Couple see each other for the first time, often with a Jaimala garland exchange.',
  'Rituals & Vows': 'Core ceremony rituals performed around the sacred fire under the Mandap.',
  'First Circumambulation': 'Couple walk around the sacred fire together during the Pheras.',
  'Final Blessings': 'Elders and priest give their blessings to the newly married couple.',

  // Mehndi
  'Henna Application Start': 'Henna artist begins applying designs to the bride and guests.',
  "Bride's Extended Henna": 'Bride receives intricate henna designs on hands and feet.',
  'Guest Henna Application': 'Guests have simpler henna designs applied while socialising.',
  'Dancing & Celebration': 'Music and dancing as guests celebrate together.',

  // Pakistani
  'Baraat Procession Arrival': 'Groom arrives with his family in a festive procession.',
  'Traditional Welcome': "Bride's family formally welcomes the groom and his family.",
  'Bride First Appearance': 'Bride makes her first appearance to the groom and guests.',
  'Family Rituals': 'Traditional family rituals and blessings are performed.',
  "Couple's Reaction": 'Couple share their first private moment together after the ceremony.',

  // Reception Generic
  'Guest Arrival & Seating': 'Guests arrive at the reception venue and find their tables.',
  "Couple's Entry": 'Couple are announced and make their entrance to the reception.',
  'Welcome Speeches': 'Opening speeches welcome guests and set the tone for the evening.',
  'Dinner Service': 'Main dinner is served and guests enjoy their meal.',

  // Intimate
  'Guests Gather': 'Small group of guests gather at the ceremony spot.',
  'Personal Vows': 'Couple share personal, self-written vows with each other.',
  'Celebration': 'Guests congratulate the couple with hugs and well-wishes.',
};

async function main() {
  console.log('Backfilling moment descriptions…\n');

  // 1. Update MomentKnowledgeEntry rows
  let kbUpdated = 0;
  for (const [name, description] of Object.entries(DESCRIPTIONS)) {
    const result = await prisma.momentKnowledgeEntry.updateMany({
      where: { name, description: null },
      data: { description },
    });
    kbUpdated += result.count;
  }
  console.log(`  Knowledge base entries updated: ${kbUpdated}`);

  // 2. Update PackageActivityMoment rows (existing moments in packages)
  let momentUpdated = 0;
  for (const [name, description] of Object.entries(DESCRIPTIONS)) {
    const result = await prisma.packageActivityMoment.updateMany({
      where: { name, description: null },
      data: { description },
    });
    momentUpdated += result.count;
  }
  console.log(`  Package activity moments updated: ${momentUpdated}`);

  console.log('\nDone.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
