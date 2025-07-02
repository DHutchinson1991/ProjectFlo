const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function showDatabaseTables() {
    try {
        // Query to show all table names
        const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;

        console.log('📋 Current database tables:');
        console.log('============================');

        // Filter for content and build related tables
        const contentTables = tables.filter(t =>
            t.table_name.includes('content') ||
            t.table_name.includes('build') ||
            t.table_name.includes('deliverable')
        );

        if (contentTables.length > 0) {
            console.log('\n🎯 Content & Build related tables:');
            contentTables.forEach(table => {
                console.log(`   • ${table.table_name}`);
            });
        }

        // Check specifically for the renamed tables
        const renamedTables = ['content_categories', 'content_library', 'build_content'];
        console.log('\n✅ Renamed tables verification:');

        for (const tableName of renamedTables) {
            const found = tables.some(t => t.table_name === tableName);
            console.log(`   ${found ? '✅' : '❌'} ${tableName}: ${found ? 'EXISTS' : 'NOT FOUND'}`);
        }

        // Check that old tables are gone
        const oldTables = ['deliverable_categories', 'build_deliverables'];
        console.log('\n🗑️  Old tables should be gone:');

        for (const tableName of oldTables) {
            const found = tables.some(t => t.table_name === tableName);
            console.log(`   ${found ? '❌' : '✅'} ${tableName}: ${found ? 'STILL EXISTS' : 'REMOVED'}`);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

showDatabaseTables();
