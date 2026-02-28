
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const layers = await prisma.timelineLayer.findMany();
  console.log(JSON.stringify(layers, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
