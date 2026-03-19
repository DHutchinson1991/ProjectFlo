/**
 * Data migration: map legacy inquiry status `Contacted` to `Qualified`.
 *
 * Usage:
 *   node scripts/migrate-inquiry-statuses-qualified.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    const existing = await prisma.inquiries.count({
        where: { status: 'Contacted' },
    });

    if (existing === 0) {
        console.log('No inquiries in Contacted status. Nothing to migrate.');
        return;
    }

    const result = await prisma.inquiries.updateMany({
        where: { status: 'Contacted' },
        data: { status: 'Qualified' },
    });

    console.log(`Updated ${result.count} inquiries from Contacted to Qualified.`);
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });