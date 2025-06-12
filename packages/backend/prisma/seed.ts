// packages/backend/prisma/seed.ts
import { PrismaClient, $Enums } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

async function main() {
  console.log("🌱 Seeding database for Wedding Video Business...");

  try {
    // --- 1. Seed Roles ---
    console.log("📋 Seeding Roles...");
    const adminRole = await prisma.roles.upsert({
      where: { name: "Admin" },
      update: {
        description:
          "Full system access. Manages settings, users, and finances.",
      },
      create: {
        name: "Admin",
        description:
          "Full system access. Manages settings, users, and finances.",
      },
    });

    const leadVideographerRole = await prisma.roles.upsert({
      where: { name: "Lead Videographer" },
      update: {
        description:
          "Manages on-site filming, directs second shooters, client interaction on wedding day.",
      },
      create: {
        name: "Lead Videographer",
        description:
          "Manages on-site filming, directs second shooters, client interaction on wedding day.",
      },
    });

    const editorRole = await prisma.roles.upsert({
      where: { name: "Editor" },
      update: {
        description:
          "Handles post-production, video editing, color grading, and final delivery preparation.",
      },
      create: {
        name: "Editor",
        description:
          "Handles post-production, video editing, color grading, and final delivery preparation.",
      },
    });

    const clientManagerRole = await prisma.roles.upsert({
      where: { name: "Client Manager" },
      update: {
        description:
          "Handles client communication, inquiries, bookings, and project coordination.",
      },
      create: {
        name: "Client Manager",
        description:
          "Handles client communication, inquiries, bookings, and project coordination.",
      },
    });

    console.log("✅ Roles seeded.");

    // --- 2. Seed Basic Permissions ---
    console.log("🔑 Seeding Basic Permissions...");
    await prisma.permissions.upsert({
      where: { action_name: "manage_projects" },
      update: {},
      create: {
        action_name: "manage_projects",
        description: "Can create, edit, and delete projects.",
      },
    });

    await prisma.permissions.upsert({
      where: { action_name: "view_finances" },
      update: {},
      create: {
        action_name: "view_finances",
        description: "Can view financial reports and invoices.",
      },
    });
    console.log("✅ Basic Permissions seeded.");

    // --- 3. Seed Team Members ---
    console.log("👥 Seeding Team Members...");
    const teamMembers = [
      {
        email: "info@dhutchinson.co.uk",
        password: "password",
        firstName: "Daniel",
        lastName: "Hutchinson",
        roleId: adminRole.id,
        contributorType: $Enums.contributors_type.Internal,
        defaultHourlyRate: 75.0,
      },
      {
        email: "sarah.films@example.com",
        password: "weddingpass1",
        firstName: "Sarah",
        lastName: "Chen",
        roleId: leadVideographerRole.id,
        contributorType: $Enums.contributors_type.Internal,
        defaultHourlyRate: 60.0,
      },
      {
        email: "mark.edits@example.com",
        password: "editmaster22",
        firstName: "Mark",
        lastName: "Rivera",
        roleId: editorRole.id,
        contributorType: $Enums.contributors_type.Internal,
        defaultHourlyRate: 50.0,
      },
      {
        email: "emily.clients@example.com",
        password: "clientlove3",
        firstName: "Emily",
        lastName: "Jones",
        roleId: clientManagerRole.id,
        contributorType: $Enums.contributors_type.Internal,
        defaultHourlyRate: 45.0,
      },
    ];

    for (const member of teamMembers) {
      const hashedPassword = await bcrypt.hash(member.password, SALT_ROUNDS);

      const contact = await prisma.contacts.upsert({
        where: { email: member.email },
        update: {
          first_name: member.firstName,
          last_name: member.lastName,
          type: $Enums.contacts_type.Contributor,
        },
        create: {
          first_name: member.firstName,
          last_name: member.lastName,
          email: member.email,
          type: $Enums.contacts_type.Contributor,
        },
      });

      await prisma.contributors.upsert({
        where: { contact_id: contact.id },
        update: {
          role_id: member.roleId,
          contributor_type: member.contributorType,
          default_hourly_rate: member.defaultHourlyRate,
        },
        create: {
          contact_id: contact.id,
          role_id: member.roleId,
          contributor_type: member.contributorType,
          password_hash: hashedPassword,
          default_hourly_rate: member.defaultHourlyRate,
        },
      });
      console.log(`  ✓ Team Member: ${member.firstName} ${member.lastName}`);
    }
    console.log("✅ Team Members seeded.");

    // --- 4. Seed Wedding Video Business Lookup Data ---
    console.log("🎬 Seeding Wedding Video Business Lookups...");

    // Coverage Scenes
    const scenes = [
      {
        name: "Bridal Preparations",
        description: "Bride getting ready, details, moments with bridal party.",
      },
      {
        name: "Groom Preparations",
        description: "Groom getting ready, details, moments with groomsmen.",
      },
      {
        name: "Ceremony",
        description: "Full wedding ceremony coverage from multiple angles.",
      },
      {
        name: "Photo Session",
        description: "Coverage of couple and group photo sessions.",
      },
      {
        name: "Cocktail Hour",
        description: "Candid moments during cocktail hour and mingling.",
      },
      {
        name: "Reception Entrance",
        description: "Grand entrance of the couple and wedding party.",
      },
      {
        name: "Speeches & Toasts",
        description: "Coverage of all speeches and toasts.",
      },
      { name: "First Dance", description: "Couple's first dance together." },
      { name: "Parent Dances", description: "Dances with parents and family." },
      {
        name: "Cake Cutting",
        description: "Traditional cake cutting ceremony.",
      },
      {
        name: "Open Dancing",
        description: "Guests dancing and party atmosphere.",
      },
      {
        name: "Couple's Sunset Session",
        description: "Romantic shots during golden hour.",
      },
    ];

    for (const scene of scenes) {
      await prisma.coverage_scenes.upsert({
        where: { name: scene.name },
        update: { description: scene.description },
        create: scene,
      });
    }

    // Deliverables
    const deliverables = [
      {
        name: "Highlight Film (3-5 min)",
        description: "A short, cinematic film showcasing the best moments.",
      },
      {
        name: "Feature Film (10-15 min)",
        description: "A longer film telling the story of the day.",
      },
      {
        name: "Full Ceremony Edit",
        description: "Complete multi-camera edit of the wedding ceremony.",
      },
      {
        name: "Full Speeches Edit",
        description: "Complete multi-camera edit of all speeches.",
      },
      {
        name: "Social Media Teaser (1 min)",
        description: "Quick, engaging teaser for social platforms.",
      },
      {
        name: "Drone Footage Compilation",
        description: "Aerial shots of the venue and surroundings.",
      },
      {
        name: "Raw Footage (USB Drive)",
        description: "All unedited footage from the day.",
      },
    ];

    for (const deliverable of deliverables) {
      await prisma.deliverables.upsert({
        where: { name: deliverable.name },
        update: { description: deliverable.description },
        create: deliverable,
      });
    }

    // Editing Styles
    const styles = [
      {
        name: "Cinematic Storytelling",
        description:
          "Focus on emotional narrative, beautiful visuals, and music.",
      },
      {
        name: "Documentary / Journalistic",
        description: "Chronological, candid capture of events as they unfold.",
      },
      {
        name: "Vintage / Film Look",
        description:
          "Stylized with film grain, specific color palettes for retro feel.",
      },
      {
        name: "Modern & Fast-Paced",
        description: "Quick cuts, energetic music, contemporary feel.",
      },
    ];

    for (const style of styles) {
      await prisma.editing_styles.upsert({
        where: { name: style.name },
        update: { description: style.description },
        create: style,
      });
    }

    console.log("✅ Wedding Video Business Lookups seeded.");

    // --- 5. Seed Sample Clients ---
    console.log("💍 Seeding Sample Clients...");

    // Booked Client 1 - Liam & Emma Davis
    const davisContact = await prisma.contacts.upsert({
      where: { email: "liam.davis@example.com" },
      update: {
        first_name: "Liam",
        last_name: "Davis",
        phone_number: "555-0111",
        type: $Enums.contacts_type.Client,
      },
      create: {
        first_name: "Liam",
        last_name: "Davis",
        email: "liam.davis@example.com",
        phone_number: "555-0111",
        type: $Enums.contacts_type.Client,
      },
    });

    const davisInquiry = await prisma.inquiries.create({
      data: {
        contact_id: davisContact.id,
        wedding_date: new Date("2025-10-18"),
        status: "Booked",
        venue_details: "Lakeside Manor & Gardens, 123 Lakeview Drive",
        notes:
          "Booked Gold Package. Loves documentary style. Wants drone footage.",
      },
    });

    const davisClient = await prisma.clients.upsert({
      where: { contact_id: davisContact.id },
      update: { inquiry_id: davisInquiry.id },
      create: {
        contact_id: davisContact.id,
        inquiry_id: davisInquiry.id,
      },
    });

    // Client user login for Davis
    const davisPassword = await bcrypt.hash("ourbigday25", SALT_ROUNDS);
    await prisma.client_users.upsert({
      where: { client_id: davisClient.id },
      update: { email: davisContact.email },
      create: {
        client_id: davisClient.id,
        email: davisContact.email,
        password_hash: davisPassword,
      },
    });

    // Project for Davis wedding
    await prisma.projects.upsert({
      where: {
        client_id_wedding_date: {
          client_id: davisClient.id,
          wedding_date: new Date("2025-10-18"),
        },
      },
      update: { project_name: "Davis Wedding Film", phase: "Pre-Production" },
      create: {
        client_id: davisClient.id,
        project_name: "Davis Wedding Film",
        wedding_date: new Date("2025-10-18"),
        booking_date: new Date("2025-03-15"),
        phase: "Pre-Production",
      },
    });

    // Lead Client 2 - Olivia Miller
    const millerContact = await prisma.contacts.upsert({
      where: { email: "olivia.miller.wedding@example.com" },
      update: {
        first_name: "Olivia",
        last_name: "Miller",
        phone_number: "555-0110",
        type: $Enums.contacts_type.Client_Lead,
      },
      create: {
        first_name: "Olivia",
        last_name: "Miller",
        email: "olivia.miller.wedding@example.com",
        phone_number: "555-0110",
        type: $Enums.contacts_type.Client_Lead,
      },
    });

    await prisma.inquiries.create({
      data: {
        contact_id: millerContact.id,
        wedding_date: new Date("2025-09-20"),
        status: "New",
        venue_details: "The Grand Ballroom, Downtown",
        notes:
          "Interested in cinematic style, drone footage. Budget: $3000-4000",
      },
    });

    // Booked Client 3 - Chloe & Miguel Garcia
    const garciaContact = await prisma.contacts.upsert({
      where: { email: "chloe.garcia.nuptials@example.com" },
      update: {
        first_name: "Chloe",
        last_name: "Garcia",
        phone_number: "555-0112",
        type: $Enums.contacts_type.Client,
      },
      create: {
        first_name: "Chloe",
        last_name: "Garcia",
        email: "chloe.garcia.nuptials@example.com",
        phone_number: "555-0112",
        type: $Enums.contacts_type.Client,
      },
    });

    const garciaInquiry = await prisma.inquiries.create({
      data: {
        contact_id: garciaContact.id,
        wedding_date: new Date("2026-04-11"),
        status: "Booked",
        venue_details: "The Rustic Barn, Countryside Estate",
        notes:
          "Booked Platinum Package. Wants highlight and feature film. Rustic theme.",
      },
    });

    const garciaClient = await prisma.clients.upsert({
      where: { contact_id: garciaContact.id },
      update: { inquiry_id: garciaInquiry.id },
      create: {
        contact_id: garciaContact.id,
        inquiry_id: garciaInquiry.id,
      },
    });

    // Client user login for Garcia
    const garciaPassword = await bcrypt.hash("forever26", SALT_ROUNDS);
    await prisma.client_users.upsert({
      where: { client_id: garciaClient.id },
      update: { email: garciaContact.email },
      create: {
        client_id: garciaClient.id,
        email: garciaContact.email,
        password_hash: garciaPassword,
      },
    });

    // Project for Garcia wedding
    await prisma.projects.upsert({
      where: {
        client_id_wedding_date: {
          client_id: garciaClient.id,
          wedding_date: new Date("2026-04-11"),
        },
      },
      update: { project_name: "Garcia Wedding Film", phase: "Pre-Production" },
      create: {
        client_id: garciaClient.id,
        project_name: "Garcia Wedding Film",
        wedding_date: new Date("2026-04-11"),
        booking_date: new Date("2025-06-01"),
        phase: "Pre-Production",
      },
    });

    console.log("✅ Sample Clients seeded.");

    console.log("🎉 Wedding Video Business database seeded successfully!");
    console.log("");
    console.log("📋 Login Credentials:");
    console.log("Team Members:");
    console.log(
      "  • Daniel Hutchinson (Admin): info@dhutchinson.co.uk / password",
    );
    console.log(
      "  • Sarah Chen (Lead Videographer): sarah.films@example.com / weddingpass1",
    );
    console.log(
      "  • Mark Rivera (Editor): mark.edits@example.com / editmaster22",
    );
    console.log(
      "  • Emily Jones (Client Manager): emily.clients@example.com / clientlove3",
    );
    console.log("");
    console.log("Clients:");
    console.log("  • Liam Davis: liam.davis@example.com / ourbigday25");
    console.log(
      "  • Chloe Garcia: chloe.garcia.nuptials@example.com / forever26",
    );
    console.log("");
  } catch (error) {
    console.error("❌ Error during seeding:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error("❌ Seed process failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
