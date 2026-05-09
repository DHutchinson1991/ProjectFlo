import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const guestSeating = await prisma.sceneMoment.findMany({
    where: { name: 'Guest Seating' },
    include: {
      subjects: {
        include: { subject: { include: { role_template: true } } },
      },
      film_scene: {
        include: {
          package_schedules: {
            include: { package_activity: { select: { id: true, name: true } } },
          },
        },
      },
    },
  });

  for (const m of guestSeating) {
    const sched = m.film_scene.package_schedules.find((s: any) => s.package_activity_id != null);
    console.log(`Moment: ${m.id} "${m.name}" | Scene: ${m.film_scene_id} | Activity: ${sched?.package_activity?.name ?? 'NONE'}`);
    console.log(`  source_activity_id: ${m.source_activity_id}`);
    for (const ms of m.subjects) {
      const role = ms.subject.role_template?.role_name ?? 'NO_TEMPLATE';
      const desc = ms.action_description ? ms.action_description.substring(0, 60) : 'NULL';
      console.log(`  Subject ${ms.subject_id} "${ms.subject.name}" | role: "${role}" | action: ${desc}`);
    }
  }

  await prisma.$disconnect();
}

check();
