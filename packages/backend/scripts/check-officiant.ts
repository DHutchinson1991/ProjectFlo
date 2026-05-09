import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Add activity assignment for Officiant to Ceremony (activity 69)
  const existing = await prisma.packageDaySubjectActivity.findFirst({
    where: { package_day_subject_id: 124, package_activity_id: 69 },
  });
  if (!existing) {
    const a = await prisma.packageDaySubjectActivity.create({
      data: { package_day_subject_id: 124, package_activity_id: 69 },
    });
    console.log('Created activity assignment:', a.id);
  } else {
    console.log('Activity assignment already exists:', existing.id);
  }

  // Set order_index
  await prisma.packageDaySubject.update({ where: { id: 124 }, data: { order_index: 13 } });
  console.log('Updated order_index to 13');
}

main().catch(console.error).finally(() => prisma.$disconnect());
