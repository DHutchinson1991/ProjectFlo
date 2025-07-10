// Comprehensive test to verify brand isolation end-to-end
const fs = require('fs');
const path = require('path');

// Read the auth token
const authTokenPath = path.join(__dirname, '..', '..', 'auth-token.txt');
const authToken = fs.readFileSync(authTokenPath, 'utf8').trim();

console.log('🔍 Comprehensive Brand Isolation Test');
console.log('=====================================');
console.log('');

async function runComprehensiveTest() {
    try {
        // Step 1: Get all brands
        console.log('📋 Step 1: Getting all brands...');
        const brandsResponse = await fetch('http://localhost:3002/brands', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const brands = await brandsResponse.json();

        console.log(`   Found ${brands.length} brands:`);
        brands.forEach(brand => {
            console.log(`   - ${brand.name} (ID: ${brand.id})`);
        });
        console.log('');

        // Step 2: Test contacts for each brand
        console.log('📞 Step 2: Testing contacts isolation...');
        const contactResults = {};

        for (const brand of brands) {
            console.log(`   Testing ${brand.name} (ID: ${brand.id})...`);

            const contactsResponse = await fetch(`http://localhost:3002/contacts?brandId=${brand.id}`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            const contacts = await contactsResponse.json();

            contactResults[brand.id] = {
                brand: brand.name,
                count: contacts.length,
                contacts: contacts
            };

            console.log(`   ✓ ${brand.name}: ${contacts.length} contacts`);

            // Verify all contacts belong to the correct brand
            const wrongBrandContacts = contacts.filter(c => c.brand_id !== brand.id);
            if (wrongBrandContacts.length > 0) {
                console.log(`   ❌ ERROR: Found ${wrongBrandContacts.length} contacts with wrong brand_id!`);
                wrongBrandContacts.forEach(c => {
                    console.log(`      - ${c.first_name} ${c.last_name} has brand_id: ${c.brand_id}, expected: ${brand.id}`);
                });
            } else {
                console.log(`   ✓ All contacts correctly belong to brand ${brand.id}`);
            }
        }
        console.log('');

        // Step 3: Test cross-contamination
        console.log('🔀 Step 3: Testing cross-contamination...');
        const layer5Contacts = contactResults[1]?.contacts || [];
        const moonriseContacts = contactResults[2]?.contacts || [];

        console.log(`   Layer5 contacts: ${layer5Contacts.length}`);
        console.log(`   Moonrise contacts: ${moonriseContacts.length}`);

        // Check if any Layer5 contacts appear in Moonrise
        const layer5InMoonrise = moonriseContacts.filter(mc =>
            layer5Contacts.some(lc => lc.id === mc.id)
        );

        if (layer5InMoonrise.length > 0) {
            console.log(`   ❌ ERROR: Found ${layer5InMoonrise.length} Layer5 contacts in Moonrise!`);
            layer5InMoonrise.forEach(c => {
                console.log(`      - ${c.first_name} ${c.last_name} (${c.email})`);
            });
        } else {
            console.log(`   ✓ No cross-contamination detected`);
        }
        console.log('');

        // Step 4: Test specific contact emails
        console.log('📧 Step 4: Testing specific contact emails...');
        const testEmails = [
            { email: 'sarah.chen@layer5video.com', expectedBrand: 1, brandName: 'Layer5' },
            { email: 'andy.galloway@projectflo.co.uk', expectedBrand: 2, brandName: 'Moonrise Films' },
            { email: 'corri.lee@projectflo.co.uk', expectedBrand: 2, brandName: 'Moonrise Films' }
        ];

        for (const test of testEmails) {
            const allContactsResponse = await fetch(`http://localhost:3002/contacts`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            const allContacts = await allContactsResponse.json();

            const contact = allContacts.find(c => c.email === test.email);
            if (contact) {
                if (contact.brand_id === test.expectedBrand) {
                    console.log(`   ✓ ${test.email} correctly belongs to ${test.brandName}`);
                } else {
                    console.log(`   ❌ ERROR: ${test.email} has brand_id ${contact.brand_id}, expected ${test.expectedBrand}`);
                }
            } else {
                console.log(`   ❌ ERROR: ${test.email} not found in database`);
            }
        }
        console.log('');

        // Step 5: Summary
        console.log('📊 Step 5: Summary');
        console.log(`   Total brands: ${brands.length}`);
        console.log(`   Layer5 contacts: ${contactResults[1]?.count || 0}`);
        console.log(`   Moonrise contacts: ${contactResults[2]?.count || 0}`);
        console.log(`   Total contacts: ${Object.values(contactResults).reduce((sum, r) => sum + r.count, 0)}`);
        console.log('');

        // Step 6: Test the specific issue mentioned
        console.log('🎯 Step 6: Testing the specific issue (Layer5 contacts in Moonrise)...');

        // Check if Layer5 contacts are showing up when requesting Moonrise contacts
        const moonriseOnlyResponse = await fetch(`http://localhost:3002/contacts?brandId=2`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const moonriseOnlyContacts = await moonriseOnlyResponse.json();

        const layer5EmailsInMoonrise = moonriseOnlyContacts.filter(contact =>
            contact.email.includes('layer5video.com')
        );

        if (layer5EmailsInMoonrise.length > 0) {
            console.log(`   ❌ ISSUE CONFIRMED: ${layer5EmailsInMoonrise.length} Layer5 contacts found in Moonrise query!`);
            layer5EmailsInMoonrise.forEach(c => {
                console.log(`      - ${c.first_name} ${c.last_name} (${c.email}) - Brand ID: ${c.brand_id}`);
            });
        } else {
            console.log(`   ✅ ISSUE RESOLVED: No Layer5 contacts found in Moonrise query`);
        }
        console.log('');

        console.log('✅ Comprehensive brand isolation test completed!');
        console.log('');

        // Final verdict
        const hasIssues = layer5InMoonrise.length > 0 || layer5EmailsInMoonrise.length > 0;
        if (hasIssues) {
            console.log('❌ VERDICT: Brand isolation issues detected!');
        } else {
            console.log('✅ VERDICT: Brand isolation is working correctly!');
        }

    } catch (error) {
        console.error('❌ Error during comprehensive test:', error);
    }
}

runComprehensiveTest();
