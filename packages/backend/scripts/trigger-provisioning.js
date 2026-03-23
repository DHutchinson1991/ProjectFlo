/**
 * Re-trigger brand provisioning by sending the existing service_types
 * back to the backend update endpoint. This causes the provisioner
 * to re-run idempotently, recreating any missing event types/sets.
 *
 * Usage: node scripts/trigger-provisioning.js
 * Requires: backend server running on localhost:3002
 */
const http = require('http');

const BRAND_ID = 1;

// Step 1: Get the brand to find its current service_types
function get(url) {
    return new Promise((resolve, reject) => {
        http.get(url, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 400) return reject(new Error(`GET ${url} → ${res.statusCode}: ${data}`));
                resolve(JSON.parse(data));
            });
        }).on('error', reject);
    });
}

function patch(url, body) {
    return new Promise((resolve, reject) => {
        const payload = JSON.stringify(body);
        const req = http.request(url, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
        }, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 400) return reject(new Error(`PATCH ${url} → ${res.statusCode}: ${data}`));
                resolve(JSON.parse(data));
            });
        });
        req.on('error', reject);
        req.write(payload);
        req.end();
    });
}

async function main() {
    console.log(`Fetching brand ${BRAND_ID}...`);
    const brand = await get(`http://localhost:3002/brands/${BRAND_ID}`);
    console.log(`Brand: ${brand.name}`);
    console.log(`Current service_types: ${JSON.stringify(brand.service_types)}`);

    if (!brand.service_types || brand.service_types.length === 0) {
        console.log('No service types enabled — nothing to provision.');
        return;
    }

    console.log(`\nRe-sending service_types to trigger provisioning...`);
    const updated = await patch(`http://localhost:3002/brands/${BRAND_ID}`, {
        service_types: brand.service_types,
    });
    console.log('✅ Provisioning triggered! Brand updated:', updated.name);
    console.log('\nRefresh your Packages page — missing sets should now appear.');
}

main().catch(e => { console.error('❌ Error:', e.message); process.exit(1); });
