from __future__ import annotations

import json
import os
from pathlib import Path

import keyring

from .models import AppSettings


class SettingsStore:
    """Stores preferences locally and secrets in the Windows credential vault."""

    SERVICE_NAME = "FiveMRoomLightSync"

    def __init__(self) -> None:
        appdata = Path(os.environ.get("LOCALAPPDATA", Path.home() / ".local"))
        self.directory = appdata / "FiveMRoomLightSync"
        self.settings_path = self.directory / "settings.json"

    def load(self) -> AppSettings:
        if not self.settings_path.exists():
            settings = AppSettings()
        else:
            try:
                settings = AppSettings.from_dict(json.loads(self.settings_path.read_text(encoding="utf-8")))
            except (OSError, ValueError, TypeError, json.JSONDecodeError):
                settings = AppSettings()

        settings.hue_username = self._get_secret("hue_username") or ""
        settings.shared_secret = self._get_secret("companion_secret") or ""
        return settings

    def save(self, settings: AppSettings, govee_api_key: str) -> None:
        self.directory.mkdir(parents=True, exist_ok=True)
        self.settings_path.write_text(
            json.dumps(settings.public_dict(), indent=2, sort_keys=True),
            encoding="utf-8",
        )
        self._set_secret("govee_api_key", govee_api_key.strip())
        self._set_secret("hue_username", settings.hue_username.strip())
        self._set_secret("companion_secret", settings.shared_secret.strip())

    def get_govee_api_key(self) -> str:
        return self._get_secret("govee_api_key") or ""

    def _get_secret(self, name: str) -> str | None:
        try:
            return keyring.get_password(self.SERVICE_NAME, name)
        except keyring.errors.KeyringError:
            return None

    def _set_secret(self, name: str, value: str) -> None:
        try:
            if value:
                keyring.set_password(self.SERVICE_NAME, name, value)
            else:
                try:
                    keyring.delete_password(self.SERVICE_NAME, name)
                except keyring.errors.PasswordDeleteError:
                    pass
        except keyring.errors.KeyringError as exc:
            raise RuntimeError(
                "Windows Credential Manager could not save secure settings. "
                "Please make sure the app is running under a normal Windows user account."
            ) from exc
