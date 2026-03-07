const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function checkUser() {
  try {
    console.log('\n=== Checking User ===\n');
    
    const email = 'info@dhutchinson.co.uk';
    
    // Find contact
    const contact = await prisma.contacts.findUnique({
      where: { email },
      include: {
        contributor: {
          include: {
            role: true,
          },
        },
      },
    });
    
    if (!contact) {
      console.log(`❌ Contact with email "${email}" NOT FOUND`);
      return;
    }
    
    console.log(`✅ Contact found:`, {
      id: contact.id,
      email: contact.email,
      first_name: contact.first_name,
      last_name: contact.last_name,
    });
    
    if (!contact.contributor) {
      console.log(`❌ No contributor linked to this contact`);
      return;
    }
    
    console.log(`✅ Contributor found:`, {
      id: contact.contributor.id,
      email: contact.contributor.contact.email,
      is_active: contact.contributor.is_active,
      has_password: !!contact.contributor.password_hash,
      password_hash_preview: contact.contributor.password_hash ? contact.contributor.password_hash.substring(0, 20) + '...' : 'NULL',
    });
    
    if (!contact.contributor.password_hash) {
      console.log(`\n❌ PROBLEM: No password hash set for this user`);
      console.log(`Solution: Set a password for the user first`);
      return;
    }
    
    // Test password
    const testPassword = 'Alined@2025';
    console.log(`\n=== Testing Password ===`);
    console.log(`Testing password: "${testPassword}"`);
    
    const isMatch = await bcrypt.compare(testPassword, contact.contributor.password_hash);
    console.log(`Password match: ${isMatch ? '✅ YES' : '❌ NO'}`);
    
    if (!isMatch) {
      console.log(`\nPossible solutions:`);
      console.log(`1. Password is incorrect`);
      console.log(`2. Password was changed and not hashed properly`);
      console.log(`3. Try resetting password in database`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();
