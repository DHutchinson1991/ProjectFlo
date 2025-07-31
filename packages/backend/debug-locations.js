const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testLocationQuery() {
    try {
        console.log('Testing database connection...');

        // Test basic connection
        const result = await prisma.$queryRaw`SELECT 1 as test`;
        console.log('Database connection OK:', result);

        // Test if locations_library table exists
        const tableExists = await prisma.$queryRaw`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'locations_library'
        `;
        console.log('Table exists check:', tableExists);

        // Test the actual query from the service
        const locations = await prisma.locationsLibrary.findMany({
            where: {
                is_active: true,
            },
            include: {
                spaces: {
                    where: { is_active: true },
                    include: {
                        floor_plans: {
                            where: { is_active: true },
                        },
                    },
                },
                brand: true,
            },
        });

        console.log('Locations query result:', locations);
        console.log('Number of locations found:', locations.length);

    } catch (error) {
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

testLocationQuery();
