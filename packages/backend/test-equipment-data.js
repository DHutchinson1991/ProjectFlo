const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testEquipmentData() {
  try {
    console.log('\n🔍 Testing Equipment Data...\n');

    // Get all equipment
    const allEquipment = await prisma.equipment.findMany({
      select: {
        id: true,
        item_name: true,
        type: true,
        model: true,
        brand_id: true,
        is_active: true,
      },
      orderBy: { type: 'asc' },
    });

    console.log(`📦 Total Equipment Items: ${allEquipment.length}\n`);

    // Group by type
    const byType = allEquipment.reduce((acc, item) => {
      if (!acc[item.type]) acc[item.type] = [];
      acc[item.type].push(item);
      return acc;
    }, {});

    console.log('📊 Equipment by Type:');
    Object.entries(byType).forEach(([type, items]) => {
      console.log(`  ${type}: ${items.length} items`);
    });

    console.log('\n🎥 Camera Equipment:');
    const cameraTypes = ['MIRRORLESS', 'DSLR', 'ACTION_CAM', 'DRONE', 'SMARTPHONE'];
    cameraTypes.forEach((type) => {
      const items = byType[type] || [];
      items.forEach((item) => {
        console.log(`  - ${item.item_name}${item.model ? ` (${item.model})` : ''} [ID: ${item.id}]`);
      });
    });

    console.log('\n🎤 Audio Equipment:');
    const audioTypes = ['RECORDER', 'LAVALIER', 'CONDENSER', 'HEADPHONES', 'PA_SPEAKER', 'MIXER', 'INTERFACE'];
    audioTypes.forEach((type) => {
      const items = byType[type] || [];
      items.forEach((item) => {
        console.log(`  - ${item.item_name}${item.model ? ` (${item.model})` : ''} [ID: ${item.id}]`);
      });
    });

    // Check equipment templates
    console.log('\n📋 Equipment Templates:');
    const templates = await prisma.equipmentTemplate.findMany({
      include: {
        items: {
          include: {
            equipment: true,
          },
        },
      },
    });

    console.log(`Total Templates: ${templates.length}\n`);
    templates.forEach((template) => {
      console.log(`  ${template.name} (ID: ${template.id})`);
      console.log(`    Items: ${template.items.length}`);
      template.items.forEach((item) => {
        console.log(`      - ${item.slot_type} ${item.slot_index}: ${item.equipment.item_name} → Track: ${item.track_name || 'N/A'}`);
      });
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testEquipmentData();
