// Test script to verify brand isolation
const fs = require('fs');
const path = require('path');

// Read the auth token
const authTokenPath = path.join(__dirname, '..', '..', 'auth-token.txt');
const authToken = fs.readFileSync(authTokenPath, 'utf8').trim();

console.log('🔍 Testing Brand Isolation...');
console.log('');

async function testBrandIsolation() {
    try {
        // 1. Test brands endpoint
        console.log('📋 1. Testing brands endpoint...');
        const brandsResponse = await fetch('http://localhost:3002/brands', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const brands = await brandsResponse.json();
        console.log(`   Found ${brands.length} brands:`);
        brands.forEach(brand => {
            console.log(`   - ${brand.name} (ID: ${brand.id})`);
        });
        console.log('');

        // 2. Test contacts without brand filter
        console.log('📞 2. Testing contacts without brand filter...');
        const allContactsResponse = await fetch('http://localhost:3002/contacts', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const allContacts = await allContactsResponse.json();
        console.log(`   Total contacts: ${allContacts.length}`);
        console.log('');

        // 3. Test contacts for each brand
        for (const brand of brands) {
            console.log(`🔍 3. Testing contacts for ${brand.name} (ID: ${brand.id})...`);
            const brandContactsResponse = await fetch(`http://localhost:3002/contacts?brandId=${brand.id}`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            const brandContacts = await brandContactsResponse.json();
            console.log(`   Contacts for ${brand.name}: ${brandContacts.length}`);

            if (brandContacts.length > 0) {
                console.log('   Contact details:');
                brandContacts.forEach(contact => {
                    console.log(`   - ${contact.first_name} ${contact.last_name} (${contact.email}) - Brand ID: ${contact.brand_id}`);
                });
            }
            console.log('');
        }

        // 4. Test if there are any contacts with null brand_id
        console.log('❓ 4. Testing for contacts with null brand_id...');
        const nullBrandContacts = allContacts.filter(contact => contact.brand_id === null);
        console.log(`   Contacts with null brand_id: ${nullBrandContacts.length}`);
        if (nullBrandContacts.length > 0) {
            nullBrandContacts.forEach(contact => {
                console.log(`   - ${contact.first_name} ${contact.last_name} (${contact.email}) - Brand ID: ${contact.brand_id}`);
            });
        }
        console.log('');

        // 5. Test brand context headers
        console.log('📡 5. Testing brand context headers...');
        for (const brand of brands) {
            console.log(`   Testing with X-Brand-Context: ${brand.id} for ${brand.name}...`);
            const headerResponse = await fetch('http://localhost:3002/contacts', {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'X-Brand-Context': brand.id.toString()
                }
            });
            const headerContacts = await headerResponse.json();
            console.log(`   Contacts via header: ${headerContacts.length}`);
        }
        console.log('');

        console.log('✅ Brand isolation test completed!');

    } catch (error) {
        console.error('❌ Error during brand isolation test:', error);
    }
}

testBrandIsolation();
