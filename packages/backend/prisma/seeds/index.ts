import { PrismaClient } from '@prisma/client';
import { createMoonriseCoverageLibrary } from './moonrise-coverage-library';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting comprehensive database seeding...');

    try {
        // Core system infrastructure first
        console.log('1️⃣ Running admin-system-seed...');
        await import('./admin-system-seed');

        console.log('2️⃣ Running system-infrastructure-seed...');
        await import('./system-infrastructure-seed');

        console.log('3️⃣ Running global-job-roles...');
        const globalJobRoles = await import('./global-job-roles');
        await globalJobRoles.default();

        // Brand setups (complete modular setups)
        console.log('4️⃣ Running moonrise-complete-setup (Wedding Videography)...');
        const moonriseSetup = await import('./moonrise-complete-setup');
        await moonriseSetup.default();

        console.log('5️⃣ Running layer5-complete-setup (Corporate Videography)...');
        const layer5Setup = await import('./layer5-complete-setup');
        await layer5Setup.default();

        // Global calendar events and task library
        console.log('6️⃣ Running global-calendar-seed...');
        await import('./global-calendar-seed');

        console.log('✅ Database seeding completed successfully!');
        console.log('📊 All foundational data has been seeded.');

    } catch (error) {
        console.error('❌ Error during foundational seeding:', error);
        throw error;
    }

    // Now run the specialized coverage seed
    try {
        console.log('\n🎬 Running specialized coverage library seed...');
        await createMoonriseCoverageLibrary();
        console.log('✅ Coverage library seeding completed successfully!');
    } catch (error) {
        console.error('❌ Error during coverage seeding:', error);
        console.log('⚠️ Continuing without coverage data...');
    }

    console.log('\n🎉 Complete database seeding finished successfully!');
    console.log('📈 Your database is now ready for development and testing.');
    console.log('');
    console.log('🎬 Seeded Brands:');
    console.log('   • Moonrise Films (Wedding Videography) - Complete with team, scenes, tasks, equipment');
    console.log('   • Layer5 Corporate (Corporate Videography) - Complete with team and clients');
    console.log('');
    console.log('🌐 Global Systems:');
    console.log('   • Calendar system with video production events');
    console.log('   • Admin system with global access');
    console.log('   • System infrastructure and settings');
    console.log('');
    console.log('🔗 Next Steps:');
    console.log('   • Start backend: npm run start:dev');
    console.log('   • Start frontend: cd ../frontend && npm run dev');
    console.log('   • Access Prisma Studio: npx prisma studio');
}

main()
    .catch((e) => {
        console.error('Error during seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
