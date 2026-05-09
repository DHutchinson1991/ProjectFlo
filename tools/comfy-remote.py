"""
comfy-remote.py — Drop on the remote Windows 11 machine next to ComfyUI portable.

Launches ComfyUI headless, captures ALL stdout/stderr, and exposes HTTP
endpoints so the dev machine can stream logs in real time.

Endpoints (port 8001 by default):
    GET /logs/stream   SSE — real-time log stream (includes buffered history)
    GET /logs          Plain text dump (?since=HH:MM:SS filter supported)
    GET /health        JSON status { running, pid, uptime, restarts, lines }

Usage:
    python_embeded\\python.exe -s comfy-remote.py

Or via the included start-comfy.bat.

Only uses Python stdlib — no pip installs needed.
"""

import subprocess
import threading
import time
import json
import sys
import os
import io
from http.server import HTTPServer, BaseHTTPRequestHandler
from collections import deque
from datetime import datetime, timezone

# ── Windowless mode safety ───────────────────────────────────────────
# When launched via pythonw.exe or a hidden VBS wrapper, sys.stdout and
# sys.stderr may be None. Redirect to devnull so print() never crashes.
if sys.stdout is None:
    sys.stdout = open(os.devnull, "w")
if sys.stderr is None:
    sys.stderr = open(os.devnull, "w")

# ── CONFIG ───────────────────────────────────────────────────────────
# Edit these OR set environment variables.

PORTABLE_DIR = os.environ.get(
    "COMFY_PORTABLE_DIR",
    r"C:\Users\WORK\Documents\ComfyUI_windows_portable_nvidia\ComfyUI_windows_portable",
)
COMFY_PORT = os.environ.get("COMFY_PORT", "8000")
LOG_PORT = int(os.environ.get("COMFY_LOG_PORT", "8001"))
MAX_LOG_LINES = int(os.environ.get("COMFY_MAX_LOG_LINES", "10000"))

# Extra CLI flags for ComfyUI (edit as needed)
EXTRA_ARGS = [
    "--disable-cuda-malloc",
    "--force-fp16",
    "--fp16-vae",
]

# ── Derived paths ────────────────────────────────────────────────────
PYTHON_EXE = os.path.join(PORTABLE_DIR, "python_embeded", "python.exe")
MAIN_PY = os.path.join(PORTABLE_DIR, "ComfyUI", "main.py")

for label, p in [("Python", PYTHON_EXE), ("main.py", MAIN_PY)]:
    if not os.path.exists(p):
        print(f"[comfy-remote] ERROR: {label} not found at {p}")
        print(f"[comfy-remote] Set COMFY_PORTABLE_DIR or edit this script.")
        sys.exit(1)

# ── Log buffer ───────────────────────────────────────────────────────
log_buffer = deque(maxlen=MAX_LOG_LINES)
log_lock = threading.Lock()
sse_clients = []  # list of (wfile, lock) for active SSE connections
sse_lock = threading.Lock()


def push_log(source: str, text: str):
    """Add a log entry to the buffer and broadcast to SSE clients."""
    entry = {
        "ts": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z",
        "source": source,
        "text": text.rstrip(),
    }
    with log_lock:
        log_buffer.append(entry)

    # Print locally too
    tag = "comfy:err" if source == "stderr" else ("comfy:sys" if source == "system" else "comfy")
    print(f"[{tag}] {entry['text']}", flush=True)

    # Broadcast to SSE clients
    sse_data = f"data: {json.dumps(entry)}\n\n".encode("utf-8")
    dead = []
    with sse_lock:
        for i, (wfile, wlock) in enumerate(sse_clients):
            try:
                with wlock:
                    wfile.write(sse_data)
                    wfile.flush()
            except Exception:
                dead.append(i)
        for i in reversed(dead):
            sse_clients.pop(i)


# ── ComfyUI process management ──────────────────────────────────────
comfy_proc = None
comfy_started_at = None
restart_count = 0
MAX_RESTART_DELAY = 30
shutdown_flag = threading.Event()


def read_stream(stream, source: str):
    """Read lines from a subprocess stream and push to log buffer."""
    try:
        for raw_line in iter(stream.readline, b""):
            try:
                line = raw_line.decode("utf-8", errors="replace")
            except Exception:
                line = repr(raw_line)
            push_log(source, line)
    except Exception:
        pass
    finally:
        try:
            stream.close()
        except Exception:
            pass


def start_comfy():
    """Launch ComfyUI and wire up log capture."""
    global comfy_proc, comfy_started_at, restart_count

    args = [
        PYTHON_EXE, "-s",
        MAIN_PY,
        "--listen", "0.0.0.0",
        "--port", COMFY_PORT,
        "--disable-auto-launch",
        "--log-stdout",
        *EXTRA_ARGS,
    ]

    push_log("system", f"Starting ComfyUI: {' '.join(args)}")

    comfy_proc = subprocess.Popen(
        args,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        cwd=PORTABLE_DIR,
        creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0,
    )
    comfy_started_at = time.time()

    # Reader threads for stdout and stderr
    threading.Thread(target=read_stream, args=(comfy_proc.stdout, "stdout"), daemon=True).start()
    threading.Thread(target=read_stream, args=(comfy_proc.stderr, "stderr"), daemon=True).start()

    # Monitor thread — waits for exit, schedules restart
    def monitor():
        global comfy_proc, restart_count
        code = comfy_proc.wait()
        push_log("system", f"ComfyUI exited with code {code}")
        comfy_proc = None
        if not shutdown_flag.is_set():
            restart_count += 1
            delay = min(2 * (1.5 ** (restart_count - 1)), MAX_RESTART_DELAY)
            push_log("system", f"Restarting in {delay:.0f}s (attempt {restart_count})...")
            shutdown_flag.wait(timeout=delay)
            if not shutdown_flag.is_set():
                start_comfy()

    threading.Thread(target=monitor, daemon=True).start()


# ── HTTP server ──────────────────────────────────────────────────────

class LogHandler(BaseHTTPRequestHandler):
    """Handles /logs/stream (SSE), /logs (text), /health (JSON)."""

    # Suppress default logging — we have our own
    def log_message(self, format, *args):
        pass

    def do_GET(self):
        # Parse path (ignore query string for routing)
        path = self.path.split("?")[0]

        if path == "/logs/stream":
            self._handle_sse()
        elif path == "/logs":
            self._handle_logs()
        elif path == "/health":
            self._handle_health()
        else:
            self.send_response(404)
            self.send_header("Content-Type", "text/plain")
            self.end_headers()
            self.wfile.write(b"Endpoints: /logs/stream (SSE), /logs (text), /health (JSON)\n")

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")

    def _handle_sse(self):
        """Server-Sent Events — streams log entries in real time."""
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream")
        self.send_header("Cache-Control", "no-cache")
        self.send_header("Connection", "keep-alive")
        self._cors()
        self.end_headers()

        wlock = threading.Lock()

        # Send buffered history
        with log_lock:
            for entry in log_buffer:
                try:
                    with wlock:
                        self.wfile.write(f"data: {json.dumps(entry)}\n\n".encode("utf-8"))
                        self.wfile.flush()
                except Exception:
                    return

        # Register for live updates
        client = (self.wfile, wlock)
        with sse_lock:
            sse_clients.append(client)

        # Keep connection alive until client disconnects
        try:
            while not shutdown_flag.is_set():
                # Send a keepalive comment every 15s
                time.sleep(15)
                try:
                    with wlock:
                        self.wfile.write(b": keepalive\n\n")
                        self.wfile.flush()
                except Exception:
                    break
        finally:
            with sse_lock:
                if client in sse_clients:
                    sse_clients.remove(client)

    def _handle_logs(self):
        """Plain text log dump. Optional ?since=HH:MM:SS filter."""
        query = ""
        if "?" in self.path:
            query = self.path.split("?", 1)[1]

        since = None
        for param in query.split("&"):
            if param.startswith("since="):
                since = param[6:]

        self.send_response(200)
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        self._cors()
        self.end_headers()

        with log_lock:
            for entry in log_buffer:
                if since and entry["ts"] < since:
                    continue
                line = f"[{entry['ts']}] [{entry['source']}] {entry['text']}\n"
                self.wfile.write(line.encode("utf-8"))

    def _handle_health(self):
        """JSON health check."""
        running = comfy_proc is not None and comfy_proc.poll() is None
        data = {
            "running": running,
            "pid": comfy_proc.pid if comfy_proc else None,
            "uptime": int(time.time() - comfy_started_at) if comfy_started_at else 0,
            "restarts": restart_count,
            "lines": len(log_buffer),
            "comfyPort": COMFY_PORT,
        }
        body = json.dumps(data).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self._cors()
        self.end_headers()
        self.wfile.write(body)


class ThreadedHTTPServer(HTTPServer):
    """Handle each request in a new thread (needed for long-lived SSE)."""
    daemon_threads = True
    allow_reuse_address = True

    def process_request(self, request, client_address):
        t = threading.Thread(target=self.process_request_thread, args=(request, client_address))
        t.daemon = True
        t.start()

    def process_request_thread(self, request, client_address):
        try:
            self.finish_request(request, client_address)
        except Exception:
            self.handle_error(request, client_address)
        finally:
            self.shutdown_request(request)


# ── Main ─────────────────────────────────────────────────────────────

def main():
    print(f"[comfy-remote] Log server on 0.0.0.0:{LOG_PORT}")
    print(f"[comfy-remote]   SSE stream: http://0.0.0.0:{LOG_PORT}/logs/stream")
    print(f"[comfy-remote]   Log dump:   http://0.0.0.0:{LOG_PORT}/logs")
    print(f"[comfy-remote]   Health:     http://0.0.0.0:{LOG_PORT}/health")
    print(f"[comfy-remote] ComfyUI will listen on 0.0.0.0:{COMFY_PORT}")
    print()

    server = ThreadedHTTPServer(("0.0.0.0", LOG_PORT), LogHandler)
    server_thread = threading.Thread(target=server.serve_forever, daemon=True)
    server_thread.start()

    start_comfy()

    # Block until Ctrl+C
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        pass
    finally:
        print("\n[comfy-remote] Shutting down...")
        shutdown_flag.set()
        if comfy_proc and comfy_proc.poll() is None:
            comfy_proc.terminate()
            try:
                comfy_proc.wait(timeout=10)
            except subprocess.TimeoutExpired:
                comfy_proc.kill()
        server.shutdown()
        print("[comfy-remote] Done.")


if __name__ == "__main__":
    main()
