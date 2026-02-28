/**
 * Quick Test: Subject Templates & Subject Creation
 * 
 * Run this to verify the new subject role template system is working
 * 
 * Usage:
 *   node test-wedding-subjects.js
 */

const BASE_URL = 'http://localhost:3002';
const BRAND_ID = 2; // Moonrise Films
const FILM_ID = 1; // First film in the system

async function test() {
  try {
    console.log('🧪 Testing Subject Role Template System\n');

    // 1. Load templates
    console.log('1️⃣  Loading templates for Moonrise Films...');
    const templatesRes = await fetch(`${BASE_URL}/subjects/type-templates/brand/${BRAND_ID}`);
    if (!templatesRes.ok) throw new Error(`Failed: ${templatesRes.status}`);
    const templates = await templatesRes.json();
    console.log(`   ✅ Found ${templates.length} template(s)\n`);

    if (templates.length === 0) {
      console.log('   ⚠️  No templates found. Run the seed file first.');
      return;
    }

    // 2. Show template details
    console.log('2️⃣  Template Details:');
    const template = templates.find((t: any) => t.name.includes('Wedding'));
    if (template) {
      console.log(`   Name: ${template.name}`);
      console.log(`   Category: ${template.category}`);
      console.log(`   Roles: ${template.roles.length}`);
      template.roles.forEach((role: any) => {
        console.log(`     ${role.is_core ? '⭐' : '  '} ${role.role_name}`);
      });
    }
    console.log();

    // 3. Load film subjects
    console.log(`3️⃣  Loading subjects for Film ${FILM_ID}...`);
    const subjectsRes = await fetch(`${BASE_URL}/subjects/films/${FILM_ID}/subjects`);
    if (!subjectsRes.ok) throw new Error(`Failed: ${subjectsRes.status}`);
    const subjects = await subjectsRes.json();
    console.log(`   ✅ Found ${subjects.length} subject(s)\n`);

    // 4. Create a test subject with role
    if (template) {
      console.log('4️⃣  Creating test subject with role...');
      const brideRole = template.roles.find((r: any) => r.role_name === 'Bride');
      if (brideRole) {
        const createRes = await fetch(`${BASE_URL}/subjects/films/${FILM_ID}/subjects`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Test Subject - Sarah',
            category: 'PEOPLE',
            role_template_id: brideRole.id,
            is_custom: false
          })
        });
        if (!createRes.ok) throw new Error(`Failed: ${createRes.status}`);
        const created = await createRes.json();
        console.log(`   ✅ Created subject: ${created.name}`);
        console.log(`   Role: ${created.role?.role_name}`);
        console.log(`   Category: ${created.category}\n`);

        // 5. Verify it was created
        console.log('5️⃣  Verifying subject was created...');
        const verifyRes = await fetch(`${BASE_URL}/subjects/films/${FILM_ID}/subjects`);
        const updatedSubjects = await verifyRes.json();
        console.log(`   ✅ Total subjects now: ${updatedSubjects.length}\n`);

        // 6. Clean up (delete test subject)
        console.log('6️⃣  Cleaning up (deleting test subject)...');
        const deleteRes = await fetch(`${BASE_URL}/subjects/${created.id}`, { method: 'DELETE' });
        if (!deleteRes.ok) throw new Error(`Failed: ${deleteRes.status}`);
        console.log(`   ✅ Deleted test subject\n`);
      }
    }

    console.log('✅ All tests passed!');
    console.log('\n📝 Next steps:');
    console.log('   1. Start the servers: pnpm dev (in root)');
    console.log('   2. Navigate to: http://localhost:3001/designer');
    console.log('   3. Open a film and go to Subjects tab');
    console.log('   4. Click "Add" and select "Moonrise Wedding" template');
    console.log('   5. Select roles and enter names');
    console.log('   6. Click "Create Subjects"');

  } catch (error) {
    console.error('\n❌ Test failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

test();
