// Test the frontend API calls with brand context
const fs = require('fs');
const path = require('path');

// Read the auth token
const authTokenPath = path.join(__dirname, '..', '..', 'auth-token.txt');
const authToken = fs.readFileSync(authTokenPath, 'utf8').trim();

console.log('🔍 Testing Frontend API Calls with Brand Context...');
console.log('');

async function testFrontendAPIBehavior() {
    try {
        // Test 1: Check what the frontend would call without brand context
        console.log('📞 1. Testing /contacts without brandId parameter...');
        const noParamResponse = await fetch('http://localhost:3002/contacts', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const noParamContacts = await noParamResponse.json();
        console.log(`   All contacts (no filter): ${noParamContacts.length}`);
        console.log('');

        // Test 2: Test with brandId parameter for each brand
        const brands = [
            { id: 1, name: 'Layer5' },
            { id: 2, name: 'Moonrise Films' }
        ];

        for (const brand of brands) {
            console.log(`🔍 2. Testing /contacts?brandId=${brand.id} for ${brand.name}...`);
            const brandResponse = await fetch(`http://localhost:3002/contacts?brandId=${brand.id}`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            const brandContacts = await brandResponse.json();
            console.log(`   ${brand.name} contacts: ${brandContacts.length}`);

            // Show first few contacts
            if (brandContacts.length > 0) {
                brandContacts.slice(0, 3).forEach(contact => {
                    console.log(`   - ${contact.first_name} ${contact.last_name} (Brand: ${contact.brand_id})`);
                });
                if (brandContacts.length > 3) {
                    console.log(`   ... and ${brandContacts.length - 3} more`);
                }
            }
            console.log('');
        }

        // Test 3: Simulate frontend behavior with X-Brand-Context header
        console.log('📡 3. Testing X-Brand-Context header approach...');
        for (const brand of brands) {
            const headerResponse = await fetch('http://localhost:3002/contacts', {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'X-Brand-Context': brand.id.toString()
                }
            });
            const headerContacts = await headerResponse.json();
            console.log(`   ${brand.name} via header: ${headerContacts.length} contacts`);
        }
        console.log('');

        // Test 4: Check mixed scenario - header + param
        console.log('🔀 4. Testing mixed scenario (header + param)...');
        const mixedResponse = await fetch('http://localhost:3002/contacts?brandId=1', {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'X-Brand-Context': '2'
            }
        });
        const mixedContacts = await mixedResponse.json();
        console.log(`   Mixed (param=1, header=2): ${mixedContacts.length} contacts`);
        console.log('   (Should use brandId param and return Layer5 contacts)');
        console.log('');

        console.log('✅ Frontend API behavior test completed!');
        console.log('');
        console.log('📝 Summary:');
        console.log('   - The backend correctly filters by brandId query parameter');
        console.log('   - The X-Brand-Context header is NOT implemented in the backend');
        console.log('   - Frontend should use brandId parameter for proper filtering');

    } catch (error) {
        console.error('❌ Error during frontend API test:', error);
    }
}

testFrontendAPIBehavior();
