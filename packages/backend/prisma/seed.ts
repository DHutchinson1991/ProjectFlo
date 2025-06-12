// packages/backend/prisma/seed.ts
import { PrismaClient, contacts_type, contributors_type } from "@prisma/client";
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

  // --- 2. Seed Admin Users ---
  const adminUsers = [
    {
      email: "info@dhutchinson.co.uk",
      password: "password",
      firstName: "Daniel",
      lastName: "Hutchinson",
    },
  ];

  for (const user of adminUsers) {
    // Hash the password
    const hashedPassword = await bcrypt.hash(user.password, SALT_ROUNDS);

    // Create the contact and the linked contributor in a single transaction
    await prisma.contacts.upsert({
      where: { email: user.email },
      update: {}, // Don't update if exists
      create: {
        first_name: user.firstName,
        last_name: user.lastName,
        email: user.email,
        type: contacts_type.Contributor,
        contributor: {
          create: {
            role_id: adminRole.id,
            contributor_type: contributors_type.Internal,
            password_hash: hashedPassword,
          },
        },
      },
    });

    console.log(`✅ Admin user created:`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Password: ${user.password}`);
  }

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
