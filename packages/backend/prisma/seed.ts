// packages/backend/prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

// How many rounds to use for the salt. 10 is a good default.
const SALT_ROUNDS = 10;

async function main() {
  console.log("Seeding database...");

  // --- 1. Seed Roles ---
  const adminRole = await prisma.roles.upsert({
    where: { name: "Admin" },
    update: {},
    create: {
      name: "Admin",
      description: "Has access to all system features.",
    },
  });

  await prisma.roles.upsert({
    where: { name: "Contributor" },
    update: {},
    create: {
      name: "Contributor",
      description: "A standard team member (e.g., editor, videographer).",
    },
  });
  console.log("Roles seeded.");

  // --- 2. Seed a default Admin User ---
  const adminEmail = "admin@projectflo.com";
  const adminPassword = "password"; // Use a simple password for development seeding

  // Securely hash the password
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  const hashedPassword = await bcrypt.hash(adminPassword, salt);
  console.log("Hashed default admin password.");

  // Create the contact and the linked contributor in a single transaction
  await prisma.contacts.upsert({
    where: { email: adminEmail },
    update: {}, // Don't update if exists
    create: {
      first_name: "Admin",
      last_name: "User",
      email: adminEmail,
      type: "Contributor",
      contributor: {
        create: {
          role_id: adminRole.id,
          contributor_type: "Internal",
          password_hash: hashedPassword, // Store the hashed password
        },
      },
    },
  });

  console.log(`✅ Default admin user created:`);
  console.log(`   Email: ${adminEmail}`);
  console.log(`   Password: ${adminPassword}`);
  console.log("Seeding finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
