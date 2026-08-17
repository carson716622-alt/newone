from __future__ import annotations

import ctypes
import json
import secrets
import threading
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Callable

import keyboard

from .govee import GoveeProvider
from .hue import HueProvider
from .models import AppSettings, Color, LightDevice

StateCallback = Callable[[bool, str], None]
ErrorCallback = Callable[[str], None]


def create_shared_secret() -> str:
    return secrets.token_urlsafe(32)


def is_fivem_foreground() -> bool:
    """Return true only if FiveM/GTA appears to own the active Windows window."""
    try:
        hwnd = ctypes.windll.user32.GetForegroundWindow()
        text = ctypes.create_unicode_buffer(512)
        ctypes.windll.user32.GetWindowTextW(hwnd, text, len(text))
        title = text.value.lower()
        return "fivem" in title or "gta" in title or "grand theft auto" in title
    except (AttributeError, OSError):
        return True


class EmergencyController:
    def __init__(self, error_callback: ErrorCallback | None = None) -> None:
        self._error_callback = error_callback or (lambda _: None)
        self._settings = AppSettings()
        self._devices: dict[str, LightDevice] = {}
        self._govee: GoveeProvider | None = None
        self._hue: HueProvider | None = None
        self._state_lock = threading.Lock()
        self._active = False

    @property
    def active(self) -> bool:
        with self._state_lock:
            return self._active

    def configure(
        self,
        settings: AppSettings,
        devices: list[LightDevice],
        govee_api_key: str,
    ) -> None:
        self._settings = settings
        self._devices = {device.unique_id: device for device in devices}
        self._govee = GoveeProvider(govee_api_key) if settings.govee_enabled and govee_api_key else None
        self._hue = HueProvider(settings.hue_bridge_ip, settings.hue_username) if settings.hue_enabled else None

    def set_active(self, active: bool, source: str) -> None:
        with self._state_lock:
            if active == self._active:
                return
            self._active = active
        threading.Thread(target=self._apply_state, args=(active, source), daemon=True).start()

    def toggle(self, source: str) -> None:
        self.set_active(not self.active, source)

    def _apply_state(self, active: bool, source: str) -> None:
        selected = [self._devices[item] for item in self._settings.selected_lights if item in self._devices]
        if not selected:
            self._error_callback("No selected lights are available. Open Setup, discover devices, select lights, and save.")
            return

        try:
            color_a = Color.from_hex(self._settings.emergency_color_a)
            color_b = Color.from_hex(self._settings.emergency_color_b)
            for index, light in enumerate(selected):
                color = color_a if index % 2 == 0 else color_b
                if light.provider == "govee" and self._govee:
                    self._govee.set_light(light, active, color, self._settings.brightness)
                elif light.provider == "hue" and self._hue:
                    self._hue.set_light(light, active, color, self._settings.brightness)
        except Exception as exc:  # Provider errors are displayed in the GUI status area.
            self._error_callback(f"Emergency sync from {source} failed: {exc}")


class _CompanionRequestHandler(BaseHTTPRequestHandler):
    listener: "CompanionListener"

    def do_POST(self) -> None:  # noqa: N802
        if self.path != "/sync":
            self._respond(HTTPStatus.NOT_FOUND, {"ok": False, "error": "Unknown endpoint"})
            return
        if self.headers.get("X-FRLS-Token", "") != self.listener.secret:
            self._respond(HTTPStatus.UNAUTHORIZED, {"ok": False, "error": "Invalid token"})
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
            active = payload["active"]
            if not isinstance(active, bool):
                raise ValueError("active must be boolean")
        except (ValueError, KeyError, json.JSONDecodeError):
            self._respond(HTTPStatus.BAD_REQUEST, {"ok": False, "error": "Invalid body"})
            return
        self.listener.state_callback(active, "FiveM companion")
        self._respond(HTTPStatus.OK, {"ok": True})

    def log_message(self, format: str, *args: object) -> None:  # noqa: A003
        return

    def _respond(self, status: HTTPStatus, payload: dict[str, object]) -> None:
        data = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)


class CompanionListener:
    """Loopback-only endpoint consumed by the optional FiveM client resource."""

    def __init__(self, state_callback: StateCallback) -> None:
        self.state_callback = state_callback
        self.secret = ""
        self.port = 17831
        self._server: ThreadingHTTPServer | None = None
        self._thread: threading.Thread | None = None

    def start(self, port: int, secret: str) -> None:
        self.stop()
        self.port = port
        self.secret = secret
        handler = type("CompanionHandler", (_CompanionRequestHandler,), {"listener": self})
        self._server = ThreadingHTTPServer(("127.0.0.1", self.port), handler)
        self._thread = threading.Thread(target=self._server.serve_forever, daemon=True)
        self._thread.start()

    def stop(self) -> None:
        if self._server:
            self._server.shutdown()
            self._server.server_close()
        self._server = None
        self._thread = None


class GlobalKeybind:
    def __init__(self, callback: Callable[[], None], error_callback: ErrorCallback) -> None:
        self._callback = callback
        self._error_callback = error_callback
        self._hotkey_handle: int | None = None
        self._only_fivem_active = True

    def start(self, hotkey: str, only_fivem_active: bool) -> None:
        self.stop()
        self._only_fivem_active = only_fivem_active
        try:
            self._hotkey_handle = keyboard.add_hotkey(hotkey.lower(), self._handle_keypress, suppress=False)
        except Exception as exc:
            self._error_callback(f"Could not register the {hotkey} keybind: {exc}")

    def stop(self) -> None:
        if self._hotkey_handle is not None:
            try:
                keyboard.remove_hotkey(self._hotkey_handle)
            except Exception:
                pass
        self._hotkey_handle = None

    def _handle_keypress(self) -> None:
        if not self._only_fivem_active or is_fivem_foreground():
            self._callback()
