import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
async function main() {
  const m = await p.sceneMoment.findMany({
    where: { film_scene: { film_id: 10 } },
    orderBy: { order_index: 'asc' },
    select: { id: true, name: true, description: true },
  });
  m.forEach((r) => console.log(`${r.id} ${r.name} | ${r.description}`));
}
main().catch(console.error).finally(() => p.$disconnect());
