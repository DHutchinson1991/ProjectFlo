// Simple test to check Prisma connection
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log("🔍 Testing Prisma connection...");

    const layers = await prisma.timelineLayer.findMany({
      orderBy: { order_index: "asc" },
    });

    console.log("✅ Connection successful!");
    console.log(`Found ${layers.length} timeline layers:`);
    layers.forEach((layer) => {
      console.log(`  ${layer.order_index}: ${layer.name} (ID: ${layer.id})`);
    });
  } catch (error) {
    console.error("❌ Connection failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
