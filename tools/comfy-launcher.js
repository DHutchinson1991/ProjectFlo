const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Load .env from packages/backend/.env (same source of truth as the backend)
const envPath = path.join(__dirname, '..', 'packages', 'backend', '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx < 0) continue;
    const key = trimmed.slice(0, eqIdx);
    const val = trimmed.slice(eqIdx + 1);
    if (!process.env[key]) process.env[key] = val;
  }
}

// ── Mode: "local" or "remote" ───────────────────────────────────────
// local  = launch ComfyUI on this machine
// remote = assume ComfyUI is already running on a LAN machine; poll until reachable
const MODE = process.env.COMFY_MODE || 'remote';

// ── Remote config ───────────────────────────────────────────────────
const REMOTE_HOST = process.env.COMFY_REMOTE_HOST || '192.168.1.125';
const COMFY_PORT = process.env.COMFY_PORT || '8000';
const COMFY_LOG_PORT = process.env.COMFY_LOG_PORT || '8001';
const LMS_LOG_PORT = process.env.LMS_LOG_PORT || '8002';

// ── Local config (original paths) ───────────────────────────────────
const PYTHON = 'C:/Users/works/Documents/ComfyUI/.venv/Scripts/python.exe';
const MAIN_PY = 'C:/Users/works/AppData/Local/Programs/ComfyUI/resources/ComfyUI/main.py';
const BASE_DIR = 'C:/Users/works/Documents/ComfyUI';
const FRONTEND_ROOT = 'C:/Users/works/AppData/Local/Programs/ComfyUI/resources/ComfyUI/web_custom_versions/desktop_app';

let child;

if (MODE === 'remote') {
  // Remote mode — both ComfyUI and LM Studio run on another machine.
  // We connect to SSE log streams on separate ports for real-time logs.
  const statsUrl = `http://${REMOTE_HOST}:${COMFY_PORT}/system_stats`;
  const comfyLogUrl = `http://${REMOTE_HOST}:${COMFY_LOG_PORT}/logs/stream`;
  const lmsLogUrl = `http://${REMOTE_HOST}:${LMS_LOG_PORT}/logs/stream`;

  console.log(`[remote] ComfyUI at ${REMOTE_HOST}:${COMFY_PORT} (logs :${COMFY_LOG_PORT})`);
  console.log(`[remote] LM Studio at ${REMOTE_HOST}:1234 (logs :${LMS_LOG_PORT})`);

  const http = require('http');
  let comfyReady = false;

  // ── Generic SSE connector ───────────────────────────────────────
  // Creates a self-reconnecting SSE stream that tags log lines with a prefix.
  function connectSSE(url, prefix, tagMap) {
    let connected = false;

    function connect() {
      if (connected) return;
      http.get(url, (res) => {
        if (res.statusCode !== 200) {
          res.resume();
          setTimeout(connect, 5000);
          return;
        }
        connected = true;
        console.log(`[${prefix}] ✓ Connected to log stream`);

        let buffer = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          buffer += chunk;
          const parts = buffer.split('\n\n');
          buffer = parts.pop();
          for (const part of parts) {
            if (!part.startsWith('data: ')) continue;
            try {
              const entry = JSON.parse(part.slice(6));
              const tag = tagMap[entry.source] || prefix;
              const ts = entry.ts ? entry.ts.split('T')[1]?.replace('Z', '') || '' : '';
              console.log(`[${tag}] ${ts ? ts + ' ' : ''}${entry.text}`);
            } catch { /* ignore malformed */ }
          }
        });

        res.on('end', () => {
          connected = false;
          console.warn(`[${prefix}] ⚠ Log stream disconnected. Reconnecting in 3s...`);
          setTimeout(connect, 3000);
        });

        res.on('error', () => {
          connected = false;
          setTimeout(connect, 5000);
        });
      }).on('error', () => {
        connected = false;
        setTimeout(connect, 5000);
      });
    }

    connect();
  }

  // ── Connect to ComfyUI logs (port 8001) ─────────────────────────
  connectSSE(comfyLogUrl, 'comfy', {
    stdout: 'comfy',
    stderr: 'comfy:err',
    system: 'comfy:sys',
  });

  // ── Connect to LM Studio logs (port 8002) ──────────────────────
  connectSSE(lmsLogUrl, 'gemma', {
    stdout: 'gemma',
    stderr: 'gemma:err',
    system: 'gemma:sys',
    logfile: 'gemma:log',
  });

  // ── ComfyUI health poll (for concurrently) ──────────────────────
  function checkHealth() {
    http.get(statsUrl, (res) => {
      if (!comfyReady) {
        comfyReady = true;
        console.log(`[comfy] ✓ Remote ComfyUI is online at http://${REMOTE_HOST}:${COMFY_PORT}`);
      }
      res.resume();
      setTimeout(checkHealth, 30000);
    }).on('error', () => {
      if (comfyReady) {
        console.warn(`[comfy] ⚠ Remote ComfyUI went offline. Waiting for reconnect...`);
        comfyReady = false;
      }
      setTimeout(checkHealth, 5000);
    });
  }

  // Start all
  checkHealth();

  // Keep process alive for concurrently
  process.on('SIGINT', () => process.exit(0));
  process.on('SIGTERM', () => process.exit(0));
} else {
  // Local mode — original behaviour
  console.log(`[comfy] Starting ComfyUI locally (port ${COMFY_PORT})...`);
  child = spawn(PYTHON, [
    MAIN_PY,
    '--user-directory', `${BASE_DIR}/user`,
    '--input-directory', `${BASE_DIR}/input`,
    '--output-directory', `${BASE_DIR}/output`,
    '--base-directory', BASE_DIR,
    '--front-end-root', FRONTEND_ROOT,
    '--extra-model-paths-config', 'C:/Users/works/AppData/Roaming/ComfyUI/extra_models_config.yaml',
    '--log-stdout',
    '--listen', '127.0.0.1',
    '--port', COMFY_PORT,
    '--enable-manager',
    '--disable-cuda-malloc',
    '--force-fp16',
    '--fp16-vae',
  ], {
    stdio: 'inherit',
    cwd: BASE_DIR,
  });
}

function cleanup() {
  try {
    if (child) child.kill('SIGTERM');
  } catch {
    // Already dead
  }
  process.exit(0);
}

if (child) {
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('exit', cleanup);

  child.on('error', (err) => {
    console.error(`[comfy] Failed to start ComfyUI: ${err.message}`);
    process.exit(1);
  });

  child.on('exit', (code) => {
    process.exit(code ?? 0);
  });
}
