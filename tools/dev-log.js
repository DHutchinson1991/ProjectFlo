const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, '..', 'dev.log');

// ── LM Studio (Gemma) connection check with auto-fallback ───────
const LOCAL_LM_URL = 'http://127.0.0.1:1234/v1';

function readBackendEnvUrl() {
  try {
    const envPath = path.join(__dirname, '..', 'packages', 'backend', '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/^LMSTUDIO_URL=(.+)$/m);
    return match ? match[1].trim() : null;
  } catch {
    return null;
  }
}

async function tryConnect(url) {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${url}/models`, { signal: controller.signal });
    clearTimeout(t);
    if (!res.ok) return null;
    const data = await res.json();
    return (data.data ?? []).map((m) => m.id);
  } catch {
    return null;
  }
}

async function resolveLmStudio() {
  const remoteUrl = readBackendEnvUrl();
  const isRemote = remoteUrl && remoteUrl !== LOCAL_LM_URL;

  if (isRemote) {
    console.log(`\x1b[36m🔍 Trying remote LM Studio at ${remoteUrl} …\x1b[0m`);
    const models = await tryConnect(remoteUrl);
    if (models) {
      console.log(`\x1b[32m✔  LM Studio connected (remote) — ${models.length} model(s): ${models.join(', ') || '(none)'}\x1b[0m`);
      return remoteUrl;
    }
    console.log(`\x1b[33m⚠  Remote LM Studio unreachable — trying local fallback at ${LOCAL_LM_URL} …\x1b[0m`);
  } else {
    console.log(`\x1b[36m🔍 Trying local LM Studio at ${LOCAL_LM_URL} …\x1b[0m`);
  }

  const localModels = await tryConnect(LOCAL_LM_URL);
  if (localModels) {
    console.log(`\x1b[32m✔  LM Studio connected (local) — ${localModels.length} model(s): ${localModels.join(', ') || '(none)'}\x1b[0m`);
    return LOCAL_LM_URL;
  }

  console.log(`\x1b[33m⚠  LM Studio unreachable on both remote and local — AI features will be unavailable\x1b[0m`);
  return remoteUrl || LOCAL_LM_URL;
}
// ────────────────────────────────────────────────────────────────

// Truncate log on each start
fs.writeFileSync(LOG_FILE, `=== pnpm dev started at ${new Date().toISOString()} ===\n`);

const logStream = fs.createWriteStream(LOG_FILE, { flags: 'a' });

// Resolve LM Studio connection, then start services with the winning URL
resolveLmStudio().then((resolvedUrl) => startServices(resolvedUrl));

function startServices(lmStudioUrl) {
const child = spawn('pnpm', ['run', 'dev:services'], {
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: true,
  cwd: path.join(__dirname, '..'),
  env: { ...process.env, FORCE_COLOR: '1', LMSTUDIO_URL: lmStudioUrl },
});

child.stdout.on('data', (data) => {
  process.stdout.write(data);
  logStream.write(data);
});

child.stderr.on('data', (data) => {
  process.stderr.write(data);
  logStream.write(data);
});

child.on('exit', (code) => {
  logStream.write(`\n=== Exited with code ${code} at ${new Date().toISOString()} ===\n`);
  logStream.end();
  process.exit(code ?? 0);
});

process.on('SIGINT', () => {
  child.kill('SIGINT');
});
process.on('SIGTERM', () => {
  child.kill('SIGTERM');
});
} // end startServices
