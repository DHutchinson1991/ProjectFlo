const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const activities = await prisma.packageActivity.findMany({
    include: {
      moments: { orderBy: { order_index: 'asc' } },
      package_event_day: true,
    },
    orderBy: [{ package_event_day_id: 'asc' }, { order_index: 'asc' }],
  });

  for (const a of activities) {
    const totalMomentSec = a.moments.reduce((s, m) => s + m.duration_seconds, 0);
    const actDurMin = a.duration_minutes || 0;
    const startTime = a.start_time || '??:??';
    const endTime = a.end_time || '??:??';
    console.log(`\nActivity: ${a.name} (ID: ${a.id}, Day: ${a.package_event_day.name})`);
    console.log(`  Time: ${startTime} - ${endTime}, Duration: ${actDurMin} min`);
    console.log(`  Moments: ${a.moments.length}, Total moment duration: ${totalMomentSec}s (${Math.round(totalMomentSec / 60)} min)`);
    if (a.moments.length > 0) {
      a.moments.forEach((m) =>
        console.log(`    [${m.order_index}] ${m.name} - ${m.duration_seconds}s (${Math.round(m.duration_seconds / 60)}min) ${m.is_required ? '★' : ''}`)
      );
    }
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); });
