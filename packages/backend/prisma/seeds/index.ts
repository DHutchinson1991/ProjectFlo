import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting database seeding...');

    // Run all seed files in order
    console.log('Running admin-system-seed...');
    await import('./admin-system-seed');

    console.log('Running system-infrastructure-seed...');
    await import('./system-infrastructure-seed');

    console.log('Running moonrise-films-seed...');
    await import('./moonrise-films-seed');

    console.log('Running layer5-corporate-seed...');
    await import('./layer5-corporate-seed');

    console.log('Database seeding completed successfully!');
}

main()
    .catch((e) => {
        console.error('Error during seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
