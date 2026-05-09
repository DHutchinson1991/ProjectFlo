"""
lmstudio-remote.py — Drop on the remote Windows 11 machine.

LM Studio manages its own startup via the "headless" setting in its UI.
This script ONLY tails LM Studio's log files and streams them over HTTP
so the dev machine gets full visibility.

Endpoints (port 8002 by default):
    GET /logs/stream   SSE — real-time log stream (includes buffered history)
    GET /logs          Plain text dump (?since=HH:MM:SS filter supported)
    GET /health        JSON status { lmsResponding, model, lines }

Usage:
    python lmstudio-remote.py
    (or launched via start-all-hidden.vbs)

Only uses Python stdlib — no pip installs needed.
"""

import threading
import time
import json
import sys
import os
import glob
import urllib.request
from http.server import HTTPServer, BaseHTTPRequestHandler
from collections import deque
from datetime import datetime, timezone

# ── Windowless mode safety ───────────────────────────────────────────
if sys.stdout is None:
    sys.stdout = open(os.devnull, "w")
if sys.stderr is None:
    sys.stderr = open(os.devnull, "w")

# ── CONFIG ───────────────────────────────────────────────────────────
LMS_PORT = os.environ.get("LMS_PORT", "1234")
LOG_PORT = int(os.environ.get("LMS_LOG_PORT", "8002"))
MAX_LOG_LINES = int(os.environ.get("LMS_MAX_LOG_LINES", "10000"))

# LM Studio log directory (default location on Windows)
LMS_LOG_DIR = os.environ.get(
    "LMS_LOG_DIR",
    os.path.join(os.path.expanduser("~"), ".lmstudio", "logs"),
)

# ── Log buffer ───────────────────────────────────────────────────────
log_buffer = deque(maxlen=MAX_LOG_LINES)
log_lock = threading.Lock()
sse_clients = []
sse_lock = threading.Lock()
shutdown_flag = threading.Event()


def push_log(source: str, text: str):
    """Add a log entry and broadcast to SSE clients."""
    entry = {
        "ts": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z",
        "source": source,
        "text": text.rstrip(),
    }
    with log_lock:
        log_buffer.append(entry)

    tag = {"system": "lms:sys", "logfile": "lms:log"}.get(source, "lms")
    print(f"[{tag}] {entry['text']}", flush=True)

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


# ── Health check (monitor only, no management) ──────────────────────
lms_responding = False
lms_model = None


def check_lms_health():
    """Periodically check if LM Studio is responding and which model is loaded."""
    global lms_responding, lms_model
    url = f"http://localhost:{LMS_PORT}/v1/models"

    while not shutdown_flag.is_set():
        try:
            req = urllib.request.urlopen(url, timeout=5)
            data = json.loads(req.read().decode("utf-8"))
            req.close()
            models = [m.get("id", "unknown") for m in data.get("data", [])]
            if not lms_responding:
                push_log("system", f"LM Studio is responding. Models: {', '.join(models) or 'none loaded'}")
            lms_responding = True
            lms_model = models[0] if models else None
        except Exception:
            if lms_responding:
                push_log("system", "LM Studio stopped responding")
            lms_responding = False
            lms_model = None

        shutdown_flag.wait(timeout=15)


# ── Log file tailer ─────────────────────────────────────────────────

def find_latest_log_file(log_dir: str) -> str:
    """Find the most recently modified .log file in the directory."""
    if not os.path.isdir(log_dir):
        return ""
    log_files = glob.glob(os.path.join(log_dir, "*.log"))
    if not log_files:
        log_files = glob.glob(os.path.join(log_dir, "**", "*.log"), recursive=True)
    if not log_files:
        return ""
    return max(log_files, key=os.path.getmtime)


def tail_log_files():
    """Watch LM Studio log files and push new lines to the buffer."""
    push_log("system", f"Watching LM Studio logs in: {LMS_LOG_DIR}")

    current_file = ""
    current_pos = 0

    while not shutdown_flag.is_set():
        shutdown_flag.wait(timeout=2)
        if shutdown_flag.is_set():
            break

        latest = find_latest_log_file(LMS_LOG_DIR)
        if not latest:
            continue

        if latest != current_file:
            if current_file:
                push_log("system", f"--- Switched to log file: {os.path.basename(latest)} ---")
            else:
                push_log("system", f"--- Tailing: {os.path.basename(latest)} ---")
            current_file = latest
            try:
                current_pos = os.path.getsize(current_file)
            except OSError:
                current_pos = 0

        try:
            size = os.path.getsize(current_file)
            if size < current_pos:
                current_pos = 0
            if size > current_pos:
                with open(current_file, "r", encoding="utf-8", errors="replace") as f:
                    f.seek(current_pos)
                    new_content = f.read()
                    current_pos = f.tell()
                for line in new_content.strip().split("\n"):
                    if line.strip():
                        push_log("logfile", line)
        except OSError:
            pass


# ── HTTP server ──────────────────────────────────────────────────────

class LogHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

    def do_GET(self):
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
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream")
        self.send_header("Cache-Control", "no-cache")
        self.send_header("Connection", "keep-alive")
        self._cors()
        self.end_headers()

        wlock = threading.Lock()
        with log_lock:
            for entry in log_buffer:
                try:
                    with wlock:
                        self.wfile.write(f"data: {json.dumps(entry)}\n\n".encode("utf-8"))
                        self.wfile.flush()
                except Exception:
                    return

        client = (self.wfile, wlock)
        with sse_lock:
            sse_clients.append(client)

        try:
            while not shutdown_flag.is_set():
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
        data = {
            "lmsResponding": lms_responding,
            "model": lms_model,
            "lines": len(log_buffer),
            "lmsPort": LMS_PORT,
        }
        body = json.dumps(data).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self._cors()
        self.end_headers()
        self.wfile.write(body)


class ThreadedHTTPServer(HTTPServer):
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
    print(f"[lms-remote] Log server on 0.0.0.0:{LOG_PORT}")
    print(f"[lms-remote]   SSE stream: http://0.0.0.0:{LOG_PORT}/logs/stream")
    print(f"[lms-remote]   Log dump:   http://0.0.0.0:{LOG_PORT}/logs")
    print(f"[lms-remote]   Health:     http://0.0.0.0:{LOG_PORT}/health")
    print(f"[lms-remote] Monitoring LM Studio on localhost:{LMS_PORT}")
    print(f"[lms-remote] Tailing logs from: {LMS_LOG_DIR}")
    print()

    server = ThreadedHTTPServer(("0.0.0.0", LOG_PORT), LogHandler)
    threading.Thread(target=server.serve_forever, daemon=True).start()

    # Start log tailer and health monitor
    threading.Thread(target=tail_log_files, daemon=True).start()
    threading.Thread(target=check_lms_health, daemon=True).start()

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        pass
    finally:
        print("\n[lms-remote] Shutting down...")
        shutdown_flag.set()
        server.shutdown()
        print("[lms-remote] Done.")


if __name__ == "__main__":
    main()

if __name__ == "__main__":
    main()
