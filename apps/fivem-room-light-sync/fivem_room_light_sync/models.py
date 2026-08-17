from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Any


@dataclass
class Color:
    """An RGB color used for emergency mode."""

    red: int
    green: int
    blue: int

    def to_hex(self) -> str:
        return f"#{self.red:02X}{self.green:02X}{self.blue:02X}"

    @classmethod
    def from_hex(cls, value: str) -> "Color":
        value = value.lstrip("#")
        if len(value) != 6:
            raise ValueError("Color must use the #RRGGBB format.")
        return cls(int(value[0:2], 16), int(value[2:4], 16), int(value[4:6], 16))


@dataclass
class LightDevice:
    provider: str
    device_id: str
    name: str
    model: str = ""
    supports_color: bool = False
    supports_brightness: bool = False
    raw: dict[str, Any] = field(default_factory=dict)

    @property
    def unique_id(self) -> str:
        return f"{self.provider}:{self.device_id}"


@dataclass
class AppSettings:
    setup_completed: bool = False
    govee_enabled: bool = False
    hue_enabled: bool = False
    hue_bridge_ip: str = ""
    hue_username: str = ""
    selected_lights: list[str] = field(default_factory=list)
    emergency_color_a: str = "#0055FF"
    emergency_color_b: str = "#FF1A1A"
    brightness: int = 100
    use_companion: bool = True
    use_keybind: bool = True
    hotkey: str = "F7"
    only_when_fivem_active: bool = True
    listener_port: int = 17831
    shared_secret: str = ""
    restore_lights_after_sync: bool = False

    def public_dict(self) -> dict[str, Any]:
        """Return non-secret settings suitable for JSON persistence."""
        payload = asdict(self)
        payload.pop("hue_username", None)
        payload.pop("shared_secret", None)
        return payload

    @classmethod
    def from_dict(cls, payload: dict[str, Any]) -> "AppSettings":
        allowed = {field_name: payload[field_name] for field_name in cls.__dataclass_fields__ if field_name in payload}
        return cls(**allowed)
