import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1. Create SubjectRole for Officiant (or reuse if already exists)
  let role = await prisma.subjectRole.findFirst({ where: { role_name: 'Officiant', brand_id: 1 } });
  if (!role) {
    role = await prisma.subjectRole.create({
      data: { role_name: 'Officiant', is_group: false, brand_id: 1 },
    });
    console.log(`Created role: ${role.id} ${role.role_name}`);
  } else {
    console.log(`Role already exists: ${role.id} ${role.role_name}`);
  }

  // 2. Create PackageDaySubject for package 9
  const eventDay = await prisma.packageEventDay.findFirst({ where: { package_id: 9 } });
  if (!eventDay) throw new Error('No event day for package 9');

  const sub = await prisma.packageDaySubject.create({
    data: {
      package: { connect: { id: 9 } },
      event_day: { connect: { id: eventDay.id } },
      name: 'Officiant',
      role_template: { connect: { id: role.id } },
    },
  });
  console.log(`Created subject: ${sub.id} ${sub.name}`);

  // 3. Add officiant to Camera 1 (wide shot) for ceremony moments where they appear
  const momentIds = [9, 14, 15, 16, 17, 19]; // Officiant Welcome, Opening Remarks, Readings, Vows, Ring Exchange, Pronouncement
  for (const mId of momentIds) {
    const setups = await prisma.momentRecordingSetup.findMany({
      where: { moment_id: mId },
      include: { camera_assignments: { orderBy: { id: 'asc' } } },
    });
    for (const setup of setups) {
      const cam1 = setup.camera_assignments[0];
      if (cam1 && cam1.subject_ids.indexOf(sub.id) === -1) {
        const newIds = [...cam1.subject_ids, sub.id];
        await prisma.cameraSubjectAssignment.update({
          where: { id: cam1.id },
          data: { subject_ids: newIds },
        });
        const moment = await prisma.sceneMoment.findUnique({ where: { id: mId }, select: { name: true } });
        console.log(`  Added officiant to ${moment?.name} Camera 1 (id: ${cam1.id})`);
      }
    }
  }

  console.log('Done!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
