/**
 * Seed inquiry 7 with real Shropshire locations, addresses, and subject real names.
 * Also updates the contact name to match the bride.
 * Idempotent — overwrites location/subject data to ensure consistency.
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Location slots — real Shropshire venues with full addresses
  const slotUpdates = [
    { id: 44, name: 'St Chad\'s Church', address: 'St Chad\'s Terrace, Shrewsbury, Shropshire, SY1 1JX' },
    { id: 45, name: 'Iscoyd Park', address: 'Iscoyd Park, Whitchurch, Shropshire, SY13 3AT' },
    { id: 46, name: 'The Lion Hotel', address: '49-50 Wyle Cop, Shrewsbury, Shropshire, SY1 1XJ' },
  ];

  for (const { id, name, address } of slotUpdates) {
    const slot = await prisma.projectLocationSlot.findUnique({ where: { id }, select: { id: true } });
    if (!slot) { console.log(`Slot ${id} not found — skipping`); continue; }
    await prisma.projectLocationSlot.update({ where: { id }, data: { name, address } });
    console.log(`Slot ${id} → "${name}" (${address})`);
  }

  // Subject real names
  const subjectUpdates = [
    { id: 105, real_name: 'Emily Thompson' },  // Bride
    { id: 106, real_name: 'James Hutchinson' }, // Groom
    { id: 110, real_name: 'Sarah Davis' },      // Maid of Honor
  ];

  for (const { id, real_name } of subjectUpdates) {
    const subject = await prisma.projectEventDaySubject.findUnique({ where: { id }, select: { id: true, name: true } });
    if (!subject) { console.log(`Subject ${id} not found — skipping`); continue; }
    await prisma.projectEventDaySubject.update({ where: { id }, data: { real_name } });
    console.log(`Subject ${id} (${subject.name}) → "${real_name}"`);
  }

  // Update contact name to bridal name
  const inquiry = await prisma.inquiries.findUnique({ where: { id: 7 }, select: { contact_id: true } });
  if (inquiry) {
    await prisma.contacts.update({
      where: { id: inquiry.contact_id },
      data: { first_name: 'Emily', last_name: 'Thompson' },
    });
    console.log(`Contact ${inquiry.contact_id} → "Emily Thompson" (Bride)`);
  }

  console.log('\nDone!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
