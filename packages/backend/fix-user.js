const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function fixUser() {
  try {
    console.log('\n=== Fixing info@dhutchinson.co.uk ===\n');
    
    const contact = await prisma.contacts.findUnique({
      where: { email: 'info@dhutchinson.co.uk' },
    });
    
    if (!contact) {
      console.log('❌ Contact not found!');
      return;
    }
    
    console.log(`Contact ID: ${contact.id}`);
    
    // Check if contributor exists
    const existingContributor = await prisma.contributors.findFirst({
      where: { contact_id: contact.id },
    });
    
    if (existingContributor) {
      console.log(`✅ Contributor already exists (ID: ${existingContributor.id})`);
      console.log(`   Has password: ${!!existingContributor.password_hash}`);
      
      if (!existingContributor.password_hash) {
        console.log(`\n   Setting password...`);
        const hashedPassword = await bcrypt.hash('Alined@2025', 10);
        const updated = await prisma.contributors.update({
          where: { id: existingContributor.id },
          data: { password_hash: hashedPassword },
        });
        console.log(`   ✅ Password set for contributor ID ${updated.id}`);
      }
    } else {
      console.log(`❌ No contributor found for this contact`);
      console.log(`Creating contributor...`);
      
      const hashedPassword = await bcrypt.hash('Alined@2025', 10);
      
      // Try creating with minimal fields
      const newContributor = await prisma.contributors.create({
        data: {
          contact_id: contact.id,
          password_hash: hashedPassword,
        },
        include: {
          contact: true,
          role: true,
        },
      });
      
      console.log(`✅ Contributor created (ID: ${newContributor.id})`);
      console.log(`   Email: ${newContributor.contact.email}`);
      console.log(`   Role: ${newContributor.role?.name || 'None'}`);
      console.log(`   Password: Set to "Alined@2025"`);
      console.log(`\n✅ User should now be able to login!`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.meta) {
      console.error('Details:', error.meta);
    }
  } finally {
    await prisma.$disconnect();
  }
}

fixUser();
