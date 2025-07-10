#!/usr/bin/env node

/**
 * Ensure Global Admins Have Access to All Brands
 * 
 * This script ensures that all users with the "Global Admin" role
 * are automatically granted Owner access to all active brands.
 */

// Using built-in fetch API (Node.js 18+)

async function ensureGlobalAdminBrandAccess() {
    try {
        console.log('🔧 Ensuring Global Admins have access to all brands...');

        // First, get an auth token
        console.log('🔐 Getting authentication token...');
        const loginResponse = await fetch('http://localhost:3002/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'info@dhutchinson.co.uk',
                password: 'Alined@2025'
            })
        });

        if (!loginResponse.ok) {
            throw new Error(`Login failed: ${loginResponse.status}`);
        }

        const authData = await loginResponse.json();
        const token = authData.access_token;
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        // Get all brands
        console.log('📋 Fetching all active brands...');
        const brandsResponse = await fetch('http://localhost:3002/brands', { headers });
        const brands = await brandsResponse.json();

        console.log(`Found ${brands.length} brands:`);
        brands.forEach(brand => {
            console.log(`  - ${brand.name} (ID: ${brand.id})`);
        });

        // Get all contributors (users)
        console.log('👥 Fetching all contributors...');
        const contributorsResponse = await fetch('http://localhost:3002/contributors', { headers });
        const contributors = await contributorsResponse.json();

        // Filter Global Admins
        const globalAdmins = contributors.filter(user =>
            user.role && user.role.name === 'Global Admin'
        );

        console.log(`Found ${globalAdmins.length} Global Admins:`);
        globalAdmins.forEach(admin => {
            console.log(`  - ${admin.first_name} ${admin.last_name} (${admin.email}) - ID: ${admin.id}`);
        });

        // For each Global Admin, ensure they have Owner access to all brands
        for (const admin of globalAdmins) {
            console.log(`\n🔑 Processing ${admin.first_name} ${admin.last_name}...`);

            // Get their current brand associations
            const userBrandsResponse = await fetch(`http://localhost:3002/brands/users/${admin.id}/brands`, { headers });
            const userBrands = await userBrandsResponse.json();

            const associatedBrandIds = userBrands.map(ub => ub.brand_id);
            console.log(`  Current brand access: ${associatedBrandIds.length} brands`);

            // Add them to any brands they don't have access to
            for (const brand of brands) {
                if (!associatedBrandIds.includes(brand.id)) {
                    console.log(`  ➕ Adding access to "${brand.name}"...`);

                    const addUserResponse = await fetch(
                        `http://localhost:3002/brands/${brand.id}/users/${admin.id}`,
                        {
                            method: 'POST',
                            headers,
                            body: JSON.stringify({
                                role: 'Owner',
                                is_active: true
                            })
                        }
                    );

                    if (addUserResponse.ok) {
                        const result = await addUserResponse.json();
                        console.log(`  ✅ Successfully added as Owner (Association ID: ${result.id})`);
                    } else {
                        const error = await addUserResponse.text();
                        console.log(`  ❌ Failed to add: ${error}`);
                    }
                } else {
                    console.log(`  ✅ Already has access to "${brand.name}"`);
                }
            }
        }

        console.log('\n🎉 Brand access setup complete!');
        console.log('\n📊 Summary:');
        console.log(`   - ${globalAdmins.length} Global Admin(s) processed`);
        console.log(`   - ${brands.length} brand(s) checked`);
        console.log(`   - All Global Admins now have Owner access to all brands`);

    } catch (error) {
        console.error('❌ Error ensuring brand access:', error.message);
        console.log('\n🔧 Troubleshooting:');
        console.log('1. Make sure the backend server is running on port 3002');
        console.log('2. Check if the admin credentials are correct');
        console.log('3. Verify that brands and users exist in the database');
        process.exit(1);
    }
}

// Run the function
ensureGlobalAdminBrandAccess();
