import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedMomentTemplates() {
    try {
        console.log('🌱 Seeding moment templates...');

        // Wedding Ceremony moments
        const ceremonyMoments = [
            { name: 'Pre-Ceremony Setup', description: 'Venue preparation and guest arrival', order_index: 1, default_duration: 300 },
            { name: 'Processional', description: 'Wedding party and bride entrance', order_index: 2, default_duration: 180 },
            { name: 'Opening Remarks', description: 'Officiant opening words and welcome', order_index: 3, default_duration: 120 },
            { name: 'Vows Exchange', description: 'Couple exchanging personal vows', order_index: 4, default_duration: 300 },
            { name: 'Ring Exchange', description: 'Wedding ring ceremony', order_index: 5, default_duration: 90 },
            { name: 'Pronouncement', description: 'Official pronouncement and first kiss', order_index: 6, default_duration: 60 },
            { name: 'Recessional', description: 'Couple and wedding party exit', order_index: 7, default_duration: 120 },
            { name: 'Post-Ceremony', description: 'Immediate family congratulations', order_index: 8, default_duration: 180 }
        ];

        // First Dance scene moments
        const firstDanceMoments = [
            { name: 'Music Setup', description: 'Audio setup and sound check for first dance', order_index: 1, default_duration: 120 },
            { name: 'Dance Introduction', description: 'MC announces the first dance', order_index: 2, default_duration: 60 },
            { name: 'First Dance', description: 'Couple\'s first dance as married', order_index: 3, default_duration: 240 },
            { name: 'Guest Reaction', description: 'Capturing guest emotions and reactions', order_index: 4, default_duration: 90 },
            { name: 'Dance Conclusion', description: 'End of song and applause', order_index: 5, default_duration: 60 }
        ];

        // Create moment templates for ceremony
        const ceremonyTemplates = await Promise.all(
            ceremonyMoments.map(moment =>
                prisma.momentTemplates.create({
                    data: {
                        ...moment,
                        scene_type: 'CEREMONY'
                    }
                })
            )
        );

        // Create moment templates for first dance
        const firstDanceTemplates = await Promise.all(
            firstDanceMoments.map(moment =>
                prisma.momentTemplates.create({
                    data: {
                        ...moment,
                        scene_type: 'FIRST_DANCE'
                    }
                })
            )
        );

        console.log('✅ Moment templates created successfully:');
        console.log(`   📿 Ceremony moments: ${ceremonyTemplates.length}`);
        console.log(`   💃 First Dance moments: ${firstDanceTemplates.length}`);
        console.log(`   📊 Total templates: ${ceremonyTemplates.length + firstDanceTemplates.length}`);

        // Display created templates
        console.log('\n🎯 Created moment templates:');

        console.log('\n📿 CEREMONY MOMENTS:');
        ceremonyTemplates.forEach((template) => {
            console.log(`   ${template.order_index}. ${template.name} (${template.default_duration}s) - ${template.description}`);
        });

        console.log('\n💃 FIRST DANCE MOMENTS:');
        firstDanceTemplates.forEach((template) => {
            console.log(`   ${template.order_index}. ${template.name} (${template.default_duration}s) - ${template.description}`);
        });

        return {
            ceremonyCount: ceremonyTemplates.length,
            firstDanceCount: firstDanceTemplates.length,
            total: ceremonyTemplates.length + firstDanceTemplates.length
        };

    } catch (error) {
        console.error('❌ Error seeding moment templates:', error);
        throw error;
    }
}

// Main execution function
async function main() {
    try {
        const results = await seedMomentTemplates();
        console.log('\n🎉 Moment template seeding completed successfully!');
        console.log(`📊 Final summary: ${results.total} moment templates created`);
    } catch (error) {
        console.error('💥 Seeding failed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Run if this file is executed directly
if (require.main === module) {
    main();
}

export { seedMomentTemplates, main as seedMomentTemplatesMain };
