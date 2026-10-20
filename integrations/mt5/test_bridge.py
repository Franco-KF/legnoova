import json
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest
from unittest.mock import patch

import bridge


class BridgeTests(unittest.TestCase):
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


if __name__ == "__main__":
    unittest.main()
