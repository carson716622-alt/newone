from __future__ import annotations

import threading
import time
import uuid
from typing import Any

import requests

from .models import Color, LightDevice


class GoveeError(RuntimeError):
    pass


class GoveeProvider:
    API_ROOT = "https://openapi.api.govee.com/router/api/v1"
    MAX_COMMANDS_PER_SECOND = 10

    def __init__(self, api_key: str) -> None:
        self.api_key = api_key.strip()
        self._last_command_at = 0.0
        self._command_lock = threading.Lock()

    @property
    def configured(self) -> bool:
        return bool(self.api_key)

    def discover_lights(self) -> list[LightDevice]:
        if not self.configured:
            return []
        payload = self._request("GET", "/user/devices")
        devices = payload.get("data", [])
        lights: list[LightDevice] = []
        for raw in devices:
            capabilities = raw.get("capabilities", [])
            if not self._supports(capabilities, "devices.capabilities.on_off", "powerSwitch"):
                continue
            model = str(raw.get("sku", "Govee"))
            device_id = str(raw.get("device", ""))
            if not device_id:
                continue
            name = str(raw.get("deviceName") or raw.get("name") or model)
            lights.append(
                LightDevice(
                    provider="govee",
                    device_id=device_id,
                    name=name,
                    model=model,
                    supports_color=self._supports(capabilities, "devices.capabilities.color_setting", "colorRgb"),
                    supports_brightness=self._supports(capabilities, "devices.capabilities.range", "brightness"),
                    raw=raw,
                )
            )
        return lights

    def set_light(self, light: LightDevice, enabled: bool, color: Color, brightness: int) -> None:
        if not enabled:
            self._control(light, "devices.capabilities.on_off", "powerSwitch", 0)
            return

        self._control(light, "devices.capabilities.on_off", "powerSwitch", 1)
        if light.supports_brightness:
            self._control(light, "devices.capabilities.range", "brightness", max(1, min(100, brightness)))
        if light.supports_color:
            rgb = (color.red << 16) + (color.green << 8) + color.blue
            self._control(light, "devices.capabilities.color_setting", "colorRgb", rgb)

    def _control(self, light: LightDevice, capability_type: str, instance: str, value: Any) -> None:
        self._wait_for_command_slot()
        body = {
            "requestId": str(uuid.uuid4()),
            "payload": {
                "sku": light.model,
                "device": light.device_id,
                "capability": {"type": capability_type, "instance": instance, "value": value},
            },
        }
        self._request("POST", "/device/control", body)

    def _wait_for_command_slot(self) -> None:
        with self._command_lock:
            spacing = 1 / self.MAX_COMMANDS_PER_SECOND
            now = time.monotonic()
            remaining = spacing - (now - self._last_command_at)
            if remaining > 0:
                time.sleep(remaining)
            self._last_command_at = time.monotonic()

    def _request(self, method: str, endpoint: str, body: dict[str, Any] | None = None) -> dict[str, Any]:
        headers = {"Govee-API-Key": self.api_key, "Content-Type": "application/json"}
        try:
            response = requests.request(
                method,
                f"{self.API_ROOT}{endpoint}",
                headers=headers,
                json=body,
                timeout=12,
            )
        except requests.RequestException as exc:
            raise GoveeError(f"Could not reach the Govee service: {exc}") from exc

        try:
            payload = response.json()
        except ValueError as exc:
            raise GoveeError("Govee returned an unreadable response.") from exc
        if not response.ok or payload.get("code") not in (200, 0, None):
            message = payload.get("message") or response.text or f"HTTP {response.status_code}"
            raise GoveeError(f"Govee request failed: {message}")
        return payload

    @staticmethod
    def _supports(capabilities: list[dict[str, Any]], type_name: str, instance: str) -> bool:
        return any(
            capability.get("type") == type_name and capability.get("instance") == instance
            for capability in capabilities
        )
