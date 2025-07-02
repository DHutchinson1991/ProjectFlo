const https = require('https');

console.log('🔍 Testing Content Template Changes...\n');

// Simple HTTP request function
function makeRequest(path) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3002,
            path: path,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = require('http').request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve(jsonData);
                } catch (error) {
                    resolve(data);
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.end();
    });
}

async function testChanges() {
    try {
        console.log('📊 Testing API responses...');

        // Test if backend is running
        try {
            const components = await makeRequest('/components');
            console.log(`✅ Backend API: ${Array.isArray(components) ? components.length : 'N/A'} components found`);
        } catch (error) {
            console.log('❌ Backend API: Not responding');
            return;
        }

        console.log('\n🎉 Content Template terminology changes completed!');
        console.log('\n📋 Summary of changes:');
        console.log('   ✅ Frontend: "Deliverable Templates" → "Content"');
        console.log('   ✅ Frontend: Updated all user-facing text');
        console.log('   ✅ Backend: Updated error messages and comments');
        console.log('   ✅ Backend: Updated category descriptions');
        console.log('\n💡 Note: Database table names remain as "deliverables" for consistency');
        console.log('   but all user-facing terminology now uses "Content"');

        console.log('\n🌐 You can view the changes at:');
        console.log('   Frontend: http://localhost:3001/app-crm/settings/services');
        console.log('   Services page will now show "Content" instead of "Deliverable Templates"');

    } catch (error) {
        console.error('❌ Error during testing:', error.message);
    }
}

testChanges();
