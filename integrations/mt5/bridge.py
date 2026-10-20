"""Loopback-only Legnoova signal relay. Configure credentials in environment, never source."""
import json
import hmac
import os
import secrets
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from urllib.parse import urlsplit
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

API_URL = os.environ.get("LEGNOOVA_API_URL", "").rstrip("/")
DEVICE_TOKEN = os.environ.get("LEGNOOVA_DEVICE_TOKEN", "")
HOST, PORT = "127.0.0.1", 8765


def load_or_create_local_token(path=None):
    """Persist a per-computer secret so restarting the relay does not break MT5."""
    override = os.environ.get("LEGNOOVA_BRIDGE_LOCAL_TOKEN")
    if override:
        return override
    token_path = Path(path) if path else Path.home() / ".legnoova" / "mt5-bridge-local-token"
    token_path.parent.mkdir(parents=True, exist_ok=True)
    try:
        with token_path.open("x", encoding="utf-8") as secret_file:
            token = secrets.token_urlsafe(32)
            secret_file.write(token)
        try:
            token_path.chmod(0o600)
        except OSError:
            pass  # Windows uses the current user's profile directory ACL.
        print(f"A local bridge token was saved to {token_path}. Copy its contents into the EA LocalBridgeToken input. Keep it private.")
    except FileExistsError:
        token = token_path.read_text(encoding="utf-8").strip()
    if len(token) < 32:
        raise RuntimeError("Local bridge token file is invalid; remove it and restart the bridge")
    return token


LOCAL_BRIDGE_TOKEN = os.environ.get("LEGNOOVA_BRIDGE_LOCAL_TOKEN", "")


def api(method="GET", payload=None):
    if not API_URL or not DEVICE_TOKEN:
        raise RuntimeError("Set LEGNOOVA_API_URL and LEGNOOVA_DEVICE_TOKEN")
    parsed = urlsplit(API_URL)
    if parsed.scheme != "https" and parsed.hostname not in {"localhost", "127.0.0.1"}:
        raise RuntimeError("LEGNOOVA_API_URL must use HTTPS")
    data = json.dumps(payload).encode() if payload is not None else None
    request = Request(API_URL + "/api/automation/device", data=data, method=method,
                      headers={"Authorization": "Bearer " + DEVICE_TOKEN,
                               "Content-Type": "application/json"})
    with urlopen(request, timeout=8) as response:
        return json.loads(response.read().decode())


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        # Keep request diagnostics, but never log headers or credential material.
        print("bridge", self.client_address[0], fmt % args)

    def respond(self, code, value):
        encoded = json.dumps(value).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)

    def authorized_local_client(self):
        if not LOCAL_BRIDGE_TOKEN:
            return False
        supplied = self.headers.get("Authorization", "")
        return hmac.compare_digest(supplied, f"Bearer {LOCAL_BRIDGE_TOKEN}")

    def do_GET(self):
        if not self.authorized_local_client():
            return self.respond(401, {"error": "unauthorized"})
        if self.path != "/signal":
            return self.respond(404, {"error": "not found"})
        try:
            self.respond(200, api())
        except (HTTPError, URLError, RuntimeError, ValueError):
            self.respond(502, {"error": "upstream unavailable"})

    def do_POST(self):
        if not self.authorized_local_client():
            return self.respond(401, {"error": "unauthorized"})
        if self.path != "/ack":
            return self.respond(404, {"error": "not found"})
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length <= 0 or length > 4096:
                return self.respond(400, {"error": "invalid request size"})
            payload = json.loads(self.rfile.read(length))
            self.respond(200, api("POST", payload))
        except (HTTPError, URLError, RuntimeError, ValueError):
            self.respond(502, {"error": "upstream unavailable or invalid acknowledgement"})


if __name__ == "__main__":
    if not LOCAL_BRIDGE_TOKEN:
        LOCAL_BRIDGE_TOKEN = load_or_create_local_token()
    HTTPServer((HOST, PORT), Handler).serve_forever()
