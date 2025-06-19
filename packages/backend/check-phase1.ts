import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPhase1Implementation() {
  console.log('🔍 Phase 1 Database Implementation Audit\n');

  // 1. Check timeline layers
  console.log('📋 1. Timeline Layers:');
  const timelineLayers = await prisma.timelineLayer.findMany({
    orderBy: { order_index: 'asc' }
  });
  console.log(timelineLayers);

  // 2. Check component types
  console.log('\n📋 2. Component Types Distribution:');
  const componentTypes = await prisma.componentLibrary.groupBy({
    by: ['type'],
    _count: { type: true }
  });
  console.log(componentTypes);

  // 3. Check component analytics fields
  console.log('\n📋 3. Sample Component with Analytics Fields:');
  const sampleComponent = await prisma.componentLibrary.findFirst({
    select: {
      id: true,
      name: true,
      type: true,
      usage_count: true,
      computed_task_count: true,
      computed_total_hours: true,
      performance_score: true
    }
  });
  console.log(sampleComponent);

  // 4. Check pricing modifier types
  console.log('\n📋 4. Pricing Modifiers:');
  const pricingModifiers = await prisma.pricingModifier.findMany({
    select: { name: true, type: true, multiplier: true }
  });
  console.log(pricingModifiers);

  // 5. Verify table existence
  console.log('\n📋 5. Phase 1 Tables Verification:');
  
  try {
    const layerCount = await prisma.timelineLayer.count();
    console.log(`✅ timeline_layers: Exists (${layerCount} records)`);
  } catch (error: any) {
    console.log(`❌ timeline_layers: ${error.message}`);
  }

  try {
    const componentCount = await prisma.timelineComponent.count();
    console.log(`✅ timeline_components: Exists (${componentCount} records)`);
  } catch (error: any) {
    console.log(`❌ timeline_components: ${error.message}`);
  }

  try {
    const depCount = await prisma.componentDependency.count();
    console.log(`✅ component_dependencies: Exists (${depCount} records)`);
  } catch (error: any) {
    console.log(`❌ component_dependencies: ${error.message}`);
  }

  try {
    const analyticsCount = await prisma.componentUsageAnalytics.count();
    console.log(`✅ component_usage_analytics: Exists (${analyticsCount} records)`);
  } catch (error: any) {
    console.log(`❌ component_usage_analytics: ${error.message}`);
  }

  try {
    const sessionCount = await prisma.timelineEditingSession.count();
    console.log(`✅ timeline_editing_sessions: Exists (${sessionCount} records)`);
  } catch (error: any) {
    console.log(`❌ timeline_editing_sessions: ${error.message}`);
  }

  try {
    const changeCount = await prisma.timelineChangeLog.count();
    console.log(`✅ timeline_change_log: Exists (${changeCount} records)`);
  } catch (error: any) {
    console.log(`❌ timeline_change_log: ${error.message}`);
  }

  // 6. Test Timeline Component Creation (with 5-second snapping validation)
  console.log('\n📋 6. Testing Timeline Component Creation:');
  try {
    const deliverable = await prisma.deliverables.findFirst();
    const component = await prisma.componentLibrary.findFirst();
    const layer = await prisma.timelineLayer.findFirst();

    if (deliverable && component && layer) {
      const testTimelineComponent = await prisma.timelineComponent.create({
        data: {
          deliverable_id: deliverable.id,
          component_id: component.id,
          layer_id: layer.id,
          start_time_seconds: 0, // Should be valid (multiple of 5)
          duration_seconds: 30,
        }
      });
      console.log('✅ Timeline component creation: SUCCESS');
      
      // Clean up test data
      await prisma.timelineComponent.delete({
        where: { id: testTimelineComponent.id }
      });
    }
  } catch (error: any) {
    console.log(`❌ Timeline component creation: ${error.message}`);
  }

  await prisma.$disconnect();
}

checkPhase1Implementation().catch(console.error);
