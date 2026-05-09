import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/** 
 * Updated moment descriptions — action-focused, no location details.
 * Location context comes from the background plate + locationHint.
 * Subject references use template vars so prompt builder can resolve/filter.
 */
const UPDATES: Record<number, string> = {
  7:  'guests walking between rows of seats, finding their places, the space half-filled, people chatting quietly',
  8:  '{{bride}} in white wedding dress standing alone behind a closed door, holding bouquet nervously, hidden from view, seen from behind',
  9:  'officiant standing at the front addressing seated guests, {{groom}} standing to one side nearby',
  10: '{{groom}} in suit walking down the aisle alone toward the front, best man waiting ahead, rows of seated guests watching',
  11: 'bridesmaids in matching dresses walking single-file down the aisle, groomsmen standing at the front, seated guests watching',
  12: '{{bride}} in white wedding dress walking down the aisle holding {{father_of_bride}}\'s arm, all guests standing and turned to look, {{groom}} visible at the far end',
  13: '{{father_of_bride}} placing {{bride}}\'s hand into {{groom}}\'s hand, an emotional handover moment, close family watching',
  14: 'officiant speaking, {{bride}} and {{groom}} standing face to face before the officiant, guests seated behind them',
  15: 'a family member standing at a lectern reading aloud from a book, {{bride}} and {{groom}} listening nearby',
  16: '{{bride}} and {{groom}} standing face to face, {{bride}} reading from a small piece of paper, emotional intimate moment',
  17: '{{groom}} sliding a ring onto {{bride}}\'s finger, both hands visible in close detail, the officiant watching from behind',
  18: '{{bride}} and {{groom}} together lighting a unity candle, two smaller candles on either side, warm candlelight glow',
  19: 'officiant raising hands in declaration, {{bride}} and {{groom}} holding hands facing the officiant, guests seated behind them',
  20: '{{bride}} and {{groom}} kissing, guests erupting in applause in the background, joyful emotional moment',
  21: '{{bride}} and {{groom}} walking hand-in-hand back up the aisle smiling, guests standing and clapping on both sides',
  22: '{{bride}} and {{groom}} exiting through doors as guests throw confetti and petals into the air, bright daylight',
  23: '{{bride}} and {{groom}} standing outside greeting guests one by one, hugs and handshakes, crowd gathered around them',
};

async function main() {
  for (const [id, description] of Object.entries(UPDATES)) {
    await prisma.sceneMoment.update({
      where: { id: Number(id) },
      data: { description },
    });
    console.log(`Updated ${id}`);
  }
  console.log(`Done — ${Object.keys(UPDATES).length} descriptions updated`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
