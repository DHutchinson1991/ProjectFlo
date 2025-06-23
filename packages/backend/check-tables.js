const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkTables() {
  try {
    console.log("Checking what tables exist...");

    const result = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;

    console.log("Existing tables:");
    result.forEach((row) => console.log(`- ${row.table_name}`));
  } catch (error) {
    console.error("Error checking tables:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTables();
