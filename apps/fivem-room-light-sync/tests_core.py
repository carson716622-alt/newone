from __future__ import annotations

import json
import socket
import time
import unittest
from unittest.mock import patch
from urllib.error import HTTPError
from urllib.request import Request, urlopen

from fivem_room_light_sync.govee import GoveeProvider
from fivem_room_light_sync.hue import HueProvider
from fivem_room_light_sync.models import Color
from fivem_room_light_sync.sync import CompanionListener


class CoreTests(unittest.TestCase):
    def test_govee_discovers_only_controllable_lights(self) -> None:
        payload = {
            "code": 200,
            "data": [
                {
                    "sku": "H6008",
                    "device": "AA:BB",
                    "deviceName": "Desk Lamp",
                    "capabilities": [
                        {"type": "devices.capabilities.on_off", "instance": "powerSwitch"},
                        {"type": "devices.capabilities.color_setting", "instance": "colorRgb"},
                        {"type": "devices.capabilities.range", "instance": "brightness"},
                    ],
                },
                {"sku": "H5075", "device": "CC:DD", "capabilities": []},
            ],
        }
        with patch.object(GoveeProvider, "_request", return_value=payload):
            lights = GoveeProvider("test-key").discover_lights()
        self.assertEqual(len(lights), 1)
        self.assertEqual(lights[0].name, "Desk Lamp")
        self.assertTrue(lights[0].supports_color)
        self.assertTrue(lights[0].supports_brightness)

    def test_hue_color_conversion_is_valid_xy(self) -> None:
        x_coord, y_coord = HueProvider._rgb_to_xy(Color(0, 85, 255))
        self.assertGreater(x_coord, 0)
        self.assertGreater(y_coord, 0)
        self.assertLess(x_coord, 1)
        self.assertLess(y_coord, 1)

    def test_loopback_listener_rejects_bad_token_and_accepts_valid_state(self) -> None:
        with socket.socket() as probe:
            probe.bind(("127.0.0.1", 0))
            port = probe.getsockname()[1]
        received: list[tuple[bool, str]] = []
        listener = CompanionListener(lambda active, source: received.append((active, source)))
        listener.start(port, "secret")
        try:
            bad_request = Request(
                f"http://127.0.0.1:{port}/sync",
                data=b'{"active": true}',
                method="POST",
                headers={"Content-Type": "application/json"},
            )
            with self.assertRaises(HTTPError) as bad_response:
                urlopen(bad_request, timeout=2)
            self.assertEqual(bad_response.exception.code, 401)

            good_request = Request(
                f"http://127.0.0.1:{port}/sync",
                data=json.dumps({"active": True}).encode("utf-8"),
                method="POST",
                headers={"Content-Type": "application/json", "X-FRLS-Token": "secret"},
            )
            with urlopen(good_request, timeout=2) as response:
                self.assertEqual(response.status, 200)
            time.sleep(0.05)
            self.assertEqual(received, [(True, "FiveM companion")])
        finally:
            listener.stop()


if __name__ == "__main__":
    unittest.main(verbosity=2)
