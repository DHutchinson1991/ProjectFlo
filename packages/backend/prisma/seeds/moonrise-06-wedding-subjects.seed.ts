/**
 * Seed: Wedding Subject Templates for Moonrise
 * 
 * Creates the "Moonrise Wedding" subject type template with roles:
 * - Core roles: Bride, Groom, Best Man, Maid of Honor (auto-selected)
 * - Optional roles: Parents, Wedding Party, Guests
 * 
 * Used in: Film subject management in Designer
 * Run: npx ts-node prisma/seeds/moonrise-06-wedding-subjects.seed.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedWeddingSubjects() {
  try {
    console.log('🎬 === Moonrise Wedding Subject Templates ===\n');

    // Find Moonrise brand
    const brand = await prisma.brands.findFirst({
      where: { name: 'Moonrise Films' }
    });

    if (!brand) {
      console.error('❌ Moonrise Films brand not found');
      process.exit(1);
    }

    console.log(`✅ Found brand: ${brand.name} (ID: ${brand.id})\n`);

    // Check if template already exists
    const existingTemplate = await prisma.subjectTypeTemplate.findFirst({
      where: {
        brand_id: brand.id,
        name: 'Moonrise Wedding'
      }
    });

    if (existingTemplate) {
      console.log('⚠️  Moonrise Wedding template already exists. Skipping...');
      return;
    }

    // Create the template with roles
    const template = await prisma.subjectTypeTemplate.create({
      data: {
        brand_id: brand.id,
        name: 'Moonrise Wedding',
        description: 'Standard wedding template for Moonrise films with core and optional roles',
        category: 'PEOPLE',
        is_active: true,
        roles: {
          create: [
            {
              role_name: 'Bride',
              description: 'The bride',
              is_core: true,
              never_group: true,
              order_index: 0
            },
            {
              role_name: 'Groom',
              description: 'The groom',
              is_core: true,
              never_group: true,
              order_index: 1
            },
            {
              role_name: 'Best Man',
              description: 'Best man in the wedding',
              is_core: true,
              never_group: true,
              order_index: 2
            },
            {
              role_name: 'Maid of Honor',
              description: 'Maid of honor in the wedding',
              is_core: true,
              never_group: true,
              order_index: 3
            },
            {
              role_name: 'Father of Bride',
              description: 'Father of the bride',
              is_core: false,
              never_group: true,
              order_index: 4
            },
            {
              role_name: 'Mother of Bride',
              description: 'Mother of the bride',
              is_core: false,
              never_group: true,
              order_index: 5
            },
            {
              role_name: 'Father of Groom',
              description: 'Father of the groom',
              is_core: false,
              never_group: true,
              order_index: 6
            },
            {
              role_name: 'Mother of Groom',
              description: 'Mother of the groom',
              is_core: false,
              never_group: true,
              order_index: 7
            },
            {
              role_name: 'Bridesmaids',
              description: 'Bridesmaids group',
              is_core: false,
              is_group: true,
              order_index: 8
            },
            {
              role_name: 'Groomsmen',
              description: 'Groomsmen group',
              is_core: false,
              is_group: true,
              order_index: 9
            },
            {
              role_name: 'Flower Girl',
              description: 'Flower girl',
              is_core: false,
              never_group: true,
              order_index: 10
            },
            {
              role_name: 'Ring Bearer',
              description: 'Ring bearer',
              is_core: false,
              never_group: true,
              order_index: 11
            },
            {
              role_name: 'Guests',
              description: 'Wedding guests',
              is_core: false,
              is_group: true,
              order_index: 12
            }
          ]
        }
      },
      include: {
        roles: {
          orderBy: { order_index: 'asc' }
        }
      }
    });

    console.log(`✅ Created "Moonrise Wedding" template (ID: ${template.id})`);
    console.log(`   Total roles: ${template.roles.length}`);
    console.log(`   Core roles: ${template.roles.filter(r => r.is_core).length}\n`);

    console.log('📋 Core Roles (auto-selected):');
    template.roles
      .filter(r => r.is_core)
      .forEach(role => {
        console.log(`   ⭐ ${role.role_name}`);
      });

    console.log('\n📋 Optional Roles:');
    template.roles
      .filter(r => !r.is_core)
      .forEach(role => {
        console.log(`   ○ ${role.role_name}`);
      });

    console.log('\n✅ Wedding subject template seeded successfully!');

  } catch (error) {
    console.error('❌ Error seeding wedding subjects:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedWeddingSubjects();
