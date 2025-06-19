// Test file to check Prisma client types
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// This should work if the Prisma client is properly generated
async function testPrismaClient() {
  console.log("Testing Prisma client...");
  
  // Test that videoComponent exists
  const components = await prisma.videoComponent.findMany();
  console.log("VideoComponents:", components);
  
  // Test that other new models exist
  const modifiers = await prisma.pricingModifier.findMany();
  console.log("PricingModifiers:", modifiers);
  
  // Test deliverable components
  const delComponents = await prisma.deliverableComponent.findMany();
  console.log("DeliverableComponents:", delComponents);
}

testPrismaClient().catch(console.error);
