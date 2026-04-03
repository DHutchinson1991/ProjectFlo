const { execSync } = require('child_process');
const path = require('path');

// Try 'stripe' on PATH first, fall back to winget install location
const wingetPath = path.join(
  process.env.LOCALAPPDATA,
  'Microsoft',
  'WinGet',
  'Packages',
  'Stripe.StripeCli_Microsoft.Winget.Source_8wekyb3d8bbwe',
  'stripe.exe',
);

// Load STRIPE_SECRET_KEY from backend .env
const envPath = path.join(__dirname, '..', 'packages', 'backend', '.env');
const envContent = require('fs').readFileSync(envPath, 'utf8');
const match = envContent.match(/^STRIPE_SECRET_KEY=(.+)$/m);
const apiKey = match ? match[1].trim() : '';

let cmd;
try {
  execSync('stripe --version', { stdio: 'ignore' });
  cmd = 'stripe';
} catch {
  cmd = wingetPath;
}

const args = `listen --forward-to localhost:3002/api/stripe/webhook${apiKey ? ` --api-key ${apiKey}` : ''}`;

try {
  execSync(`"${cmd}" ${args}`, {
    stdio: 'inherit',
  });
} catch (e) {
  if (e.status !== 130) process.exit(e.status || 1); // 130 = Ctrl+C
}
