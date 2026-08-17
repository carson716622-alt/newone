from __future__ import annotations

import colorsys
from typing import Any

import requests
import urllib3

from .models import Color, LightDevice

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


class HueError(RuntimeError):
    pass


class HueProvider:
    DISCOVERY_URL = "https://discovery.meethue.com/"

    def __init__(self, bridge_ip: str, username: str = "") -> None:
        self.bridge_ip = bridge_ip.strip()
        self.username = username.strip()

    @property
    def configured(self) -> bool:
        return bool(self.bridge_ip and self.username)

    @staticmethod
    def discover_bridges() -> list[str]:
        try:
            response = requests.get(HueProvider.DISCOVERY_URL, timeout=10)
            response.raise_for_status()
            payload = response.json()
        except requests.RequestException as exc:
            raise HueError(f"Could not discover Hue Bridges: {exc}") from exc
        except ValueError as exc:
            raise HueError("Hue Bridge discovery returned an unreadable response.") from exc
        return [str(item["internalipaddress"]) for item in payload if item.get("internalipaddress")]

    def pair(self) -> str:
        if not self.bridge_ip:
            raise HueError("Enter or discover a Hue Bridge IP address first.")
        payload = self._request("POST", "/api", {"devicetype": "fivem_room_light_sync#desktop"})
        if isinstance(payload, list) and payload:
            result = payload[0]
            if "success" in result and result["success"].get("username"):
                self.username = str(result["success"]["username"])
                return self.username
            if "error" in result:
                description = result["error"].get("description", "Pairing failed.")
                raise HueError(f"Hue pairing failed: {description}. Press the Bridge Link button and try again.")
        raise HueError("Hue pairing failed with an unexpected response.")

    def discover_lights(self) -> list[LightDevice]:
        if not self.configured:
            return []
        raw_lights = self._request("GET", f"/api/{self.username}/lights")
        if not isinstance(raw_lights, dict):
            raise HueError("Hue returned an unexpected light list.")

        lights: list[LightDevice] = []
        for light_id, raw in raw_lights.items():
            if not isinstance(raw, dict):
                continue
            state = raw.get("state", {})
            capabilities = raw.get("capabilities", {}).get("control", {})
            supports_color = bool(state.get("xy") is not None or capabilities.get("colorgamut"))
            supports_brightness = bool(state.get("bri") is not None or capabilities.get("maxlumen"))
            lights.append(
                LightDevice(
                    provider="hue",
                    device_id=str(light_id),
                    name=str(raw.get("name") or f"Hue light {light_id}"),
                    model=str(raw.get("modelid") or "Philips Hue"),
                    supports_color=supports_color,
                    supports_brightness=supports_brightness,
                    raw=raw,
                )
            )
        return lights

    def set_light(self, light: LightDevice, enabled: bool, color: Color, brightness: int) -> None:
        body: dict[str, Any] = {"on": enabled}
        if enabled:
            if light.supports_brightness:
                body["bri"] = max(1, min(254, round(brightness * 254 / 100)))
            if light.supports_color:
                body["xy"] = list(self._rgb_to_xy(color))
        response = self._request("PUT", f"/api/{self.username}/lights/{light.device_id}/state", body)
        if isinstance(response, list) and response and "error" in response[0]:
            description = response[0]["error"].get("description", "Unknown Hue error")
            raise HueError(f"Hue command failed: {description}")

    def _request(self, method: str, endpoint: str, body: dict[str, Any] | None = None) -> Any:
        if not self.bridge_ip:
            raise HueError("Hue Bridge IP address is missing.")
        try:
            response = requests.request(
                method,
                f"https://{self.bridge_ip}{endpoint}",
                json=body,
                timeout=10,
                verify=False,
            )
            response.raise_for_status()
            return response.json()
        except requests.RequestException as exc:
            raise HueError(f"Could not reach the Hue Bridge at {self.bridge_ip}: {exc}") from exc
        except ValueError as exc:
            raise HueError("Hue Bridge returned an unreadable response.") from exc

    @staticmethod
    def _rgb_to_xy(color: Color) -> tuple[float, float]:
        """Approximate sRGB-to-CIE 1931 conversion accepted by Hue color lights."""
        red, green, blue = [component / 255.0 for component in (color.red, color.green, color.blue)]
        red = ((red + 0.055) / 1.055) ** 2.4 if red > 0.04045 else red / 12.92
        green = ((green + 0.055) / 1.055) ** 2.4 if green > 0.04045 else green / 12.92
        blue = ((blue + 0.055) / 1.055) ** 2.4 if blue > 0.04045 else blue / 12.92

        x_val = red * 0.664511 + green * 0.154324 + blue * 0.162028
        y_val = red * 0.283881 + green * 0.668433 + blue * 0.047685
        z_val = red * 0.000088 + green * 0.07231 + blue * 0.986039
        denominator = x_val + y_val + z_val
        if denominator <= 0:
            return 0.3127, 0.3290
        return round(x_val / denominator, 4), round(y_val / denominator, 4)
