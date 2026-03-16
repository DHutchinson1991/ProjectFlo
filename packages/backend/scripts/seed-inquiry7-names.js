/**
 * Seed inquiry 7 with real Shropshire locations, addresses, and subject real names.
 * Also updates the contact name to match the bride.
 * Idempotent — overwrites location/subject data to ensure consistency.
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const INQUIRY_ID = 7;

  // Location slots — real Shropshire venues with full addresses
  // Looked up by inquiry_id + location_number (not hardcoded IDs)
  const slotUpdates = [
    { location_number: 1, name: 'Iscoyd Park', address: 'Iscoyd Park, Whitchurch, Shropshire, SY13 3AT' },
    { location_number: 2, name: 'St Chad\'s Church', address: 'St Chad\'s Terrace, Shrewsbury, Shropshire, SY1 1JX' },
    { location_number: 3, name: 'The Lion Hotel', address: '49-50 Wyle Cop, Shrewsbury, Shropshire, SY1 1XJ' },
  ];

  const allSlots = await prisma.projectLocationSlot.findMany({
    where: { inquiry_id: INQUIRY_ID },
    orderBy: { location_number: 'asc' },
  });

  for (const upd of slotUpdates) {
    const slot = allSlots.find(s => s.location_number === upd.location_number);
    if (!slot) { console.log(`Slot #${upd.location_number} not found — skipping`); continue; }
    await prisma.projectLocationSlot.update({ where: { id: slot.id }, data: { name: upd.name, address: upd.address } });
    console.log(`Slot #${upd.location_number} (id ${slot.id}) → "${upd.name}" (${upd.address})`);
  }

  // Subject real names — looked up by inquiry_id + role name
  const subjectUpdates = [
    { role: 'Bride', real_name: 'Emily Thompson' },
    { role: 'Groom', real_name: 'James Hutchinson' },
    { role: 'Maid of Honor', real_name: 'Sarah Davis' },
  ];

  const allSubjects = await prisma.projectEventDaySubject.findMany({
    where: { inquiry_id: INQUIRY_ID },
    orderBy: { order_index: 'asc' },
  });

  for (const upd of subjectUpdates) {
    const subject = allSubjects.find(s => s.name === upd.role);
    if (!subject) { console.log(`Subject "${upd.role}" not found — skipping`); continue; }
    await prisma.projectEventDaySubject.update({ where: { id: subject.id }, data: { real_name: upd.real_name } });
    console.log(`Subject "${upd.role}" (id ${subject.id}) → "${upd.real_name}"`);
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
