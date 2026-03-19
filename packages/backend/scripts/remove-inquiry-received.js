const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

(async () => {
  // Find the task library entry
  const entry = await p.task_library.findFirst({ where: { name: 'Inquiry Received' } });
  const exists = entry !== null;
  console.log('Inquiry Received exists:', exists);

  if (entry) {
    // Check for inquiry_tasks referencing this library entry
    const refCount = await p.inquiry_tasks.count({ where: { task_library_id: entry.id } });
    console.log('inquiry_tasks referencing:', refCount);

    // Delete generated inquiry_tasks
    if (refCount > 0) {
      const deleted = await p.inquiry_tasks.deleteMany({ where: { task_library_id: entry.id } });
      console.log('Deleted inquiry_tasks:', deleted.count);
    }

    // Delete the library entry
    await p.task_library.delete({ where: { id: entry.id } });
    console.log('Deleted task library entry');
  }

  // Reindex remaining Inquiry stage children
  const stage = await p.task_library.findFirst({ where: { name: 'Inquiry', parent_task_id: null, is_active: true } });
  if (stage) {
    const children = await p.task_library.findMany({
      where: { parent_task_id: stage.id, is_active: true },
      orderBy: { order_index: 'asc' },
      select: { id: true, name: true, order_index: true },
    });
    for (let i = 0; i < children.length; i++) {
      await p.task_library.update({ where: { id: children[i].id }, data: { order_index: i + 1 } });
    }
    // Verify
    const updated = await p.task_library.findMany({
      where: { parent_task_id: stage.id, is_active: true },
      orderBy: { order_index: 'asc' },
      select: { name: true, order_index: true },
    });
    console.log('Inquiry children after reindex:', JSON.stringify(updated, null, 2));
  }

  await p.$disconnect();
  console.log('Done');
})();
