from __future__ import annotations

import os
import shutil
import threading
import tkinter as tk
from pathlib import Path
from tkinter import filedialog, messagebox, ttk
from typing import Callable, TypeVar

from .govee import GoveeProvider
from .hue import HueProvider
from .models import AppSettings, LightDevice
from .settings_store import SettingsStore
from .sync import CompanionListener, EmergencyController, GlobalKeybind, create_shared_secret

T = TypeVar("T")


class RoomLightSyncApp(tk.Tk):
    APP_NAME = "FiveM Room Light Sync"

    def __init__(self) -> None:
        super().__init__()
        self.title(self.APP_NAME)
        self.geometry("980x700")
        self.minsize(850, 600)
        self.configure(bg="#111827")
        self._configure_style()

        self.store = SettingsStore()
        self.settings = self.store.load()
        if not self.settings.shared_secret:
            self.settings.shared_secret = create_shared_secret()
        self.devices: list[LightDevice] = []
        self.controller = EmergencyController(self.report_error)
        self.listener = CompanionListener(self.on_sync_state)
        self.keybind = GlobalKeybind(lambda: self.controller.toggle("Keybind"), self.report_error)

        self.status_var = tk.StringVar(value="Ready. Configure a provider, discover lights, and select the lights to sync.")
        self.state_var = tk.StringVar(value="Emergency sync: OFF")
        self.provider_govee_var = tk.BooleanVar(value=self.settings.govee_enabled)
        self.provider_hue_var = tk.BooleanVar(value=self.settings.hue_enabled)
        self.govee_key_var = tk.StringVar(value=self.store.get_govee_api_key())
        self.hue_ip_var = tk.StringVar(value=self.settings.hue_bridge_ip)
        self.color_a_var = tk.StringVar(value=self.settings.emergency_color_a)
        self.color_b_var = tk.StringVar(value=self.settings.emergency_color_b)
        self.brightness_var = tk.IntVar(value=self.settings.brightness)
        self.use_companion_var = tk.BooleanVar(value=self.settings.use_companion)
        self.use_keybind_var = tk.BooleanVar(value=self.settings.use_keybind)
        self.only_fivem_var = tk.BooleanVar(value=self.settings.only_when_fivem_active)
        self.hotkey_var = tk.StringVar(value=self.settings.hotkey)
        self.port_var = tk.StringVar(value=str(self.settings.listener_port))

        self._build_ui()
        self.protocol("WM_DELETE_WINDOW", self.on_close)
        if self.settings.setup_completed:
            self.after(150, self.start_sync_services)
        else:
            self.after(150, lambda: self.status_var.set("First run: select Govee, Philips Hue, or both, then connect and select room lights."))

    def _configure_style(self) -> None:
        style = ttk.Style(self)
        style.theme_use("clam")
        style.configure("TFrame", background="#111827")
        style.configure("TLabelframe", background="#111827", foreground="#E5E7EB")
        style.configure("TLabelframe.Label", background="#111827", foreground="#E5E7EB", font=("Segoe UI", 10, "bold"))
        style.configure("TLabel", background="#111827", foreground="#E5E7EB", font=("Segoe UI", 10))
        style.configure("Header.TLabel", background="#111827", foreground="#F9FAFB", font=("Segoe UI", 18, "bold"))
        style.configure("Subtle.TLabel", background="#111827", foreground="#9CA3AF", font=("Segoe UI", 9))
        style.configure("TButton", background="#2563EB", foreground="#FFFFFF", padding=(10, 6), font=("Segoe UI", 9, "bold"))
        style.map("TButton", background=[("active", "#1D4ED8")])
        style.configure("TEntry", fieldbackground="#1F2937", foreground="#F9FAFB", insertcolor="#F9FAFB", padding=6)
        style.configure("TCheckbutton", background="#111827", foreground="#E5E7EB", font=("Segoe UI", 10))
        style.map("TCheckbutton", background=[("active", "#111827")], foreground=[("active", "#FFFFFF")])
        style.configure("TNotebook", background="#111827", borderwidth=0)
        style.configure("TNotebook.Tab", background="#1F2937", foreground="#D1D5DB", padding=(16, 8), font=("Segoe UI", 10, "bold"))
        style.map("TNotebook.Tab", background=[("selected", "#2563EB")], foreground=[("selected", "#FFFFFF")])
        style.configure("Treeview", background="#1F2937", fieldbackground="#1F2937", foreground="#E5E7EB", rowheight=28, borderwidth=0)
        style.configure("Treeview.Heading", background="#374151", foreground="#F9FAFB", font=("Segoe UI", 9, "bold"))
        style.map("Treeview", background=[("selected", "#1D4ED8")], foreground=[("selected", "#FFFFFF")])

    def _build_ui(self) -> None:
        header = ttk.Frame(self, padding=(20, 16, 20, 8))
        header.pack(fill="x")
        ttk.Label(header, text=self.APP_NAME, style="Header.TLabel").pack(anchor="w")
        ttk.Label(
            header,
            text="Select your lights once; then sync them with FiveM emergency lights through direct game-state detection or a shared keybind.",
            style="Subtle.TLabel",
            wraplength=900,
        ).pack(anchor="w", pady=(4, 0))

        notebook = ttk.Notebook(self)
        notebook.pack(fill="both", expand=True, padx=20, pady=8)
        setup = ttk.Frame(notebook, padding=14)
        control = ttk.Frame(notebook, padding=14)
        notebook.add(setup, text="1. Setup & Lights")
        notebook.add(control, text="2. Emergency Sync")
        self._build_setup_tab(setup)
        self._build_control_tab(control)

        status = ttk.Frame(self, padding=(20, 10))
        status.pack(fill="x", side="bottom")
        ttk.Label(status, textvariable=self.state_var, font=("Segoe UI", 10, "bold")).pack(anchor="w")
        ttk.Label(status, textvariable=self.status_var, style="Subtle.TLabel", wraplength=920).pack(anchor="w", pady=(3, 0))

    def _build_setup_tab(self, parent: ttk.Frame) -> None:
        provider = ttk.LabelFrame(parent, text="Choose lighting provider", padding=12)
        provider.pack(fill="x")

        govee_row = ttk.Frame(provider)
        govee_row.pack(fill="x", pady=(0, 8))
        ttk.Checkbutton(govee_row, text="Use Govee", variable=self.provider_govee_var).grid(row=0, column=0, sticky="w")
        ttk.Label(govee_row, text="Govee Developer API key:").grid(row=0, column=1, sticky="e", padx=(18, 6))
        ttk.Entry(govee_row, textvariable=self.govee_key_var, show="•", width=39).grid(row=0, column=2, sticky="ew")
        ttk.Button(govee_row, text="Find Govee lights", command=self.discover_govee).grid(row=0, column=3, padx=(8, 0))
        govee_row.columnconfigure(2, weight=1)

        hue_row = ttk.Frame(provider)
        hue_row.pack(fill="x", pady=(4, 0))
        ttk.Checkbutton(hue_row, text="Use Philips Hue", variable=self.provider_hue_var).grid(row=0, column=0, sticky="w")
        ttk.Label(hue_row, text="Bridge IP address:").grid(row=0, column=1, sticky="e", padx=(18, 6))
        ttk.Entry(hue_row, textvariable=self.hue_ip_var, width=24).grid(row=0, column=2, sticky="w")
        ttk.Button(hue_row, text="Find Bridge", command=self.discover_hue_bridge).grid(row=0, column=3, padx=(8, 0))
        ttk.Button(hue_row, text="Pair Bridge", command=self.pair_hue).grid(row=0, column=4, padx=(8, 0))
        ttk.Button(hue_row, text="Find Hue lights", command=self.discover_hue).grid(row=0, column=5, padx=(8, 0))

        helper = ttk.Label(
            provider,
            text="Govee requires a Govee Developer API key. Philips Hue requires a Bridge on the same network; press its physical Link button, then select Pair Bridge. You can enable either provider or both.",
            style="Subtle.TLabel",
            wraplength=880,
        )
        helper.pack(anchor="w", pady=(9, 0))

        lights = ttk.LabelFrame(parent, text="Select the room lights to synchronize", padding=12)
        lights.pack(fill="both", expand=True, pady=(12, 0))
        ttk.Label(
            lights,
            text="Select one or more lights with Ctrl-click or Shift-click. The app will apply blue to the first, third, and subsequent odd lights, and red to the even lights.",
            style="Subtle.TLabel",
            wraplength=880,
        ).pack(anchor="w", pady=(0, 8))
        columns = ("provider", "name", "model", "color", "brightness")
        self.light_tree = ttk.Treeview(lights, columns=columns, show="headings", selectmode="extended", height=10)
        headings = {"provider": "Provider", "name": "Light", "model": "Model", "color": "Color", "brightness": "Brightness"}
        widths = {"provider": 100, "name": 300, "model": 150, "color": 100, "brightness": 100}
        for column in columns:
            self.light_tree.heading(column, text=headings[column])
            self.light_tree.column(column, width=widths[column], anchor="w")
        self.light_tree.pack(fill="both", expand=True)

        settings = ttk.Frame(parent)
        settings.pack(fill="x", pady=(12, 0))
        appearance = ttk.LabelFrame(settings, text="Emergency appearance", padding=12)
        appearance.pack(side="left", fill="x", expand=True, padx=(0, 6))
        ttk.Label(appearance, text="Color A (#RRGGBB):").grid(row=0, column=0, sticky="w")
        ttk.Entry(appearance, textvariable=self.color_a_var, width=12).grid(row=0, column=1, padx=(6, 16))
        ttk.Label(appearance, text="Color B (#RRGGBB):").grid(row=0, column=2, sticky="w")
        ttk.Entry(appearance, textvariable=self.color_b_var, width=12).grid(row=0, column=3, padx=(6, 16))
        ttk.Label(appearance, text="Brightness:").grid(row=0, column=4, sticky="w")
        ttk.Scale(appearance, from_=1, to=100, variable=self.brightness_var, orient="horizontal").grid(row=0, column=5, sticky="ew", padx=(6, 0))
        appearance.columnconfigure(5, weight=1)

        actions = ttk.Frame(parent)
        actions.pack(fill="x", pady=(12, 0))
        ttk.Button(actions, text="Save setup and start sync", command=self.save_setup).pack(side="left")
        ttk.Button(actions, text="Clear selected lights", command=lambda: self.light_tree.selection_remove(self.light_tree.selection())).pack(side="left", padx=(8, 0))

    def _build_control_tab(self, parent: ttk.Frame) -> None:
        mode = ttk.LabelFrame(parent, text="Sync modes", padding=12)
        mode.pack(fill="x")
        ttk.Checkbutton(mode, text="Use direct FiveM companion resource (recommended)", variable=self.use_companion_var).grid(row=0, column=0, columnspan=2, sticky="w")
        ttk.Label(mode, text="Loopback port:").grid(row=1, column=0, sticky="w", pady=(10, 0))
        ttk.Entry(mode, textvariable=self.port_var, width=8).grid(row=1, column=1, sticky="w", padx=(6, 16), pady=(10, 0))
        ttk.Button(mode, text="Export FiveM resource", command=self.export_resource).grid(row=1, column=2, sticky="w", pady=(10, 0))
        ttk.Checkbutton(mode, text="Also use a global keybind fallback", variable=self.use_keybind_var).grid(row=2, column=0, columnspan=2, sticky="w", pady=(16, 0))
        ttk.Label(mode, text="Keybind:").grid(row=3, column=0, sticky="w", pady=(8, 0))
        ttk.Entry(mode, textvariable=self.hotkey_var, width=16).grid(row=3, column=1, sticky="w", padx=(6, 16), pady=(8, 0))
        ttk.Checkbutton(mode, text="Only react when FiveM/GTA is active", variable=self.only_fivem_var).grid(row=3, column=2, sticky="w", pady=(8, 0))
        ttk.Label(
            mode,
            text="The companion watches the actual emergency-light state in the player’s vehicle. The fallback toggles selected lights when the configured key is pressed while FiveM/GTA is focused.",
            style="Subtle.TLabel",
            wraplength=880,
        ).grid(row=4, column=0, columnspan=3, sticky="w", pady=(12, 0))

        live = ttk.LabelFrame(parent, text="Live controls", padding=12)
        live.pack(fill="x", pady=(14, 0))
        ttk.Button(live, text="Test emergency lights ON", command=lambda: self.set_emergency(True, "Manual test")).pack(side="left")
        ttk.Button(live, text="Turn selected lights OFF", command=lambda: self.set_emergency(False, "Manual off")).pack(side="left", padx=(8, 0))
        ttk.Button(live, text="Restart sync services", command=self.start_sync_services).pack(side="left", padx=(8, 0))
        ttk.Label(
            live,
            text="Testing and emergency sync only affect the lights selected in Setup & Lights.",
            style="Subtle.TLabel",
        ).pack(side="left", padx=(18, 0))

    def discover_govee(self) -> None:
        key = self.govee_key_var.get().strip()
        if not self.provider_govee_var.get():
            messagebox.showinfo(self.APP_NAME, "Check ‘Use Govee’ before discovering Govee lights.")
            return
        if not key:
            messagebox.showinfo(self.APP_NAME, "Enter your Govee Developer API key first.")
            return
        self._run_worker("Finding Govee lights…", lambda: GoveeProvider(key).discover_lights(), self._merge_discovered_lights)

    def discover_hue_bridge(self) -> None:
        if not self.provider_hue_var.get():
            messagebox.showinfo(self.APP_NAME, "Check ‘Use Philips Hue’ before discovering a Bridge.")
            return
        def set_bridge(bridges: list[str]) -> None:
            if not bridges:
                raise RuntimeError("No Hue Bridge was found. Confirm this PC and the Bridge are on the same network, or enter the Bridge IP manually.")
            self.hue_ip_var.set(bridges[0])
            extra = "" if len(bridges) == 1 else f" Found {len(bridges)} Bridges; using the first."
            self.status_var.set(f"Hue Bridge found at {bridges[0]}.{extra}")
        self._run_worker("Finding Philips Hue Bridge…", HueProvider.discover_bridges, set_bridge)

    def pair_hue(self) -> None:
        bridge_ip = self.hue_ip_var.get().strip()
        if not self.provider_hue_var.get():
            messagebox.showinfo(self.APP_NAME, "Check ‘Use Philips Hue’ before pairing the Bridge.")
            return
        if not bridge_ip:
            messagebox.showinfo(self.APP_NAME, "Find or enter the Hue Bridge IP address first.")
            return
        messagebox.showinfo(self.APP_NAME, "Press the physical Link button on the Hue Bridge now, then choose OK. Pairing will start immediately.")
        def complete(username: str) -> None:
            self.settings.hue_username = username
            self.status_var.set("Hue Bridge paired successfully. Select Find Hue lights next.")
        self._run_worker("Pairing with Hue Bridge…", lambda: HueProvider(bridge_ip).pair(), complete)

    def discover_hue(self) -> None:
        if not self.provider_hue_var.get():
            messagebox.showinfo(self.APP_NAME, "Check ‘Use Philips Hue’ before discovering Hue lights.")
            return
        bridge_ip = self.hue_ip_var.get().strip()
        if not bridge_ip or not self.settings.hue_username:
            messagebox.showinfo(self.APP_NAME, "Find and pair the Hue Bridge first.")
            return
        self._run_worker(
            "Finding Hue lights…",
            lambda: HueProvider(bridge_ip, self.settings.hue_username).discover_lights(),
            self._merge_discovered_lights,
        )

    def _merge_discovered_lights(self, incoming: list[LightDevice]) -> None:
        known = {device.unique_id: device for device in self.devices}
        known.update({device.unique_id: device for device in incoming})
        self.devices = list(known.values())
        self._refresh_light_tree()
        self.status_var.set(f"Found {len(incoming)} light(s). Select the ones you want to synchronize, then save setup.")

    def _refresh_light_tree(self) -> None:
        previous = set(self.settings.selected_lights) | set(self.light_tree.selection())
        for item in self.light_tree.get_children():
            self.light_tree.delete(item)
        for device in sorted(self.devices, key=lambda item: (item.provider, item.name.lower())):
            self.light_tree.insert(
                "",
                "end",
                iid=device.unique_id,
                values=(
                    "Govee" if device.provider == "govee" else "Philips Hue",
                    device.name,
                    device.model,
                    "Yes" if device.supports_color else "No",
                    "Yes" if device.supports_brightness else "No",
                ),
            )
        for item in previous:
            if self.light_tree.exists(item):
                self.light_tree.selection_add(item)

    def _read_settings_from_ui(self) -> AppSettings:
        try:
            port = int(self.port_var.get())
            if not 1024 <= port <= 65535:
                raise ValueError
        except ValueError as exc:
            raise ValueError("Loopback port must be a number from 1024 through 65535.") from exc
        from .models import Color
        Color.from_hex(self.color_a_var.get().strip())
        Color.from_hex(self.color_b_var.get().strip())
        hotkey = self.hotkey_var.get().strip()
        if self.use_keybind_var.get() and not hotkey:
            raise ValueError("Enter a keybind such as F7, ctrl+shift+l, or alt+g.")
        return AppSettings(
            setup_completed=True,
            govee_enabled=self.provider_govee_var.get(),
            hue_enabled=self.provider_hue_var.get(),
            hue_bridge_ip=self.hue_ip_var.get().strip(),
            hue_username=self.settings.hue_username,
            selected_lights=list(self.light_tree.selection()),
            emergency_color_a=self.color_a_var.get().strip().upper(),
            emergency_color_b=self.color_b_var.get().strip().upper(),
            brightness=int(round(self.brightness_var.get())),
            use_companion=self.use_companion_var.get(),
            use_keybind=self.use_keybind_var.get(),
            hotkey=hotkey,
            only_when_fivem_active=self.only_fivem_var.get(),
            listener_port=port,
            shared_secret=self.settings.shared_secret or create_shared_secret(),
        )

    def save_setup(self) -> None:
        try:
            settings = self._read_settings_from_ui()
            if not settings.govee_enabled and not settings.hue_enabled:
                raise ValueError("Choose Govee, Philips Hue, or both.")
            if not settings.selected_lights:
                raise ValueError("Select at least one room light to synchronize.")
            if settings.govee_enabled and not self.govee_key_var.get().strip():
                raise ValueError("Enter a Govee Developer API key or disable Govee.")
            if settings.hue_enabled and (not settings.hue_bridge_ip or not settings.hue_username):
                raise ValueError("Find and pair the Hue Bridge or disable Philips Hue.")
            self.settings = settings
            self.store.save(self.settings, self.govee_key_var.get())
            self.start_sync_services()
            self.status_var.set(f"Setup saved. {len(settings.selected_lights)} selected light(s) are ready for emergency sync.")
        except Exception as exc:
            messagebox.showerror(self.APP_NAME, str(exc))

    def start_sync_services(self) -> None:
        try:
            self.settings = self._read_settings_from_ui()
            self.controller.configure(self.settings, self.devices, self.govee_key_var.get())
            self.listener.stop()
            self.keybind.stop()
            if self.settings.use_companion:
                self.listener.start(self.settings.listener_port, self.settings.shared_secret)
            if self.settings.use_keybind:
                self.keybind.start(self.settings.hotkey, self.settings.only_when_fivem_active)
            modes: list[str] = []
            if self.settings.use_companion:
                modes.append(f"FiveM companion on port {self.settings.listener_port}")
            if self.settings.use_keybind:
                modes.append(f"keybind {self.settings.hotkey}")
            self.status_var.set("Sync services running: " + (", ".join(modes) or "manual controls only"))
        except Exception as exc:
            self.report_error(str(exc))

    def set_emergency(self, active: bool, source: str) -> None:
        if not self.devices:
            messagebox.showinfo(self.APP_NAME, "Discover and select lights in Setup & Lights first.")
            return
        self.controller.configure(self.settings, self.devices, self.govee_key_var.get())
        self.controller.set_active(active, source)
        self.state_var.set("Emergency sync: ON" if active else "Emergency sync: OFF")
        self.status_var.set(f"{source}: sending {'emergency colors' if active else 'off command'} to selected lights…")

    def on_sync_state(self, active: bool, source: str) -> None:
        self.after(0, lambda: self.set_emergency(active, source))

    def export_resource(self) -> None:
        try:
            settings = self._read_settings_from_ui()
        except ValueError as exc:
            messagebox.showerror(self.APP_NAME, str(exc))
            return
        destination = filedialog.askdirectory(title="Choose a FiveM resources folder")
        if not destination:
            return
        source = Path(__file__).resolve().parent.parent / "fivem_resource" / "fivem-room-light-sync"
        target = Path(destination) / "fivem-room-light-sync"
        try:
            if target.exists():
                shutil.rmtree(target)
            shutil.copytree(source, target)
            config = target / "config.lua"
            config.write_text(
                "-- Generated by FiveM Room Light Sync. Keep this token private.\n"
                f"Config.Endpoint = 'http://127.0.0.1:{settings.listener_port}/sync'\n"
                f"Config.Token = '{settings.shared_secret}'\n"
                "Config.PollIntervalMs = 250\n",
                encoding="utf-8",
            )
            messagebox.showinfo(
                self.APP_NAME,
                f"FiveM resource exported to:\n{target}\n\nAdd `ensure fivem-room-light-sync` to your FiveM client/server configuration, then keep this app running while you play.",
            )
        except OSError as exc:
            messagebox.showerror(self.APP_NAME, f"Could not export the FiveM resource: {exc}")

    def report_error(self, message: str) -> None:
        self.after(0, lambda: self.status_var.set(message))

    def _run_worker(self, start_message: str, work: Callable[[], T], success: Callable[[T], None]) -> None:
        self.status_var.set(start_message)
        def runner() -> None:
            try:
                result = work()
                self.after(0, lambda: success(result))
            except Exception as exc:
                self.after(0, lambda: self.report_error(str(exc)))
        threading.Thread(target=runner, daemon=True).start()

    def on_close(self) -> None:
        self.listener.stop()
        self.keybind.stop()
        self.destroy()


def run() -> None:
    app = RoomLightSyncApp()
    app.mainloop()
