/**
 * Backfill script: Set default assignees on task_library templates
 * and update existing inquiry_tasks to match.
 *
 * Usage:
 *   node scripts/backfill-task-assignees.js [contributorId]
 *
 * If no contributorId is provided, lists available contributors and exits.
 * If contributorId is provided, sets that contributor as default_assigned_to_id
 * on all task_library entries that don't already have one, then updates
 * existing inquiry_tasks that reference those templates.
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const contributorId = process.argv[2] ? parseInt(process.argv[2], 10) : null;

  if (!contributorId) {
    // List available contributors
    const contributors = await prisma.contributors.findMany({
      select: {
        id: true,
        contact: { select: { first_name: true, last_name: true, email: true } },
      },
    });
    console.log("\n📋 Available contributors:\n");
    for (const c of contributors) {
      console.log(
        `  ID ${c.id}: ${c.contact.first_name} ${c.contact.last_name} (${c.contact.email})`
      );
    }
    console.log(
      "\n💡 Usage: node scripts/backfill-task-assignees.js <contributorId>\n"
    );
    return;
  }

  // Verify the contributor exists
  const contributor = await prisma.contributors.findUnique({
    where: { id: contributorId },
    select: {
      id: true,
      contact: { select: { first_name: true, last_name: true } },
    },
  });

  if (!contributor) {
    console.error(`❌ Contributor with ID ${contributorId} not found.`);
    process.exit(1);
  }

  const name = `${contributor.contact.first_name} ${contributor.contact.last_name}`;
  console.log(`\n🔧 Setting default assignee to: ${name} (ID: ${contributorId})\n`);

  // Step 1: Update task_library entries that have no default assignee
  const updateResult = await prisma.task_library.updateMany({
    where: { default_assigned_to_id: null },
    data: { default_assigned_to_id: contributorId },
  });
  console.log(
    `✅ Updated ${updateResult.count} task_library templates with default assignee`
  );

  // Step 2: Backfill existing inquiry_tasks that have no assignee
  // and have a linked task_library entry
  const unassignedTasks = await prisma.inquiry_tasks.findMany({
    where: {
      assigned_to_id: null,
      task_library_id: { not: null },
    },
    select: {
      id: true,
      task_library_id: true,
      task_library: { select: { default_assigned_to_id: true } },
    },
  });

  let updated = 0;
  for (const task of unassignedTasks) {
    const assigneeId = task.task_library?.default_assigned_to_id;
    if (assigneeId) {
      await prisma.inquiry_tasks.update({
        where: { id: task.id },
        data: { assigned_to_id: assigneeId },
      });
      updated++;
    }
  }

  console.log(
    `✅ Backfilled ${updated} existing inquiry_tasks with assignees`
  );

  // Summary
  const totalTemplates = await prisma.task_library.count();
  const templatesWithAssignee = await prisma.task_library.count({
    where: { default_assigned_to_id: { not: null } },
  });
  const totalInquiryTasks = await prisma.inquiry_tasks.count();
  const assignedInquiryTasks = await prisma.inquiry_tasks.count({
    where: { assigned_to_id: { not: null } },
  });

  console.log(`\n📊 Summary:`);
  console.log(
    `   Task templates: ${templatesWithAssignee}/${totalTemplates} have default assignees`
  );
  console.log(
    `   Inquiry tasks:  ${assignedInquiryTasks}/${totalInquiryTasks} have assignees\n`
  );
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
