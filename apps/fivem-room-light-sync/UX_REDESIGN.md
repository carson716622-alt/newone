# FiveM Room Light Sync — UX Redesign

## Design objective

The application will feel like a simple control center rather than a technical configuration utility. A user should be able to see whether room-light sync is ready, turn it on or off, and complete setup without understanding APIs, network addresses, or FiveM resource files in advance.

## Visual direction

The refreshed desktop application uses a **dark operations-console interface** built around deep navy surfaces, rounded cards, restrained blue/red emergency accents, comfortable spacing, and clear type hierarchy. Color is used purposefully: blue indicates ready or active navigation, red indicates emergency light state, amber indicates an action still required, and neutral slate carries secondary information.

## Information architecture

| Area | Primary question answered | Main interactions |
| --- | --- | --- |
| Dashboard | “Is my sync ready and currently active?” | Review readiness, toggle a safe live test, open the next unfinished setup step. |
| Guided Setup | “How do I connect and choose my lights?” | Select Govee/Hue, securely connect, discover lights, select devices, choose colors/brightness. |
| FiveM Sync | “How will the app know emergency lights are active?” | Enable companion sync, export resource, configure fallback keybind, copy clear installation steps. |
| Help & Safety | “What do I need to do next or fix?” | See plain-language setup guidance, limitations, and status messages. |

## Interaction rules

The interface will always state the next action in plain language. It will use numbered stages and visible completion indicators rather than exposing the user to a dense group of independent settings. Sensitive information, including API keys and local pairing credentials, remains masked and is described in user language. Destructive actions are avoided; “turn off selected lights” is always an explicit action.

## Acceptance criteria

The finished UI must provide a polished dashboard, a clearly staged setup journey, large and accessible call-to-action controls, a concise live-sync state display, visually grouped provider cards, an obvious selected-light list, and contextual descriptions for the direct FiveM resource and keybind fallback. All original connection and sync capabilities remain available.

## Visual review findings

The virtual-display preview confirms that the redesigned first-run experience opens on the Guided Setup screen, matching the highlighted sidebar navigation. The resulting screen has a clear dark visual hierarchy, prominent provider cards, large controls, a straightforward numbered sequence, and a persistent status line. A page-navigation correction was applied during review so each sidebar choice now hides the other page containers and displays only its matching page.
