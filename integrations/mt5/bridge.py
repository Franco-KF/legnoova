"""Loopback-only Legnoova signal relay with WebSocket, retry, and offline queue.

Configure credentials via environment variables. Never commit secrets.
"""
import json
import hmac
import math
import os
import secrets
import ssl
import time
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

try:
    import websocket  # type: ignore
except Exception:  # pragma: no cover - optional dependency
    websocket = None

API_URL = os.environ.get("LEGNOOVA_API_URL", "").rstrip("/")
DEVICE_TOKEN = os.environ.get("LEGNOOVA_DEVICE_TOKEN", "")
WS_URL = os.environ.get("LEGNOOVA_WS_URL", "")
HOST, PORT = "127.0.0.1", 8765
OFFLINE_QUEUE_DIR = Path.home() / ".legnoova" / "mt5-offline-queue"
MAX_QUEUE_ATTEMPTS = 5
RETRY_BASE_DELAY = 1.0
RETRY_MAX_DELAY = 30.0
HEALTH_STALE_SECONDS = 45


def load_or_create_local_token(path=None):
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
            pass
        print(f"A local bridge token was saved to {token_path}. Copy its contents into the EA LocalBridgeToken input. Keep it private.")
    except FileExistsError:
        token = token_path.read_text(encoding="utf-8").strip()
    if len(token) < 32:
        raise RuntimeError("Local bridge token file is invalid; remove it and restart the bridge")
    return token


LOCAL_BRIDGE_TOKEN = os.environ.get("LEGNOOVA_BRIDGE_LOCAL_TOKEN", "")
LAST_EA_DIAGNOSTIC = None
LAST_EA_LOCAL_ERROR = None
LAST_EA_CLOUD_REPORTED = False
LAST_EA_CLOUD_ERROR = None
QUEUE_LOCK = threading.Lock()


def ensure_queue_dir():
    OFFLINE_QUEUE_DIR.mkdir(parents=True, exist_ok=True)


def queue_item(type_name, payload):
    ensure_queue_dir()
    item = {
        "id": f"{type_name}-{int(time.time()*1000)}-{secrets.token_hex(4)}",
        "type": type_name,
        "payload": payload,
        "createdAt": time.time(),
        "attempts": 0,
    }
    file_path = OFFLINE_QUEUE_DIR / f"{item['id']}.json"
    with file_path.open("w", encoding="utf-8") as f:
        json.dump(item, f)
    return item["id"]


def list_queue():
    ensure_queue_dir()
    items = []
    try:
        for f in sorted(OFFLINE_QUEUE_DIR.iterdir()):
            if f.suffix != ".json":
                continue
            try:
                item = json.loads(f.read_text(encoding="utf-8"))
                item["path"] = str(f)
                items.append(item)
            except Exception:
                continue
    except FileNotFoundError:
        pass
    return sorted(items, key=lambda x: x.get("createdAt", 0))


def remove_queue_item(item_id):
    try:
        (OFFLINE_QUEUE_DIR / f"{item_id}.json").unlink()
    except FileNotFoundError:
        pass


def app_origin():
    parsed = urlsplit(API_URL)
    return f"{parsed.scheme}://{parsed.netloc}" if parsed.scheme and parsed.netloc else ""


def api(method="GET", payload=None, path="/api/automation/device", retries=3):
    if not API_URL or not DEVICE_TOKEN:
        raise RuntimeError("Set LEGNOOVA_API_URL and LEGNOOVA_DEVICE_TOKEN")
    parsed = urlsplit(API_URL)
    if parsed.scheme != "https" and parsed.hostname not in {"localhost", "127.0.0.1"}:
        raise RuntimeError("LEGNOOVA_API_URL must use HTTPS")
    data = json.dumps(payload).encode() if payload is not None else None
    request = Request(API_URL + path, data=data, method=method,
                      headers={"Authorization": "Bearer " + DEVICE_TOKEN,
                               "Content-Type": "application/json"})
    last_error = None
    for attempt in range(1, retries + 1):
        try:
            with urlopen(request, timeout=8) as response:
                return json.loads(response.read().decode())
        except HTTPError as error:
            last_error = error
            if error.code in (400, 401, 403, 404, 409):
                raise
            if attempt == retries:
                raise
        except (URLError, TimeoutError) as error:
            last_error = error
            if attempt == retries:
                raise
        delay = min(RETRY_BASE_DELAY * (2 ** (attempt - 1)), RETRY_MAX_DELAY)
        time.sleep(delay)
    raise last_error if last_error else RuntimeError("api request failed")


def flush_queue():
    """Attempt to deliver any queued offline items to the cloud."""
    with QUEUE_LOCK:
        for item in list_queue():
            try:
                attempts = item.get("attempts", 0) + 1
                if attempts > MAX_QUEUE_ATTEMPTS:
                    remove_queue_item(item["id"])
                    continue
                item["attempts"] = attempts
                file_path = item.get("path")
                if file_path:
                    try:
                        with open(file_path, "w", encoding="utf-8") as f:
                            json.dump(item, f)
                    except Exception:
                        pass
                if item["type"] == "diagnostic":
                    api("POST", item["payload"], "/api/automation/diagnostics/device")
                elif item["type"] == "event":
                    api("POST", item["payload"], "/api/automation/events/device")
                elif item["type"] == "ack":
                    api("POST", item["payload"], "/api/automation/device")
                remove_queue_item(item["id"])
            except Exception:
                # leave in queue for next flush
                continue


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


def validate_ea_diagnostic(payload):
    expected = {"executionEnabled", "terminalTradeAllowed", "accountTradeAllowed", "expertTradeAllowed", "demoAccount", "chartM1", "liveTradingAllowed", "accountCurrency", "eaOpenPositions", "eaFloatingProfit", "status"}
    if not isinstance(payload, dict) or set(payload) != expected:
        raise ValueError("invalid diagnostic fields")
    bool_fields = expected - {"status", "accountCurrency", "eaOpenPositions", "eaFloatingProfit"}
    if any(not isinstance(payload[key], bool) for key in bool_fields):
        raise ValueError("invalid diagnostic values")
    if isinstance(payload["eaOpenPositions"], bool) or not isinstance(payload["eaOpenPositions"], int) or not 0 <= payload["eaOpenPositions"] <= 100:
        raise ValueError("invalid diagnostic positions")
    if isinstance(payload["eaFloatingProfit"], bool) or not isinstance(payload["eaFloatingProfit"], (int, float)) or not math.isfinite(payload["eaFloatingProfit"]):
        raise ValueError("invalid diagnostic floating profit")
    if not isinstance(payload["accountCurrency"], str) or len(payload["accountCurrency"]) > 10 or any(not (ch.isascii() and (ch.isalnum() or ch in "._-")) for ch in payload["accountCurrency"]):
        raise ValueError("invalid diagnostic currency")
    if not isinstance(payload["status"], str) or len(payload["status"]) > 40:
        raise ValueError("invalid diagnostic status")
    return payload


def validate_trade_event(payload):
    expected = {"signalId", "dealId", "brokerOrderId", "eventType", "symbol", "currency", "volume", "price", "netProfit", "occurredAt"}
    if not isinstance(payload, dict) or set(payload) != expected:
        raise ValueError("invalid trade event fields")
    if not isinstance(payload["signalId"], str) or len(payload["signalId"]) != 24 or not all(ch in "0123456789abcdefABCDEF" for ch in payload["signalId"]):
        raise ValueError("invalid trade event signal")
    if not isinstance(payload["dealId"], str) or not payload["dealId"].isdigit() or len(payload["dealId"]) > 80:
        raise ValueError("invalid trade event deal id")
    if not isinstance(payload["brokerOrderId"], str) or len(payload["brokerOrderId"]) > 80:
        raise ValueError("invalid trade event order id")
    if payload["eventType"] not in {"entry", "exit"}:
        raise ValueError("invalid trade event type")
    if not isinstance(payload["symbol"], str) or not 1 <= len(payload["symbol"]) <= 32 or any(not (ch.isascii() and (ch.isalnum() or ch in "._-")) for ch in payload["symbol"]):
        raise ValueError("invalid trade event symbol")
    if not isinstance(payload["currency"], str) or len(payload["currency"]) > 10 or any(not (ch.isascii() and (ch.isalnum() or ch in "._-")) for ch in payload["currency"]):
        raise ValueError("invalid trade event currency")
    for field in ("volume", "price", "netProfit"):
        if isinstance(payload[field], bool) or not isinstance(payload[field], (int, float)) or not math.isfinite(payload[field]):
            raise ValueError("invalid trade event number")
    if isinstance(payload["occurredAt"], bool) or not isinstance(payload["occurredAt"], int):
        raise ValueError("invalid trade event number")
    if payload["volume"] <= 0 or payload["price"] <= 0 or payload["occurredAt"] <= 0:
        raise ValueError("invalid trade event values")
    return payload


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        print("bridge", self.client_address[0], fmt % args)

    def respond(self, code, value):
        encoded = json.dumps(value).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(encoded)))
        origin = self.headers.get("Origin", "")
        if origin and origin == app_origin():
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
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
            queue_len = len(list_queue())
            return self.respond(200, {
                "bridgeRunning": True,
                "configurationReady": bool(API_URL and DEVICE_TOKEN and LOCAL_BRIDGE_TOKEN),
                "eaConnected": age is not None and age <= HEALTH_STALE_SECONDS,
                "eaLastSeenSecondsAgo": age,
                "ea": {key: value for key, value in last.items() if key != "seenAt"} if last else None,
                "eaLocalError": LAST_EA_LOCAL_ERROR,
                "eaCloudReported": LAST_EA_CLOUD_REPORTED,
                "eaCloudError": LAST_EA_CLOUD_ERROR,
                "cloud": diagnostics,
                "cloudError": error,
                "offlineQueueLength": queue_len,
                "wsUrl": WS_URL or None,
            })
        if not self.authorized_local_client():
            return self.respond(401, {"error": "unauthorized"})
        if self.path == "/signal":
            try:
                flush_queue()
                self.respond(200, api())
            except (HTTPError, URLError, RuntimeError, ValueError) as error:
                self.respond(502, {"error": "upstream unavailable", "detail": str(error)[:120]})
        else:
            return self.respond(404, {"error": "not found"})

    def do_POST(self):
        if not self.authorized_local_client():
            return self.respond(401, {"error": "unauthorized"})
        if self.path == "/diagnostic":
            global LAST_EA_DIAGNOSTIC, LAST_EA_LOCAL_ERROR, LAST_EA_CLOUD_REPORTED, LAST_EA_CLOUD_ERROR
            try:
                length = int(self.headers.get("Content-Length", "0"))
                if length <= 0 or length > 2048:
                    LAST_EA_LOCAL_ERROR = "invalid_request_size"
                    return self.respond(400, {"error": "invalid request size"})
                payload = validate_ea_diagnostic(json.loads(self.rfile.read(length)))
                LAST_EA_DIAGNOSTIC = {**payload, "seenAt": time.time()}
                LAST_EA_LOCAL_ERROR = None
            except (ValueError, TypeError) as error:
                LAST_EA_LOCAL_ERROR = str(error)[:120]
                return self.respond(400, {"error": "invalid diagnostic payload"})
            try:
                api("POST", payload, "/api/automation/diagnostics/device")
                LAST_EA_CLOUD_REPORTED = True
                LAST_EA_CLOUD_ERROR = None
                return self.respond(200, {"recorded": True, "cloudReported": True})
            except HTTPError as error:
                LAST_EA_CLOUD_REPORTED = False
                LAST_EA_CLOUD_ERROR = f"cloud_http_{error.code}"
                queue_item("diagnostic", payload)
                return self.respond(502, {"recorded": True, "cloudReported": False, "cloudError": LAST_EA_CLOUD_ERROR, "queued": True})
            except (URLError, RuntimeError, ValueError) as error:
                LAST_EA_CLOUD_REPORTED = False
                LAST_EA_CLOUD_ERROR = "cloud_unavailable"
                queue_item("diagnostic", payload)
                return self.respond(502, {"recorded": True, "cloudReported": False, "cloudError": LAST_EA_CLOUD_ERROR, "queued": True})
        elif self.path == "/event":
            try:
                length = int(self.headers.get("Content-Length", "0"))
                if length <= 0 or length > 4096:
                    return self.respond(400, {"error": "invalid request size"})
                payload = validate_trade_event(json.loads(self.rfile.read(length)))
            except (ValueError, TypeError):
                self.respond(400, {"error": "invalid trade event"})
                return
            try:
                self.respond(200, api("POST", payload, "/api/automation/events/device"))
            except (HTTPError, URLError, RuntimeError, ValueError) as error:
                queue_item("event", payload)
                self.respond(502, {"error": "upstream unavailable", "queued": True, "detail": str(error)[:120]})
            return
        elif self.path == "/ack":
            try:
                length = int(self.headers.get("Content-Length", "0"))
                if length <= 0 or length > 4096:
                    return self.respond(400, {"error": "invalid request size"})
                payload = json.loads(self.rfile.read(length))
                self.respond(200, api("POST", payload))
            except (HTTPError, URLError, RuntimeError, ValueError) as error:
                queue_item("ack", payload)
                self.respond(502, {"error": "upstream unavailable", "queued": True, "detail": str(error)[:120]})
        else:
            return self.respond(404, {"error": "not found"})

    def do_OPTIONS(self):
        origin = self.headers.get("Origin", "")
        if self.path != "/health" or origin != app_origin():
            return self.respond(403, {"error": "origin_not_allowed"})
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", origin)
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Accept, Content-Type, Authorization")
        self.send_header("Access-Control-Allow-Private-Network", "true")
        self.send_header("Access-Control-Max-Age", "600")
        self.send_header("Vary", "Origin")
        self.end_headers()


class BridgeHTTPServer(ThreadingHTTPServer):
    daemon_threads = True
    request_queue_size = 64


def ws_loop():
    """Optional WebSocket client for real-time signal streaming from cloud."""
    if websocket is None or not WS_URL:
        return
    while True:
        try:
            ws = websocket.create_connection(WS_URL, header=[f"Authorization: Bearer {DEVICE_TOKEN}"], timeout=10)
            print("Legnoova WebSocket connected:", WS_URL)
            while True:
                try:
                    msg = ws.recv()
                    if msg is None:
                        break
                    data = json.loads(msg)
                    if data.get("type") == "signal":
                        flush_queue()
                        try:
                            api("GET", path="/api/automation/device")
                        except Exception:
                            pass
                except Exception:
                    break
            ws.close()
        except Exception:
            pass
        time.sleep(5)


if __name__ == "__main__":
    if not LOCAL_BRIDGE_TOKEN:
        LOCAL_BRIDGE_TOKEN = load_or_create_local_token()
    if WS_URL and websocket:
        threading.Thread(target=ws_loop, daemon=True).start()
    # Flush any pending offline queue items on startup
    flush_queue()
    BridgeHTTPServer((HOST, PORT), Handler).serve_forever()
