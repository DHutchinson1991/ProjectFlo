const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const inquiries = await prisma.inquiries.findMany({
    orderBy: { created_at: 'desc' },
    take: 10,
    select: {
      id: true,
      created_at: true,
      updated_at: true,
      status: true,
      contact: { select: { first_name: true, last_name: true } },
    },
  });

  console.log('\n=== Recent Inquiries — Raw Timestamps ===\n');
  for (const inq of inquiries) {
    const name = [inq.contact?.first_name, inq.contact?.last_name].filter(Boolean).join(' ') || '(no name)';
    console.log(`  ID ${inq.id}  |  ${name}`);
    console.log(`    created_at (UTC): ${inq.created_at.toISOString()}`);
    console.log(`    created_at (local): ${inq.created_at.toLocaleString()}`);
    console.log(`    updated_at (UTC): ${inq.updated_at.toISOString()}`);
    console.log(`    status: ${inq.status}`);
    console.log('');
  }
}

main()
  .catch((err) => { console.error('Error:', err); process.exit(1); })
  .finally(() => prisma.$disconnect());
