# LoveSync - Mobile App Interface Design

## Overview

LoveSync is a couples-only mobile app that lets partners send hearts and special messages to each other. Messages can appear on iOS/Android home screen and lock screen widgets. Couples pair via a unique invite code generated at registration.

---

## Screen List

| Screen | Description |
|--------|-------------|
| **Welcome** | Splash/landing with app branding, "Login" and "Register" buttons |
| **Register** | Custom email + password registration form |
| **Login** | Custom email + password login form |
| **Pair Setup** | After registration: shows user's invite code + input to enter partner's code |
| **Home (Hearts)** | Main screen: large heart button to send love, shows received hearts with animation |
| **Messages** | Send/receive special messages that appear on partner's widget |
| **Widget Preview** | Preview of how the latest message looks on the widget |
| **Settings** | Profile info, partner info, invite code, logout, theme toggle |

---

## Primary Content and Functionality

### Welcome Screen
- App logo centered with "LoveSync" title
- Subtitle: "Stay connected with your love"
- Two buttons: "Login" and "Create Account"
- Soft gradient background in brand pink/rose tones

### Register Screen
- Fields: Display Name, Email, Password, Confirm Password
- "Create Account" button
- Link to Login screen
- On success: auto-login and navigate to Pair Setup

### Login Screen
- Fields: Email, Password
- "Login" button
- Link to Register screen
- On success: navigate to Home (if paired) or Pair Setup (if not paired)

### Pair Setup Screen
- Section 1: "Your Invite Code" — large, copyable 6-character alphanumeric code
- Section 2: "Enter Partner's Code" — text input + "Connect" button
- Explanation text: "Share your code with your partner so they can join your couple"
- Skip option (can pair later from Settings)

### Home (Hearts) Screen — Tab 1
- Large pulsing heart button in center
- Tap to send a heart to partner
- Counter showing hearts sent today / total hearts
- Recent hearts received with timestamp
- Heart animation plays when a heart is received
- Partner's name displayed at top

### Messages Screen — Tab 2
- Input field at bottom to compose a special message
- List of sent/received messages with timestamps
- Messages marked with "On Widget" badge if currently displayed
- "Set as Widget Message" action on each sent message
- Character limit indicator (50 chars for widget display)

### Settings Screen — Tab 3
- Profile section: name, email
- Partner section: partner's name (if paired)
- Invite code section: show code, copy button
- If not paired: input to enter partner's code
- Logout button
- App version info

---

## Key User Flows

### Registration & Pairing Flow
1. User opens app → Welcome screen
2. Taps "Create Account" → Register screen
3. Fills form, taps "Create Account" → Account created
4. Auto-navigated to Pair Setup screen
5. User sees their unique invite code
6. User shares code with partner (via text, etc.)
7. Partner enters code → Both users are now paired
8. Navigate to Home screen

### Sending a Heart
1. User is on Home screen
2. Taps the large heart button
3. Heart animation plays (scale + float up)
4. Haptic feedback (Light impact)
5. Heart count increments
6. Partner receives the heart (visible on their Home screen)

### Sending a Widget Message
1. User navigates to Messages tab
2. Types a message (max 50 chars)
3. Taps "Send" → Message appears in list
4. Taps "Set as Widget" on the message
5. Message is now the active widget message for partner
6. Partner's widget updates to show this message

### Pairing Later (from Settings)
1. User navigates to Settings tab
2. Scrolls to Invite Code section
3. Enters partner's code
4. Taps "Connect" → Paired successfully

---

## Color Choices

| Token | Light Mode | Dark Mode | Purpose |
|-------|-----------|-----------|---------|
| `primary` | `#E8527A` | `#F06292` | Brand pink — hearts, buttons, accents |
| `background` | `#FFF5F7` | `#1A1015` | Soft rose-tinted white / warm dark |
| `surface` | `#FFFFFF` | `#2D1F25` | Cards, input backgrounds |
| `foreground` | `#2D1B2E` | `#F5E6EF` | Primary text |
| `muted` | `#8E7A85` | `#A89BA2` | Secondary text, timestamps |
| `border` | `#F0D4DC` | `#4A3540` | Dividers, input borders |
| `success` | `#4CAF50` | `#66BB6A` | Success states |
| `warning` | `#FF9800` | `#FFB74D` | Warning states |
| `error` | `#E53935` | `#EF5350` | Error states |

### Accent Colors (non-token, used in components)
- **Heart Red**: `#FF1744` — The heart send button
- **Heart Pink Glow**: `#FF80AB` — Heart animation glow
- **Soft Rose**: `#FCE4EC` — Background accents, badges

---

## Layout Principles

- **Mobile portrait (9:16)** optimized, one-handed usage
- Tab bar at bottom with 3 tabs: Hearts (home), Messages, Settings
- All interactive elements reachable with thumb
- Large tap targets (min 44pt) for primary actions
- Heart button is 120x120pt centered on Home screen
- Message input pinned to bottom of Messages screen
- Settings is a scrollable list

---

## Typography

- **Headings**: System bold, 28-32pt
- **Body**: System regular, 16pt
- **Captions/timestamps**: System regular, 13pt, muted color
- **Heart counter**: System bold, 48pt
- **Invite code**: Monospace bold, 32pt, letter-spacing 4pt

---

## Widget Design

The widget displays the latest special message from the partner:
- Small widget (2x2): Partner name + message text
- Medium widget (4x2): Partner name + message + heart icon + timestamp
- Background: Semi-transparent with brand pink accent
- Text: White or foreground depending on system theme

> Note: Actual iOS/Android widgets require native code. The app will provide a "Widget Preview" and expose a data endpoint that native widget extensions can consume. The app UI will show users how to add the widget.
