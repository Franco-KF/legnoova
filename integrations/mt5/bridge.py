"""Loopback-only Legnoova signal relay. Configure credentials in environment, never source."""
import json
import hmac
import os
import secrets
import time
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
LAST_EA_DIAGNOSTIC = None


def app_origin():
    parsed = urlsplit(API_URL)
    return f"{parsed.scheme}://{parsed.netloc}" if parsed.scheme and parsed.netloc else ""


def upstream_diagnostics():
    if not API_URL or not DEVICE_TOKEN:
        return None, "bridge_credentials_missing"
    parsed = urlsplit(API_URL)
    if parsed.scheme != "https" and parsed.hostname not in {"localhost", "127.0.0.1"}:
        return None, "cloud_url_must_use_https"
    request = Request(API_URL + "/api/automation/diagnostics/device", method="GET",
                      headers={"Authorization": "Bearer " + DEVICE_TOKEN,
                               "Accept": "application/json"})
    try:
        with urlopen(request, timeout=8) as response:
            return json.loads(response.read().decode()), None
    except HTTPError as error:
        return None, "device_token_rejected" if error.code == 401 else "cloud_diagnostics_unavailable"
    except (URLError, RuntimeError, ValueError):
        return None, "cloud_diagnostics_unavailable"


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
        origin = self.headers.get("Origin", "")
        if origin and origin == app_origin():
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
            self.send_header("Access-Control-Allow-Private-Network", "true")
            self.send_header("Vary", "Origin")
        self.end_headers()
        self.wfile.write(encoded)

    def authorized_local_client(self):
        if not LOCAL_BRIDGE_TOKEN:
            return False
        supplied = self.headers.get("Authorization", "")
        return hmac.compare_digest(supplied, f"Bearer {LOCAL_BRIDGE_TOKEN}")

    def do_GET(self):
        if self.path == "/health":
            origin = self.headers.get("Origin", "")
            if origin and origin != app_origin():
                return self.respond(403, {"error": "origin_not_allowed"})
            diagnostics, error = upstream_diagnostics()
            last = LAST_EA_DIAGNOSTIC
            age = max(0, int(time.time() - last["seenAt"])) if last else None
            return self.respond(200, {
                "bridgeRunning": True,
                "configurationReady": bool(API_URL and DEVICE_TOKEN and LOCAL_BRIDGE_TOKEN),
                "eaConnected": age is not None and age <= 45,
                "eaLastSeenSecondsAgo": age,
                "ea": {key: value for key, value in last.items() if key != "seenAt"} if last else None,
                "cloud": diagnostics,
                "cloudError": error,
            })
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
        if self.path == "/diagnostic":
            global LAST_EA_DIAGNOSTIC
            try:
                length = int(self.headers.get("Content-Length", "0"))
                if length <= 0 or length > 2048:
                    return self.respond(400, {"error": "invalid request size"})
                payload = json.loads(self.rfile.read(length))
                expected = {"executionEnabled", "terminalTradeAllowed", "accountTradeAllowed", "expertTradeAllowed", "demoAccount", "liveTradingAllowed", "status"}
                if not isinstance(payload, dict) or set(payload) != expected:
                    return self.respond(400, {"error": "invalid diagnostic fields"})
                for key in expected - {"status"}:
                    if not isinstance(payload[key], bool):
                        return self.respond(400, {"error": "invalid diagnostic values"})
                if not isinstance(payload["status"], str) or len(payload["status"]) > 40:
                    return self.respond(400, {"error": "invalid diagnostic status"})
                LAST_EA_DIAGNOSTIC = {**payload, "seenAt": time.time()}
                return self.respond(200, {"recorded": True})
            except (ValueError, TypeError):
                return self.respond(400, {"error": "invalid diagnostic payload"})
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

    def do_OPTIONS(self):
        origin = self.headers.get("Origin", "")
        if self.path != "/health" or origin != app_origin():
            return self.respond(403, {"error": "origin_not_allowed"})
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", origin)
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Accept")
        self.send_header("Access-Control-Allow-Private-Network", "true")
        self.send_header("Access-Control-Max-Age", "600")
        self.send_header("Vary", "Origin")
        self.end_headers()


if __name__ == "__main__":
    if not LOCAL_BRIDGE_TOKEN:
        LOCAL_BRIDGE_TOKEN = load_or_create_local_token()
    HTTPServer((HOST, PORT), Handler).serve_forever()
