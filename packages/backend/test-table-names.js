const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testTableNames() {
    console.log('🧪 Testing renamed tables...\n');

    try {
        // Test content_categories table
        console.log('1. Testing content_categories table...');
        const categories = await prisma.content_categories.findMany();
        console.log(`   ✅ content_categories: Found ${categories.length} records`);

        // Test contentLibrary table
        console.log('2. Testing contentLibrary table...');
        const content = await prisma.contentLibrary.findMany();
        console.log(`   ✅ contentLibrary: Found ${content.length} records`);

        // Test build_content table
        console.log('3. Testing build_content table...');
        const buildContent = await prisma.build_content.findMany();
        console.log(`   ✅ build_content: Found ${buildContent.length} records`);

        // Test build_components table with new build_content_id field
        console.log('4. Testing build_components with build_content_id field...');
        const buildComponents = await prisma.build_components.findMany({
            include: {
                build_content: true
            }
        });
        console.log(`   ✅ build_components: Found ${buildComponents.length} records`);

        console.log('\n🎉 All table name changes working correctly!');

    } catch (error) {
        console.error('❌ Error testing tables:', error.message);

        // Check if it's a Prisma model not found error
        if (error.message.includes('Unknown arg')) {
            console.log('💡 This might be a Prisma client cache issue. Try:');
            console.log('   npx prisma generate');
        }
    } finally {
        await prisma.$disconnect();
    }
}

testTableNames();
