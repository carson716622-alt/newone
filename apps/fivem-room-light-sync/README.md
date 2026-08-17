# FiveM Room Light Sync

**FiveM Room Light Sync** is a Windows desktop companion that applies an emergency blue/red scene to the room lights selected by the player. A user can configure **Govee**, **Philips Hue**, or both during first-run setup. The application offers two complementary sync modes: an optional FiveM client resource that reads the player vehicle’s actual emergency-light/siren state, and a configurable global keybind fallback.

> The app never exposes a room-light endpoint to the internet. Its FiveM listener is bound to `127.0.0.1` and requires a generated token.

## Included capabilities

| Capability | Behavior |
| --- | --- |
| Provider choice at first launch | The user may select **Govee**, **Philips Hue**, or both. |
| Light discovery and selection | Govee devices are discovered through the user’s account API; Hue lights are discovered through the linked local Bridge. Only the selected lights receive emergency commands. |
| Emergency appearance | The user chooses two emergency colors and brightness. Selected lights alternate Color A / Color B in selection order; non-color lights still turn on at the selected brightness. |
| Direct FiveM state sync | The companion resource detects `IsVehicleSirenOn` for the player’s current vehicle and reports changes to the local app. |
| Keybind fallback | A user-configurable global hotkey toggles emergency sync, with an optional guard that only responds when FiveM/GTA is the foreground window. |
| Secure local storage | API keys, Hue pairing credentials, and the companion token are stored through the Windows Credential Manager backend rather than the ordinary settings file. |

## Build the Windows executable

The delivered `FiveM-Room-Light-Sync.exe` is a standalone Windows executable. If rebuilding from source, use Python 3.12 or later on Windows:

```powershell
cd apps\fivem-room-light-sync
py -m pip install -r requirements.txt
py -m PyInstaller --noconfirm --clean --onefile --windowed --name FiveM-Room-Light-Sync --collect-all keyring --collect-submodules keyring.backends --add-data "fivem_resource;fivem_resource" launcher.py
```

The executable is written to `dist\FiveM-Room-Light-Sync.exe`.

## First-run setup

Launch the executable and open **Setup & Lights**. Select the providers that the user owns, then connect each selected provider as described below.

| Provider | First-run connection | Light selection |
| --- | --- | --- |
| **Govee** | Enter a Govee Developer API key, then choose **Find Govee lights**. Create the key in the Govee Home app under Settings → Apply for API Key. [1] | Select one or more discovered Govee lights in the table. |
| **Philips Hue** | Choose **Find Bridge** on the same network, or enter the Bridge IP address. Press the Bridge’s physical Link button, then choose **Pair Bridge**, and finally **Find Hue lights**. [2] | Select one or more discovered Hue lights in the same table. |
| **Both** | Complete each applicable row. The application stores the providers independently and controls the combined selected-light list. | Choose any mix of Govee and Hue lights. |

Choose two hex colors, configure brightness, select the participating lights, and choose **Save setup and start sync**. The default colors are police/emergency-style blue (`#0055FF`) and red (`#FF1A1A`).

## FiveM direct sync

The direct mode is the most accurate option because the companion resource checks whether the player’s vehicle lights and sirens are enabled through the documented FiveM native. [3] Use **Emergency Sync → Export FiveM resource** to write a configured `fivem-room-light-sync` resource folder into the appropriate FiveM resources directory. The export includes the app’s loopback port and a unique local token.

Add the resource to the server configuration:

```cfg
ensure fivem-room-light-sync
```

Restart the server/resource and leave the Windows desktop application running while the player is in FiveM. The resource runs client-side and posts the player’s active/inactive state to the app using FiveM’s documented HTTP-request facility. [4]

| Situation | Recommended option |
| --- | --- |
| The user owns or administers the FiveM server | Install the exported companion resource and use direct sync. |
| The server owner permits custom resources | Ask the owner to install the exported resource. |
| The user plays on a server where they cannot install resources | Configure the shared keybind fallback in the desktop app instead. |

## Keybind fallback

Open **Emergency Sync**, check **Also use a global keybind fallback**, and specify a key or chord such as `F7`, `ctrl+shift+l`, or `alt+g`. Set the same in-game emergency-light binding when possible. With the foreground-only option enabled, the hotkey is ignored outside a FiveM/GTA window.

This mode intentionally mirrors a key press rather than attempting to inspect an unmodified remote server’s game state. The direct companion mode should be used whenever resource installation is permitted.

## Operational notes and safety

The application sends commands only when emergency sync changes state; it does not continuously flash every device. This avoids unnecessary cloud API traffic and respects the Govee device-control rate limit, which is documented as 12 requests per second per account. [5] On deactivation, the selected lights are switched off. It does not attempt to restore a prior brightness/color scene because restoring a prior state consistently is not available across all supported device/provider combinations.

Test the configuration with **Test emergency lights ON** and **Turn selected lights OFF** before driving in a session. If a device is not shown, confirm it is visible in the Govee Home app or Hue app, confirm this PC is connected to the same local network for Hue, and re-run discovery.

## Development validation

A small provider/listener regression suite is included:

```powershell
cd apps\fivem-room-light-sync
py tests_core.py
```

## References

[1]: https://developer.govee.com/reference/apply-you-govee-api-key "Govee: Apply Govee API Key"
[2]: https://developers.meethue.com/develop/get-started-2/ "Philips Hue: Get Started"
[3]: https://docs.fivem.net/natives/?_0x4C9BF537BE2634B2 "Cfx.re: IsVehicleSirenOn"
[4]: https://docs.fivem.net/docs/scripting-reference/runtimes/lua/functions/PerformHttpRequest/ "Cfx.re: PerformHttpRequest"
[5]: https://developer.govee.com/reference/control-you-devices "Govee: Control Your Device"
