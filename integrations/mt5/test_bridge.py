import json
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest
from unittest.mock import patch
from http.server import ThreadingHTTPServer

import bridge


class BridgeTests(unittest.TestCase):
    def test_bridge_server_is_threaded_for_parallel_signal_and_heartbeat_requests(self):
        self.assertTrue(issubclass(bridge.BridgeHTTPServer, ThreadingHTTPServer))
        self.assertTrue(bridge.BridgeHTTPServer.daemon_threads)

    def test_api_sends_bearer_token_without_printing_it(self):
        bridge.API_URL = "https://example.test"
        bridge.DEVICE_TOKEN = "test-secret"

        class Response:
            def __enter__(self): return self
            def __exit__(self, *args): pass
            def read(self): return b'{"signal":null}'

        with patch.object(bridge, "urlopen", return_value=Response()) as open_url:
            self.assertEqual(bridge.api(), {"signal": None})
        request = open_url.call_args.args[0]
        self.assertEqual(request.get_header("Authorization"), "Bearer test-secret")
        self.assertNotIn("test-secret", repr(request.full_url))

    def test_ack_payload_is_json_encoded(self):
        bridge.API_URL = "https://example.test"
        bridge.DEVICE_TOKEN = "token"

        class Response:
            def __enter__(self): return self
            def __exit__(self, *args): pass
            def read(self): return b'{"acknowledged":true}'

        payload = {"signalId": "abc", "status": "execution_off"}
        with patch.object(bridge, "urlopen", return_value=Response()) as open_url:
            bridge.api("POST", payload)
        self.assertEqual(json.loads(open_url.call_args.args[0].data), payload)

    def test_api_can_forward_heartbeat_and_trade_events_to_separate_routes(self):
        bridge.API_URL = "https://example.test"
        bridge.DEVICE_TOKEN = "token"

        class Response:
            def __enter__(self): return self
            def __exit__(self, *args): pass
            def read(self): return b'{"recorded":true}'

        with patch.object(bridge, "urlopen", return_value=Response()) as open_url:
            bridge.api("POST", {"status": "polling"}, "/api/automation/diagnostics/device")
            self.assertTrue(open_url.call_args.args[0].full_url.endswith("/api/automation/diagnostics/device"))
            bridge.api("POST", {"dealId": "123"}, "/api/automation/events/device")
            self.assertTrue(open_url.call_args.args[0].full_url.endswith("/api/automation/events/device"))

    def test_local_bridge_requires_its_separate_token(self):
        handler = object.__new__(bridge.Handler)
        bridge.LOCAL_BRIDGE_TOKEN = "local-secret"
        handler.headers = {"Authorization": "Bearer local-secret"}
        self.assertTrue(handler.authorized_local_client())
        handler.headers = {"Authorization": "Bearer wrong"}
        self.assertFalse(handler.authorized_local_client())

    def test_remote_api_rejects_plain_http_off_loopback(self):
        bridge.API_URL = "http://example.test"
        bridge.DEVICE_TOKEN = "test-secret"
        with self.assertRaisesRegex(RuntimeError, "HTTPS"):
            bridge.api()

    def test_local_bridge_token_is_persisted_for_restart(self):
        with TemporaryDirectory() as directory:
            token_path = Path(directory) / "local-token"
            first = bridge.load_or_create_local_token(token_path)
            second = bridge.load_or_create_local_token(token_path)
            self.assertEqual(first, second)
            self.assertGreaterEqual(len(first), 32)

    def test_local_bridge_requires_a_secret_bearer_token(self):
        handler = object.__new__(bridge.Handler)
        bridge.LOCAL_BRIDGE_TOKEN = "local-secret"
        handler.headers = {"Authorization": "Bearer local-secret"}
        self.assertTrue(handler.authorized_local_client())
        handler.headers = {"Authorization": "Bearer wrong-secret"}
        self.assertFalse(handler.authorized_local_client())

    def test_cloud_api_requires_https_outside_local_development(self):
        bridge.API_URL = "http://example.com"
        bridge.DEVICE_TOKEN = "test-secret"
        with self.assertRaisesRegex(RuntimeError, "HTTPS"):
            bridge.api()

    def test_health_origin_matches_configured_site_origin(self):
        bridge.API_URL = "https://legnoova.com/"
        self.assertEqual(bridge.app_origin(), "https://legnoova.com")

    def test_diagnostics_call_is_read_only_and_keeps_token_out_of_url(self):
        bridge.API_URL = "https://legnoova.com"
        bridge.DEVICE_TOKEN = "diagnostic-secret"

        class Response:
            def __enter__(self): return self
            def __exit__(self, *args): pass
            def read(self): return b'{"queuedSignals":0}'

        with patch.object(bridge, "urlopen", return_value=Response()) as open_url:
            result, error = bridge.upstream_diagnostics()
        self.assertEqual(result, {"queuedSignals": 0})
        self.assertIsNone(error)
        request = open_url.call_args.args[0]
        self.assertTrue(request.full_url.endswith("/api/automation/diagnostics/device"))
        self.assertEqual(request.get_header("Authorization"), "Bearer diagnostic-secret")
        self.assertNotIn("diagnostic-secret", request.full_url)

    def test_diagnostics_reject_plain_http_for_remote_cloud(self):
        bridge.API_URL = "http://example.com"
        bridge.DEVICE_TOKEN = "test-secret"
        result, error = bridge.upstream_diagnostics()
        self.assertIsNone(result)
        self.assertEqual(error, "cloud_url_must_use_https")

    def test_ea_diagnostic_contract_requires_chart_period_and_boolean_flags(self):
        payload = {
            "executionEnabled": False,
            "terminalTradeAllowed": True,
            "accountTradeAllowed": True,
            "expertTradeAllowed": True,
            "demoAccount": True,
            "chartM1": True,
            "liveTradingAllowed": False,
            "accountCurrency": "USD",
            "eaOpenPositions": 0,
            "eaFloatingProfit": 0.0,
            "status": "execution_off",
        }
        self.assertEqual(bridge.validate_ea_diagnostic(payload), payload)
        with self.assertRaisesRegex(ValueError, "invalid diagnostic fields"):
            bridge.validate_ea_diagnostic({key: value for key, value in payload.items() if key != "chartM1"})
        payload["chartM1"] = "yes"
        with self.assertRaisesRegex(ValueError, "invalid diagnostic values"):
            bridge.validate_ea_diagnostic(payload)

    def test_trade_event_validation_requires_real_mt5_fields(self):
        payload = {
            "signalId": "0123456789abcdef01234567",
            "dealId": "123456",
            "brokerOrderId": "654321",
            "eventType": "exit",
            "symbol": "EURUSD.a",
            "currency": "USD",
            "volume": 0.02,
            "price": 1.085,
            "netProfit": -1.25,
            "occurredAt": 1_800_000_000,
        }
        self.assertEqual(bridge.validate_trade_event(payload), payload)
        with self.assertRaisesRegex(ValueError, "invalid trade event fields"):
            bridge.validate_trade_event({key: value for key, value in payload.items() if key != "currency"})
        payload["netProfit"] = True
        with self.assertRaisesRegex(ValueError, "invalid trade event number"):
            bridge.validate_trade_event(payload)


if __name__ == "__main__":
    unittest.main()
