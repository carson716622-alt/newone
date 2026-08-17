from __future__ import annotations

import shutil
import threading
import tkinter as tk
from pathlib import Path
from tkinter import filedialog, messagebox
from typing import Callable, TypeVar

import customtkinter as ctk

from .govee import GoveeProvider
from .hue import HueProvider
from .models import AppSettings, Color, LightDevice
from .settings_store import SettingsStore
from .sync import CompanionListener, EmergencyController, GlobalKeybind, create_shared_secret

T = TypeVar("T")


class Palette:
    BACKGROUND = "#090E1A"
    PANEL = "#111827"
    PANEL_ALT = "#172235"
    BORDER = "#26354D"
    TEXT = "#F8FAFC"
    MUTED = "#93A4BA"
    BLUE = "#3B82F6"
    BLUE_HOVER = "#2563EB"
    BLUE_SOFT = "#18355E"
    RED = "#EF4444"
    RED_HOVER = "#DC2626"
    RED_SOFT = "#4A1B28"
    GREEN = "#22C55E"
    GREEN_SOFT = "#153A2A"
    AMBER = "#F59E0B"
    AMBER_SOFT = "#4A3616"


class RoomLightSyncApp(ctk.CTk):
    APP_NAME = "FiveM Room Light Sync"

    def __init__(self) -> None:
        super().__init__()
        ctk.set_appearance_mode("dark")
        ctk.set_default_color_theme("blue")
        self.title(self.APP_NAME)
        self.geometry("1280x800")
        self.minsize(1080, 680)
        self.configure(fg_color=Palette.BACKGROUND)

        self.store = SettingsStore()
        self.settings = self.store.load()
        if not self.settings.shared_secret:
            self.settings.shared_secret = create_shared_secret()

        self.devices: list[LightDevice] = []
        self.light_vars: dict[str, tk.BooleanVar] = {}
        self.current_page = "dashboard"
        self.page_frames: dict[str, ctk.CTkFrame] = {}
        self.nav_buttons: dict[str, ctk.CTkButton] = {}

        self.status_var = tk.StringVar(value="Welcome. Complete the quick setup to connect your room lights.")
        self.state_var = tk.StringVar(value="Emergency scene is OFF")
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

        self.controller = EmergencyController(self.report_error)
        self.listener = CompanionListener(self.on_sync_state)
        self.keybind = GlobalKeybind(lambda: self.controller.toggle("Keybind"), self.report_error)

        self._build_shell()
        self._build_dashboard_page()
        self._build_setup_page()
        self._build_sync_page()
        self._build_help_page()
        self._update_selection_cards()
        self._update_dashboard()
        self.select_page("dashboard" if self.settings.setup_completed else "setup")
        self.protocol("WM_DELETE_WINDOW", self.on_close)

        if self.settings.setup_completed:
            self.after(250, self.start_sync_services)
        else:
            self.after(250, lambda: self.status_var.set("Start with Setup Lights. The app will guide you through connecting and selecting your room lights."))

    # ----------------------- Shell and reusable controls -----------------------

    def _build_shell(self) -> None:
        self.grid_columnconfigure(1, weight=1)
        self.grid_rowconfigure(0, weight=1)

        sidebar = ctk.CTkFrame(self, width=246, corner_radius=0, fg_color="#0C1422", border_width=1, border_color=Palette.BORDER)
        sidebar.grid(row=0, column=0, sticky="nsew")
        sidebar.grid_propagate(False)

        brand = ctk.CTkFrame(sidebar, fg_color="transparent")
        brand.pack(fill="x", padx=24, pady=(28, 26))
        icon = ctk.CTkLabel(brand, text="◈", font=ctk.CTkFont(size=34, weight="bold"), text_color=Palette.BLUE)
        icon.pack(anchor="w")
        ctk.CTkLabel(brand, text="FIVEM ROOM", font=ctk.CTkFont(size=18, weight="bold"), text_color=Palette.TEXT).pack(anchor="w", pady=(7, 0))
        ctk.CTkLabel(brand, text="LIGHT SYNC", font=ctk.CTkFont(size=12, weight="bold"), text_color=Palette.MUTED).pack(anchor="w")

        nav = ctk.CTkFrame(sidebar, fg_color="transparent")
        nav.pack(fill="x", padx=13)
        for key, label, icon_text in (
            ("dashboard", "Dashboard", "◉"),
            ("setup", "Setup lights", "◫"),
            ("sync", "FiveM sync", "↯"),
            ("help", "Help & safety", "?"),
        ):
            button = ctk.CTkButton(
                nav,
                text=f"{icon_text}   {label}",
                anchor="w",
                height=43,
                corner_radius=10,
                fg_color="transparent",
                hover_color=Palette.PANEL_ALT,
                text_color=Palette.MUTED,
                font=ctk.CTkFont(size=13, weight="bold"),
                command=lambda page=key: self.select_page(page),
            )
            button.pack(fill="x", pady=3)
            self.nav_buttons[key] = button

        footer = ctk.CTkFrame(sidebar, fg_color=Palette.PANEL, corner_radius=12, border_width=1, border_color=Palette.BORDER)
        footer.pack(side="bottom", fill="x", padx=16, pady=18)
        ctk.CTkLabel(footer, text="LOCAL & PRIVATE", text_color=Palette.GREEN, font=ctk.CTkFont(size=10, weight="bold")).pack(anchor="w", padx=13, pady=(11, 0))
        ctk.CTkLabel(footer, text="Your API keys and room-light commands stay on your PC.", text_color=Palette.MUTED, justify="left", wraplength=188, font=ctk.CTkFont(size=11)).pack(anchor="w", padx=13, pady=(3, 12))

        right = ctk.CTkFrame(self, corner_radius=0, fg_color=Palette.BACKGROUND)
        right.grid(row=0, column=1, sticky="nsew")
        right.grid_columnconfigure(0, weight=1)
        right.grid_rowconfigure(1, weight=1)

        topbar = ctk.CTkFrame(right, height=76, corner_radius=0, fg_color=Palette.BACKGROUND)
        topbar.grid(row=0, column=0, sticky="ew")
        topbar.grid_propagate(False)
        ctk.CTkLabel(topbar, text="Room lights, ready for the callout.", text_color=Palette.MUTED, font=ctk.CTkFont(size=13)).pack(side="left", padx=33, pady=24)
        self.top_state = ctk.CTkLabel(topbar, text="  ●  SYNC OFF  ", text_color=Palette.MUTED, fg_color=Palette.PANEL_ALT, corner_radius=14, font=ctk.CTkFont(size=11, weight="bold"))
        self.top_state.pack(side="right", padx=33, pady=22)

        self.page_host = ctk.CTkFrame(right, fg_color=Palette.BACKGROUND, corner_radius=0)
        self.page_host.grid(row=1, column=0, sticky="nsew", padx=24, pady=(0, 18))
        self.page_host.grid_columnconfigure(0, weight=1)
        self.page_host.grid_rowconfigure(0, weight=1)

        status_bar = ctk.CTkFrame(right, height=34, corner_radius=10, fg_color=Palette.PANEL, border_width=1, border_color=Palette.BORDER)
        status_bar.grid(row=2, column=0, sticky="ew", padx=28, pady=(0, 18))
        status_bar.grid_propagate(False)
        ctk.CTkLabel(status_bar, text="STATUS", text_color=Palette.BLUE, font=ctk.CTkFont(size=10, weight="bold")).pack(side="left", padx=(12, 8))
        ctk.CTkLabel(status_bar, textvariable=self.status_var, text_color=Palette.MUTED, font=ctk.CTkFont(size=11), anchor="w").pack(side="left", fill="x", expand=True, padx=(0, 12))

    def _page(self, key: str) -> ctk.CTkScrollableFrame:
        frame = ctk.CTkScrollableFrame(self.page_host, fg_color=Palette.BACKGROUND, corner_radius=0)
        frame.grid(row=0, column=0, sticky="nsew")
        frame.grid_columnconfigure(0, weight=1)
        self.page_frames[key] = frame
        return frame

    def select_page(self, page: str) -> None:
        self.current_page = page
        for key, frame in self.page_frames.items():
            if key == page:
                frame.grid()
            else:
                frame.grid_remove()
        for key, button in self.nav_buttons.items():
            selected = key == page
            button.configure(fg_color=Palette.BLUE_SOFT if selected else "transparent", text_color=Palette.TEXT if selected else Palette.MUTED)
        if page == "dashboard":
            self._update_dashboard()

    @staticmethod
    def _section_title(parent: ctk.CTkFrame, eyebrow: str, title: str, copy: str) -> None:
        ctk.CTkLabel(parent, text=eyebrow.upper(), text_color=Palette.BLUE, font=ctk.CTkFont(size=11, weight="bold")).pack(anchor="w", pady=(6, 4))
        ctk.CTkLabel(parent, text=title, text_color=Palette.TEXT, font=ctk.CTkFont(size=28, weight="bold")).pack(anchor="w")
        ctk.CTkLabel(parent, text=copy, text_color=Palette.MUTED, font=ctk.CTkFont(size=13), wraplength=850, justify="left").pack(anchor="w", pady=(7, 20))

    @staticmethod
    def _card(parent: ctk.CTkFrame, **kwargs: object) -> ctk.CTkFrame:
        defaults: dict[str, object] = {"fg_color": Palette.PANEL, "corner_radius": 16, "border_width": 1, "border_color": Palette.BORDER}
        defaults.update(kwargs)
        return ctk.CTkFrame(parent, **defaults)

    @staticmethod
    def _button(parent: ctk.CTkFrame, text: str, command: Callable[[], None], kind: str = "primary", **kwargs: object) -> ctk.CTkButton:
        theme = {
            "primary": (Palette.BLUE, Palette.BLUE_HOVER, Palette.TEXT),
            "danger": (Palette.RED, Palette.RED_HOVER, Palette.TEXT),
            "secondary": (Palette.PANEL_ALT, "#24344D", Palette.TEXT),
            "quiet": ("transparent", Palette.PANEL_ALT, Palette.MUTED),
        }[kind]
        defaults: dict[str, object] = {"height": 42, "corner_radius": 10, "font": ctk.CTkFont(size=12, weight="bold"), "fg_color": theme[0], "hover_color": theme[1], "text_color": theme[2]}
        defaults.update(kwargs)
        return ctk.CTkButton(parent, text=text, command=command, **defaults)

    # ------------------------------ Dashboard ----------------------------------

    def _build_dashboard_page(self) -> None:
        page = self._page("dashboard")
        self._section_title(page, "Control center", "Emergency room-light sync", "See what is connected, confirm your sync method, and run a safe test before your next patrol or callout.")

        hero = self._card(page, fg_color="#101E35", border_color="#24466F")
        hero.pack(fill="x", pady=(0, 16))
        hero.grid_columnconfigure(0, weight=1)
        left = ctk.CTkFrame(hero, fg_color="transparent")
        left.grid(row=0, column=0, sticky="nsew", padx=26, pady=24)
        self.dashboard_badge = ctk.CTkLabel(left, text="●  STANDBY", text_color=Palette.AMBER, fg_color=Palette.AMBER_SOFT, corner_radius=10, font=ctk.CTkFont(size=11, weight="bold"))
        self.dashboard_badge.pack(anchor="w")
        self.dashboard_title = ctk.CTkLabel(left, text="Finish light setup to get started", text_color=Palette.TEXT, font=ctk.CTkFont(size=24, weight="bold"))
        self.dashboard_title.pack(anchor="w", pady=(14, 5))
        self.dashboard_copy = ctk.CTkLabel(left, text="Connect a provider, select room lights, and choose a sync method.", text_color=Palette.MUTED, font=ctk.CTkFont(size=13), wraplength=610, justify="left")
        self.dashboard_copy.pack(anchor="w")
        self.dashboard_action = self._button(left, "Open guided setup", lambda: self.select_page("setup"), width=188)
        self.dashboard_action.pack(anchor="w", pady=(18, 0))

        live = ctk.CTkFrame(hero, width=220, fg_color="#0B1524", corner_radius=13)
        live.grid(row=0, column=1, sticky="nsew", padx=(0, 24), pady=24)
        live.grid_propagate(False)
        ctk.CTkLabel(live, text="LIVE STATE", text_color=Palette.MUTED, font=ctk.CTkFont(size=10, weight="bold")).pack(anchor="w", padx=18, pady=(18, 4))
        self.live_state = ctk.CTkLabel(live, text="OFF", text_color=Palette.MUTED, font=ctk.CTkFont(size=30, weight="bold"))
        self.live_state.pack(anchor="w", padx=18)
        self.live_hint = ctk.CTkLabel(live, text="No emergency scene is being sent.", text_color=Palette.MUTED, font=ctk.CTkFont(size=11), wraplength=175, justify="left")
        self.live_hint.pack(anchor="w", padx=18, pady=(2, 0))

        stats = ctk.CTkFrame(page, fg_color="transparent")
        stats.pack(fill="x", pady=(0, 16))
        for column in range(3):
            stats.grid_columnconfigure(column, weight=1)
        self.stat_providers = self._stat_card(stats, 0, "CONNECTED PROVIDERS", "—", "Connect Govee, Hue, or both")
        self.stat_lights = self._stat_card(stats, 1, "SELECTED LIGHTS", "—", "Only selected lights are affected")
        self.stat_sync = self._stat_card(stats, 2, "SYNC METHOD", "—", "Choose direct sync or a keybind")

        checklist = self._card(page)
        checklist.pack(fill="x", pady=(0, 16))
        ctk.CTkLabel(checklist, text="QUICK SETUP CHECKLIST", text_color=Palette.TEXT, font=ctk.CTkFont(size=15, weight="bold")).pack(anchor="w", padx=22, pady=(20, 8))
        self.checklist_frame = ctk.CTkFrame(checklist, fg_color="transparent")
        self.checklist_frame.pack(fill="x", padx=18, pady=(0, 18))

        safety = self._card(page, fg_color="#141E2D")
        safety.pack(fill="x", pady=(0, 20))
        ctk.CTkLabel(safety, text="Before you play", text_color=Palette.TEXT, font=ctk.CTkFont(size=15, weight="bold")).pack(anchor="w", padx=22, pady=(18, 3))
        ctk.CTkLabel(safety, text="Use “Test emergency lights” after setup. The app only controls the room lights you selected; it cannot modify the game itself.", text_color=Palette.MUTED, font=ctk.CTkFont(size=12), wraplength=830, justify="left").pack(anchor="w", padx=22, pady=(0, 16))

    def _stat_card(self, parent: ctk.CTkFrame, column: int, label: str, value: str, hint: str) -> ctk.CTkLabel:
        card = self._card(parent)
        card.grid(row=0, column=column, sticky="ew", padx=(0 if column == 0 else 6, 0 if column == 2 else 6))
        ctk.CTkLabel(card, text=label, text_color=Palette.MUTED, font=ctk.CTkFont(size=10, weight="bold")).pack(anchor="w", padx=18, pady=(16, 4))
        output = ctk.CTkLabel(card, text=value, text_color=Palette.TEXT, font=ctk.CTkFont(size=22, weight="bold"))
        output.pack(anchor="w", padx=18)
        ctk.CTkLabel(card, text=hint, text_color=Palette.MUTED, font=ctk.CTkFont(size=11)).pack(anchor="w", padx=18, pady=(1, 16))
        return output

    def _update_dashboard(self) -> None:
        selected_count = len(self._selected_light_ids())
        providers = [name for enabled, name in ((self.provider_govee_var.get(), "Govee"), (self.provider_hue_var.get(), "Hue")) if enabled]
        configured = bool(self.settings.setup_completed and selected_count and providers)
        active = self.controller.active
        self.top_state.configure(text="  ●  EMERGENCY ON  " if active else "  ●  SYNC OFF  ", text_color=Palette.RED if active else Palette.MUTED, fg_color=Palette.RED_SOFT if active else Palette.PANEL_ALT)
        self.live_state.configure(text="ON" if active else "OFF", text_color=Palette.RED if active else Palette.MUTED)
        self.live_hint.configure(text="Emergency colors are being sent to selected lights." if active else "No emergency scene is being sent.")

        self.stat_providers.configure(text=" + ".join(providers) if providers else "Not connected")
        self.stat_lights.configure(text=str(selected_count) if selected_count else "None")
        sync_options = []
        if self.use_companion_var.get():
            sync_options.append("Direct")
        if self.use_keybind_var.get():
            sync_options.append("Keybind")
        self.stat_sync.configure(text=" + ".join(sync_options) if sync_options else "Not chosen")

        if active:
            self.dashboard_badge.configure(text="●  EMERGENCY ACTIVE", text_color="#FECACA", fg_color=Palette.RED_SOFT)
            self.dashboard_title.configure(text="Your room emergency scene is active")
            self.dashboard_copy.configure(text=f"Sending the selected blue/red scene to {selected_count} room light(s).")
            self.dashboard_action.configure(text="Turn emergency scene off", fg_color=Palette.RED, hover_color=Palette.RED_HOVER, command=lambda: self.set_emergency(False, "Dashboard"))
        elif configured:
            self.dashboard_badge.configure(text="●  READY TO SYNC", text_color="#BBF7D0", fg_color=Palette.GREEN_SOFT)
            self.dashboard_title.configure(text="Your room-light sync is ready")
            self.dashboard_copy.configure(text=f"{selected_count} selected light(s) will respond to your configured FiveM sync method.")
            self.dashboard_action.configure(text="Test emergency lights", fg_color=Palette.BLUE, hover_color=Palette.BLUE_HOVER, command=lambda: self.set_emergency(True, "Dashboard test"))
        else:
            self.dashboard_badge.configure(text="●  SETUP NEEDED", text_color="#FDE68A", fg_color=Palette.AMBER_SOFT)
            self.dashboard_title.configure(text="Finish light setup to get started")
            self.dashboard_copy.configure(text="Connect Govee or Hue, select the lights in your room, then choose how FiveM will trigger them.")
            self.dashboard_action.configure(text="Open guided setup", fg_color=Palette.BLUE, hover_color=Palette.BLUE_HOVER, command=lambda: self.select_page("setup"))

        for child in self.checklist_frame.winfo_children():
            child.destroy()
        steps = [
            (bool(providers), "1", "Choose a lighting provider", "Select Govee, Philips Hue, or both."),
            (bool(self.devices), "2", "Discover your room lights", "Use the provider connection to list compatible lights."),
            (bool(selected_count), "3", "Select the lights to sync", "Only the selected lights will receive emergency commands."),
            (bool(sync_options), "4", "Choose a FiveM sync method", "Use direct companion sync, a shared keybind, or both."),
        ]
        for index, (done, number, title, copy) in enumerate(steps):
            row = ctk.CTkFrame(self.checklist_frame, fg_color=Palette.GREEN_SOFT if done else Palette.PANEL_ALT, corner_radius=10)
            row.grid(row=0, column=index, sticky="nsew", padx=4, pady=4)
            self.checklist_frame.grid_columnconfigure(index, weight=1)
            ctk.CTkLabel(row, text="✓" if done else number, width=27, height=27, fg_color=Palette.GREEN if done else Palette.BORDER, corner_radius=14, text_color=Palette.BACKGROUND if done else Palette.TEXT, font=ctk.CTkFont(size=12, weight="bold")).pack(anchor="w", padx=13, pady=(12, 6))
            ctk.CTkLabel(row, text=title, text_color=Palette.TEXT, font=ctk.CTkFont(size=11, weight="bold"), wraplength=170, justify="left").pack(anchor="w", padx=13)
            ctk.CTkLabel(row, text=copy, text_color=Palette.MUTED, font=ctk.CTkFont(size=10), wraplength=170, justify="left").pack(anchor="w", padx=13, pady=(3, 13))

    # ------------------------------- Setup page --------------------------------

    def _build_setup_page(self) -> None:
        page = self._page("setup")
        self._section_title(page, "Guided setup", "Connect your room lights", "Follow the three steps below. You can use Govee, Philips Hue, or both. Your secret keys stay in secure local Windows storage.")

        step_one = self._card(page)
        step_one.pack(fill="x", pady=(0, 14))
        self._step_heading(step_one, "1", "Choose and connect providers", "Enable the lighting systems you own. You can finish one provider now and add the other later.")

        providers = ctk.CTkFrame(step_one, fg_color="transparent")
        providers.pack(fill="x", padx=20, pady=(0, 20))
        providers.grid_columnconfigure((0, 1), weight=1)
        self._govee_card(providers).grid(row=0, column=0, sticky="nsew", padx=(0, 7))
        self._hue_card(providers).grid(row=0, column=1, sticky="nsew", padx=(7, 0))

        step_two = self._card(page)
        step_two.pack(fill="x", pady=(0, 14))
        self._step_heading(step_two, "2", "Discover and choose your room lights", "Find available lights, then click the cards for the lights you want to react when emergency lights are active in FiveM.")
        action_row = ctk.CTkFrame(step_two, fg_color="transparent")
        action_row.pack(fill="x", padx=20, pady=(0, 10))
        self._button(action_row, "Find enabled-provider lights", self.discover_all_enabled, "secondary", width=210).pack(side="left")
        self.light_count_label = ctk.CTkLabel(action_row, text="No lights discovered yet", text_color=Palette.MUTED, font=ctk.CTkFont(size=12))
        self.light_count_label.pack(side="left", padx=13)
        self.light_cards = ctk.CTkFrame(step_two, fg_color="#0C1422", corner_radius=12)
        self.light_cards.pack(fill="x", padx=20, pady=(0, 20))

        step_three = self._card(page)
        step_three.pack(fill="x", pady=(0, 14))
        self._step_heading(step_three, "3", "Choose your emergency scene", "Selected lights alternate between the two colors. Lights without color support still turn on at the selected brightness.")
        scene = ctk.CTkFrame(step_three, fg_color="transparent")
        scene.pack(fill="x", padx=20, pady=(0, 18))
        scene.grid_columnconfigure(5, weight=1)
        ctk.CTkLabel(scene, text="COLOR A", text_color=Palette.MUTED, font=ctk.CTkFont(size=10, weight="bold")).grid(row=0, column=0, sticky="w")
        self.color_a_entry = ctk.CTkEntry(scene, textvariable=self.color_a_var, width=112, height=37, corner_radius=9, border_color=Palette.BORDER, fg_color=Palette.PANEL_ALT)
        self.color_a_entry.grid(row=1, column=0, sticky="w", pady=(5, 0))
        self.color_a_preview = ctk.CTkLabel(scene, text="", width=37, height=37, corner_radius=9, fg_color=self.color_a_var.get())
        self.color_a_preview.grid(row=1, column=1, padx=(7, 18), pady=(5, 0))
        ctk.CTkLabel(scene, text="COLOR B", text_color=Palette.MUTED, font=ctk.CTkFont(size=10, weight="bold")).grid(row=0, column=2, sticky="w")
        self.color_b_entry = ctk.CTkEntry(scene, textvariable=self.color_b_var, width=112, height=37, corner_radius=9, border_color=Palette.BORDER, fg_color=Palette.PANEL_ALT)
        self.color_b_entry.grid(row=1, column=2, sticky="w", pady=(5, 0))
        self.color_b_preview = ctk.CTkLabel(scene, text="", width=37, height=37, corner_radius=9, fg_color=self.color_b_var.get())
        self.color_b_preview.grid(row=1, column=3, padx=(7, 22), pady=(5, 0))
        ctk.CTkLabel(scene, text="BRIGHTNESS", text_color=Palette.MUTED, font=ctk.CTkFont(size=10, weight="bold")).grid(row=0, column=4, sticky="w")
        self.brightness_label = ctk.CTkLabel(scene, text=f"{self.brightness_var.get()}%", text_color=Palette.TEXT, font=ctk.CTkFont(size=12, weight="bold"))
        self.brightness_label.grid(row=0, column=5, sticky="e")
        self.brightness_slider = ctk.CTkSlider(scene, from_=1, to=100, variable=self.brightness_var, command=lambda _: self._update_scene_preview(), button_color=Palette.BLUE, progress_color=Palette.BLUE, fg_color=Palette.BORDER)
        self.brightness_slider.grid(row=1, column=4, columnspan=2, sticky="ew", padx=(0, 2), pady=(7, 0))
        self.color_a_entry.bind("<KeyRelease>", lambda _: self._update_scene_preview())
        self.color_b_entry.bind("<KeyRelease>", lambda _: self._update_scene_preview())

        finish = self._card(page, fg_color="#102039", border_color="#24466F")
        finish.pack(fill="x", pady=(0, 20))
        ctk.CTkLabel(finish, text="Ready to save your setup?", text_color=Palette.TEXT, font=ctk.CTkFont(size=16, weight="bold")).pack(side="left", padx=22, pady=18)
        ctk.CTkLabel(finish, text="You can refine FiveM sync options on the next page.", text_color=Palette.MUTED, font=ctk.CTkFont(size=12)).pack(side="left", padx=(0, 18))
        self._button(finish, "Save and continue to FiveM sync", self.save_setup_and_open_sync, width=232).pack(side="right", padx=18, pady=13)

    def _step_heading(self, parent: ctk.CTkFrame, number: str, title: str, copy: str) -> None:
        header = ctk.CTkFrame(parent, fg_color="transparent")
        header.pack(fill="x", padx=20, pady=(18, 14))
        ctk.CTkLabel(header, text=number, width=28, height=28, corner_radius=14, fg_color=Palette.BLUE_SOFT, text_color="#BFDBFE", font=ctk.CTkFont(size=12, weight="bold")).pack(side="left", padx=(0, 10))
        words = ctk.CTkFrame(header, fg_color="transparent")
        words.pack(side="left", fill="x", expand=True)
        ctk.CTkLabel(words, text=title, text_color=Palette.TEXT, font=ctk.CTkFont(size=16, weight="bold")).pack(anchor="w")
        ctk.CTkLabel(words, text=copy, text_color=Palette.MUTED, font=ctk.CTkFont(size=12), wraplength=800, justify="left").pack(anchor="w", pady=(2, 0))

    def _govee_card(self, parent: ctk.CTkFrame) -> ctk.CTkFrame:
        card = self._card(parent, fg_color="#121D2E")
        top = ctk.CTkFrame(card, fg_color="transparent")
        top.pack(fill="x", padx=18, pady=(17, 8))
        ctk.CTkLabel(top, text="GOVEE", text_color="#A7F3D0", font=ctk.CTkFont(size=15, weight="bold")).pack(side="left")
        ctk.CTkSwitch(top, text="Use Govee", variable=self.provider_govee_var, onvalue=True, offvalue=False, progress_color=Palette.GREEN, button_color=Palette.TEXT, text_color=Palette.TEXT, font=ctk.CTkFont(size=12, weight="bold")).pack(side="right")
        ctk.CTkLabel(card, text="Paste your Govee Developer API key. The app will list compatible lights in your Govee account.", text_color=Palette.MUTED, font=ctk.CTkFont(size=12), wraplength=410, justify="left").pack(anchor="w", padx=18)
        self.govee_key_entry = ctk.CTkEntry(card, textvariable=self.govee_key_var, placeholder_text="Govee Developer API key", show="●", height=38, corner_radius=9, border_color=Palette.BORDER, fg_color=Palette.PANEL_ALT)
        self.govee_key_entry.pack(fill="x", padx=18, pady=(14, 8))
        self._button(card, "Connect & find Govee lights", self.discover_govee, "secondary").pack(anchor="w", padx=18, pady=(0, 17))
        return card

    def _hue_card(self, parent: ctk.CTkFrame) -> ctk.CTkFrame:
        card = self._card(parent, fg_color="#121D2E")
        top = ctk.CTkFrame(card, fg_color="transparent")
        top.pack(fill="x", padx=18, pady=(17, 8))
        ctk.CTkLabel(top, text="PHILIPS HUE", text_color="#FDE68A", font=ctk.CTkFont(size=15, weight="bold")).pack(side="left")
        ctk.CTkSwitch(top, text="Use Hue", variable=self.provider_hue_var, onvalue=True, offvalue=False, progress_color=Palette.GREEN, button_color=Palette.TEXT, text_color=Palette.TEXT, font=ctk.CTkFont(size=12, weight="bold")).pack(side="right")
        ctk.CTkLabel(card, text="Find your Hue Bridge on the same network. Press its physical Link button when pairing is requested.", text_color=Palette.MUTED, font=ctk.CTkFont(size=12), wraplength=410, justify="left").pack(anchor="w", padx=18)
        row = ctk.CTkFrame(card, fg_color="transparent")
        row.pack(fill="x", padx=18, pady=(14, 8))
        self.hue_ip_entry = ctk.CTkEntry(row, textvariable=self.hue_ip_var, placeholder_text="Bridge IP address", height=38, corner_radius=9, border_color=Palette.BORDER, fg_color=Palette.PANEL_ALT)
        self.hue_ip_entry.pack(side="left", fill="x", expand=True)
        self._button(row, "Find", self.discover_hue_bridge, "secondary", width=70, height=38).pack(side="left", padx=(8, 0))
        actions = ctk.CTkFrame(card, fg_color="transparent")
        actions.pack(fill="x", padx=18, pady=(0, 17))
        self._button(actions, "Pair Bridge", self.pair_hue, "secondary").pack(side="left")
        self._button(actions, "Find Hue lights", self.discover_hue, "quiet").pack(side="left", padx=(6, 0))
        return card

    def _update_scene_preview(self) -> None:
        self.brightness_label.configure(text=f"{int(self.brightness_var.get())}%")
        for value, preview in ((self.color_a_var.get(), self.color_a_preview), (self.color_b_var.get(), self.color_b_preview)):
            try:
                Color.from_hex(value.strip())
                preview.configure(fg_color=value.strip())
            except ValueError:
                preview.configure(fg_color=Palette.BORDER)

    # ------------------------------ FiveM sync ---------------------------------

    def _build_sync_page(self) -> None:
        page = self._page("sync")
        self._section_title(page, "FiveM integration", "Choose how emergency lights trigger your room", "Use direct companion sync for the game’s actual emergency-light state, or a shared keybind when a server resource cannot be installed.")

        direct = self._card(page)
        direct.pack(fill="x", pady=(0, 14))
        header = ctk.CTkFrame(direct, fg_color="transparent")
        header.pack(fill="x", padx=20, pady=(19, 7))
        ctk.CTkLabel(header, text="DIRECT COMPANION SYNC", text_color=Palette.TEXT, font=ctk.CTkFont(size=16, weight="bold")).pack(side="left")
        ctk.CTkSwitch(header, text="Enable", variable=self.use_companion_var, progress_color=Palette.GREEN, button_color=Palette.TEXT, text_color=Palette.TEXT, font=ctk.CTkFont(size=12, weight="bold")).pack(side="right")
        ctk.CTkLabel(direct, text="Recommended. The exported FiveM companion detects whether the player’s vehicle emergency lights are active and privately notifies this app on the same PC.", text_color=Palette.MUTED, font=ctk.CTkFont(size=12), wraplength=870, justify="left").pack(anchor="w", padx=20)
        flow = ctk.CTkFrame(direct, fg_color="#0C1422", corner_radius=12)
        flow.pack(fill="x", padx=20, pady=15)
        for column in range(3):
            flow.grid_columnconfigure(column, weight=1)
        for index, (number, title, text) in enumerate((
            ("1", "Export", "Save the prepared FiveM resource into your resources folder."),
            ("2", "Enable", "Add ensure fivem-room-light-sync to the server configuration."),
            ("3", "Play", "Keep this desktop app open while you play on that server."),
        )):
            pane = ctk.CTkFrame(flow, fg_color="transparent")
            pane.grid(row=0, column=index, sticky="nsew", padx=15, pady=16)
            ctk.CTkLabel(pane, text=number, width=25, height=25, corner_radius=13, fg_color=Palette.BLUE_SOFT, text_color="#BFDBFE", font=ctk.CTkFont(size=11, weight="bold")).pack(anchor="w")
            ctk.CTkLabel(pane, text=title, text_color=Palette.TEXT, font=ctk.CTkFont(size=12, weight="bold")).pack(anchor="w", pady=(7, 2))
            ctk.CTkLabel(pane, text=text, text_color=Palette.MUTED, font=ctk.CTkFont(size=11), wraplength=205, justify="left").pack(anchor="w")
        direct_actions = ctk.CTkFrame(direct, fg_color="transparent")
        direct_actions.pack(fill="x", padx=20, pady=(0, 20))
        ctk.CTkLabel(direct_actions, text="LOCAL PORT", text_color=Palette.MUTED, font=ctk.CTkFont(size=10, weight="bold")).pack(side="left")
        ctk.CTkEntry(direct_actions, textvariable=self.port_var, width=78, height=36, corner_radius=9, border_color=Palette.BORDER, fg_color=Palette.PANEL_ALT).pack(side="left", padx=(8, 15))
        self._button(direct_actions, "Export FiveM resource", self.export_resource, width=175).pack(side="left")

        fallback = self._card(page)
        fallback.pack(fill="x", pady=(0, 14))
        header = ctk.CTkFrame(fallback, fg_color="transparent")
        header.pack(fill="x", padx=20, pady=(19, 7))
        ctk.CTkLabel(header, text="KEYBIND FALLBACK", text_color=Palette.TEXT, font=ctk.CTkFont(size=16, weight="bold")).pack(side="left")
        ctk.CTkSwitch(header, text="Enable", variable=self.use_keybind_var, progress_color=Palette.GREEN, button_color=Palette.TEXT, text_color=Palette.TEXT, font=ctk.CTkFont(size=12, weight="bold")).pack(side="right")
        ctk.CTkLabel(fallback, text="Use this if you cannot install a companion resource. Set the same key for your FiveM emergency lights and this app will mirror that key press.", text_color=Palette.MUTED, font=ctk.CTkFont(size=12), wraplength=870, justify="left").pack(anchor="w", padx=20)
        fallback_row = ctk.CTkFrame(fallback, fg_color="transparent")
        fallback_row.pack(fill="x", padx=20, pady=(15, 20))
        ctk.CTkLabel(fallback_row, text="KEY OR KEY COMBINATION", text_color=Palette.MUTED, font=ctk.CTkFont(size=10, weight="bold")).pack(side="left")
        ctk.CTkEntry(fallback_row, textvariable=self.hotkey_var, width=155, height=38, corner_radius=9, border_color=Palette.BORDER, fg_color=Palette.PANEL_ALT).pack(side="left", padx=(10, 20))
        ctk.CTkCheckBox(fallback_row, text="Only react while FiveM/GTA is active", variable=self.only_fivem_var, fg_color=Palette.BLUE, hover_color=Palette.BLUE_HOVER, text_color=Palette.TEXT, font=ctk.CTkFont(size=12)).pack(side="left")

        live = self._card(page, fg_color="#102039", border_color="#24466F")
        live.pack(fill="x", pady=(0, 20))
        ctk.CTkLabel(live, text="Live controls", text_color=Palette.TEXT, font=ctk.CTkFont(size=16, weight="bold")).pack(anchor="w", padx=20, pady=(17, 3))
        ctk.CTkLabel(live, text="Use these controls to confirm that the lights you selected are responding correctly.", text_color=Palette.MUTED, font=ctk.CTkFont(size=12)).pack(anchor="w", padx=20)
        buttons = ctk.CTkFrame(live, fg_color="transparent")
        buttons.pack(fill="x", padx=20, pady=(15, 18))
        self._button(buttons, "Test emergency lights", lambda: self.set_emergency(True, "Manual test"), width=168).pack(side="left")
        self._button(buttons, "Turn selected lights off", lambda: self.set_emergency(False, "Manual off"), "danger", width=176).pack(side="left", padx=8)
        self._button(buttons, "Apply & restart sync", self.save_setup, "secondary", width=166).pack(side="right")

    # --------------------------------- Help ------------------------------------

    def _build_help_page(self) -> None:
        page = self._page("help")
        self._section_title(page, "Help & safety", "Simple answers before you play", "Use this page if you are deciding between the direct FiveM companion and the fallback keybind, or if a provider does not show any lights.")
        help_card = self._card(page)
        help_card.pack(fill="x", pady=(0, 14))
        for title, copy in (
            ("Which sync method should I use?", "Use Direct Companion Sync if you own/administer the FiveM server or the server owner permits the resource. It follows the actual emergency-light state. Use Keybind Fallback on servers where you cannot install a resource."),
            ("Why do I not see my lights?", "For Govee, confirm the light is in the Govee Home account connected to the API key. For Hue, make sure the Bridge and this PC are on the same local network, then pair after pressing the Bridge Link button."),
            ("Are my keys safe?", "The app stores provider credentials and its local companion token in the Windows user credential vault. The FiveM listener is loopback-only, so it is not exposed to the internet or other devices on your network."),
            ("What does turning sync off do?", "It turns off only the lights you selected in this app. It does not change anything in FiveM and it does not control unselected lights."),
        ):
            item = ctk.CTkFrame(help_card, fg_color="transparent")
            item.pack(fill="x", padx=22, pady=(17, 0))
            ctk.CTkLabel(item, text=title, text_color=Palette.TEXT, font=ctk.CTkFont(size=14, weight="bold")).pack(anchor="w")
            ctk.CTkLabel(item, text=copy, text_color=Palette.MUTED, font=ctk.CTkFont(size=12), wraplength=870, justify="left").pack(anchor="w", pady=(4, 0))
        ctk.CTkLabel(help_card, text="Need to change providers or selected lights? Return to Setup lights at any time; your previously selected devices will remain checked when they are rediscovered.", text_color="#BFDBFE", fg_color=Palette.BLUE_SOFT, corner_radius=9, font=ctk.CTkFont(size=11), wraplength=840, justify="left").pack(fill="x", padx=22, pady=20)

    # ------------------------------ Light discovery ----------------------------

    def discover_all_enabled(self) -> None:
        if not self.provider_govee_var.get() and not self.provider_hue_var.get():
            messagebox.showinfo(self.APP_NAME, "Choose Govee, Philips Hue, or both before discovering lights.")
            return
        if self.provider_govee_var.get():
            self.discover_govee(show_completion=False)
        if self.provider_hue_var.get():
            self.discover_hue(show_completion=False)

    def discover_govee(self, show_completion: bool = True) -> None:
        key = self.govee_key_var.get().strip()
        if not self.provider_govee_var.get():
            messagebox.showinfo(self.APP_NAME, "Turn on Govee before searching for Govee lights.")
            return
        if not key:
            messagebox.showinfo(self.APP_NAME, "Paste your Govee Developer API key first.")
            return
        message = "Looking for Govee lights…"
        self._run_worker(message, lambda: GoveeProvider(key).discover_lights(), lambda lights: self._merge_discovered_lights(lights, show_completion))

    def discover_hue_bridge(self) -> None:
        if not self.provider_hue_var.get():
            messagebox.showinfo(self.APP_NAME, "Turn on Philips Hue before searching for a Hue Bridge.")
            return
        def set_bridge(bridges: list[str]) -> None:
            if not bridges:
                raise RuntimeError("No Hue Bridge was found. Check that this PC and the Bridge are on the same network, or enter the Bridge IP manually.")
            self.hue_ip_var.set(bridges[0])
            self.status_var.set(f"Hue Bridge found at {bridges[0]}. Press the Bridge Link button, then choose Pair Bridge.")
        self._run_worker("Looking for your Hue Bridge…", HueProvider.discover_bridges, set_bridge)

    def pair_hue(self) -> None:
        bridge_ip = self.hue_ip_var.get().strip()
        if not self.provider_hue_var.get():
            messagebox.showinfo(self.APP_NAME, "Turn on Philips Hue before pairing your Bridge.")
            return
        if not bridge_ip:
            messagebox.showinfo(self.APP_NAME, "Use Find or enter the Hue Bridge IP address first.")
            return
        messagebox.showinfo(self.APP_NAME, "Press the physical Link button on your Hue Bridge now. Then select OK and pairing will begin.")
        def complete(username: str) -> None:
            self.settings.hue_username = username
            self.status_var.set("Hue Bridge paired. Now choose Find Hue lights.")
        self._run_worker("Pairing with Hue Bridge…", lambda: HueProvider(bridge_ip).pair(), complete)

    def discover_hue(self, show_completion: bool = True) -> None:
        bridge_ip = self.hue_ip_var.get().strip()
        if not self.provider_hue_var.get():
            messagebox.showinfo(self.APP_NAME, "Turn on Philips Hue before searching for Hue lights.")
            return
        if not bridge_ip or not self.settings.hue_username:
            messagebox.showinfo(self.APP_NAME, "Find and pair your Hue Bridge first.")
            return
        self._run_worker("Looking for Hue lights…", lambda: HueProvider(bridge_ip, self.settings.hue_username).discover_lights(), lambda lights: self._merge_discovered_lights(lights, show_completion))

    def _merge_discovered_lights(self, incoming: list[LightDevice], show_completion: bool) -> None:
        known = {device.unique_id: device for device in self.devices}
        known.update({device.unique_id: device for device in incoming})
        self.devices = list(known.values())
        self._update_selection_cards()
        self.status_var.set(f"Found {len(incoming)} light(s). Click the room lights you want to synchronize.")
        if show_completion:
            self.select_page("setup")

    def _update_selection_cards(self) -> None:
        previous = set(self.settings.selected_lights) | {light_id for light_id, variable in self.light_vars.items() if variable.get()}
        self.light_vars = {}
        if not hasattr(self, "light_cards"):
            return
        for child in self.light_cards.winfo_children():
            child.destroy()
        if not self.devices:
            empty = ctk.CTkFrame(self.light_cards, fg_color="transparent")
            empty.pack(fill="x", padx=16, pady=17)
            ctk.CTkLabel(empty, text="No lights discovered yet", text_color=Palette.TEXT, font=ctk.CTkFont(size=13, weight="bold")).pack(anchor="w")
            ctk.CTkLabel(empty, text="Connect Govee or Hue above, then use the discovery buttons to populate this list.", text_color=Palette.MUTED, font=ctk.CTkFont(size=12)).pack(anchor="w", pady=(3, 0))
        else:
            for index, device in enumerate(sorted(self.devices, key=lambda item: (item.provider, item.name.lower()))):
                variable = tk.BooleanVar(value=device.unique_id in previous)
                self.light_vars[device.unique_id] = variable
                row = ctk.CTkFrame(self.light_cards, fg_color=Palette.PANEL_ALT, corner_radius=10)
                row.pack(fill="x", padx=9, pady=5)
                row.grid_columnconfigure(1, weight=1)
                checkbox = ctk.CTkCheckBox(row, text="", variable=variable, width=28, checkbox_width=20, checkbox_height=20, corner_radius=6, fg_color=Palette.BLUE, hover_color=Palette.BLUE_HOVER, border_color=Palette.MUTED, command=self._update_dashboard)
                checkbox.grid(row=0, column=0, rowspan=2, padx=(13, 7), pady=12)
                provider_text = "GOVEE" if device.provider == "govee" else "PHILIPS HUE"
                ctk.CTkLabel(row, text=device.name, text_color=Palette.TEXT, font=ctk.CTkFont(size=13, weight="bold")).grid(row=0, column=1, sticky="sw", pady=(11, 0))
                ctk.CTkLabel(row, text=f"{provider_text}  •  {device.model}", text_color=Palette.MUTED, font=ctk.CTkFont(size=10, weight="bold")).grid(row=1, column=1, sticky="nw", pady=(1, 11))
                capabilities = []
                if device.supports_color:
                    capabilities.append("Color")
                if device.supports_brightness:
                    capabilities.append("Brightness")
                ctk.CTkLabel(row, text="  •  ".join(capabilities) or "On / off", text_color="#BFDBFE", fg_color=Palette.BLUE_SOFT, corner_radius=8, font=ctk.CTkFont(size=10, weight="bold")).grid(row=0, column=2, rowspan=2, padx=13, pady=12)
        selected = len(self._selected_light_ids())
        self.light_count_label.configure(text=f"{len(self.devices)} light(s) found • {selected} selected" if self.devices else "No lights discovered yet")

    # ----------------------------- Saving and sync -----------------------------

    def _selected_light_ids(self) -> list[str]:
        return [light_id for light_id, variable in self.light_vars.items() if variable.get()]

    def _read_settings_from_ui(self) -> AppSettings:
        try:
            port = int(self.port_var.get())
            if not 1024 <= port <= 65535:
                raise ValueError
        except ValueError as exc:
            raise ValueError("Local port must be a number from 1024 through 65535.") from exc
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
            selected_lights=self._selected_light_ids(),
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

    def save_setup_and_open_sync(self) -> None:
        if self.save_setup():
            self.select_page("sync")

    def save_setup(self) -> bool:
        try:
            settings = self._read_settings_from_ui()
            if not settings.govee_enabled and not settings.hue_enabled:
                raise ValueError("Choose Govee, Philips Hue, or both.")
            if not settings.selected_lights:
                raise ValueError("Select at least one room light to synchronize.")
            if settings.govee_enabled and not self.govee_key_var.get().strip():
                raise ValueError("Paste a Govee Developer API key or turn off Govee.")
            if settings.hue_enabled and (not settings.hue_bridge_ip or not settings.hue_username):
                raise ValueError("Find and pair the Hue Bridge or turn off Philips Hue.")
            self.settings = settings
            self.store.save(self.settings, self.govee_key_var.get())
            self.start_sync_services()
            self._update_dashboard()
            self.status_var.set(f"Setup saved. {len(settings.selected_lights)} selected light(s) are ready for sync.")
            return True
        except Exception as exc:
            messagebox.showerror(self.APP_NAME, str(exc))
            return False

    def start_sync_services(self) -> None:
        try:
            current = self._read_settings_from_ui()
            self.settings = current
            self.controller.configure(self.settings, self.devices, self.govee_key_var.get())
            self.listener.stop()
            self.keybind.stop()
            if self.settings.use_companion:
                self.listener.start(self.settings.listener_port, self.settings.shared_secret)
            if self.settings.use_keybind:
                self.keybind.start(self.settings.hotkey, self.settings.only_when_fivem_active)
            services = []
            if self.settings.use_companion:
                services.append("Direct companion")
            if self.settings.use_keybind:
                services.append(f"Keybind {self.settings.hotkey}")
            self.status_var.set("Sync ready: " + (" + ".join(services) if services else "manual controls only"))
            self._update_dashboard()
        except Exception as exc:
            self.report_error(str(exc))

    def set_emergency(self, active: bool, source: str) -> None:
        if not self.devices or not self._selected_light_ids():
            messagebox.showinfo(self.APP_NAME, "Connect and select your room lights in Setup lights first.")
            self.select_page("setup")
            return
        self.controller.configure(self.settings, self.devices, self.govee_key_var.get())
        self.controller.set_active(active, source)
        self.state_var.set("Emergency scene is ON" if active else "Emergency scene is OFF")
        self.status_var.set(f"{source}: {'sending emergency colors to selected lights' if active else 'turning selected lights off'}…")
        self._update_dashboard()

    def on_sync_state(self, active: bool, source: str) -> None:
        self.after(0, lambda: self.set_emergency(active, source))

    def export_resource(self) -> None:
        try:
            settings = self._read_settings_from_ui()
        except ValueError as exc:
            messagebox.showerror(self.APP_NAME, str(exc))
            return
        destination = filedialog.askdirectory(title="Choose your FiveM resources folder")
        if not destination:
            return
        source = Path(__file__).resolve().parent.parent / "fivem_resource" / "fivem-room-light-sync"
        target = Path(destination) / "fivem-room-light-sync"
        try:
            if target.exists():
                shutil.rmtree(target)
            shutil.copytree(source, target)
            (target / "config.lua").write_text(
                "-- Generated by FiveM Room Light Sync. Keep this token private.\n"
                f"Config.Endpoint = 'http://127.0.0.1:{settings.listener_port}/sync'\n"
                f"Config.Token = '{settings.shared_secret}'\n"
                "Config.PollIntervalMs = 250\n",
                encoding="utf-8",
            )
            messagebox.showinfo(self.APP_NAME, f"FiveM resource exported successfully.\n\nFolder: {target}\n\nAdd `ensure fivem-room-light-sync` to the server configuration, then keep this desktop app open while you play.")
            self.status_var.set("FiveM resource exported. Add the shown ensure line to your server configuration.")
        except OSError as exc:
            messagebox.showerror(self.APP_NAME, f"Could not export the FiveM resource: {exc}")

    # ------------------------------ Async helpers ------------------------------

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
