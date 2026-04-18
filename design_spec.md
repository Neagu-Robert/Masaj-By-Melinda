# Spa Website UI/UX Specification: "Progressive Disclosure" Redesign

## 1. Project Context & Goals
We are redesigning the services display section (`/home` and `/pachete`) of a premium massage and spa clinic website. 
* **Vibe:** Premium, relaxing, trustworthy, high-end clinic.
* **Problem:** Previous design used wide buttons that looked empty on desktop and hid too much information behind clicks.
* **Solution:** Implement a responsive "Progressive Disclosure" card grid. High-quality stock photography (no AI artifacts) will be used. 

---

## 2. Global Design System

### Color Palette
Avoid pure black (`#000000`) and pure white (`#FFFFFF`) to reduce eye strain and maintain a premium feel.
* **Card Background:** `#1E1B24` (Slightly elevated dark tone)
* **Primary Text:** `#F3EDF7` (Creamy white with a hint of lilac)
* **Secondary Text:** `#A59EAD` (Muted gray-purple for durations/prices)
* **Primary CTA (Buttons):** `#7C3AED` (Vibrant purple - use strictly for actions like "Rezervă acum")
* **Hover Glow Effect:** `rgba(124, 58, 237, 0.15)` (Soft purple)
* **Image Overlay:** `linear-gradient(to top, rgba(18, 16, 22, 0.9), rgba(18, 16, 22, 0.2))`

### Typography & Spacing
* **Radii:** Use subtle rounded corners (`8px` or `12px`) for cards and buttons. No harsh sharp edges.
* **Spacing:** Follow a strict 8px/16px/24px/32px spacing scale.

---

## 3. Component Specs & Wireframes

### A. The Service Card Grid (Desktop & Tablet)
* **Layout:** 3-column grid centered on the screen.
* **Default State:** Cards display the background image (with dark overlay) and the service title only.
* **Hover State (Progressive Disclosure):** 1. The dark image overlay lightens slightly (e.g., from 0.9 opacity to 0.6).
  2. The background image scales smoothly to `1.05x` (transform: scale).
  3. A soft purple `box-shadow` glow appears around the card.
  4. The bottom section containing the duration, price, and CTA buttons slides up and fades in.

```text
       CARD 1 (Default)             CARD 2 (Hover State)             CARD 3 (Default)
+-------------------------+  +-------------------------+  +-------------------------+
|                         |  | *Soft purple glow box* |  |                         |
|    [Image: Stones]      |  |    [Image: Bamboo]      |  |    [Image: Face]        |
|    (Dark overlay)       |  |    (Slightly Zoomed)    |  |    (Dark overlay)       |
|                         |  |                         |  |                         |
|                         |  | Masaj cu bețe de bambus |  |                         |
|                         |  | ----------------------- |  |                         |
| Masaj cu pietre         |  | ⏱ 60 min | 💰 150 RON  |  | Masaj facial            |
| vulcanice               |  |                         |  |                         |
|                         |  | [ Detalii ] [ Rezervă ] |  |                         |
+-------------------------+  +-------------------------+  +-------------------------+


### B. The Service Card List (Mobile)
* **Layout:** 1-column vertical stack.
* **Interaction:** NO hover effects. All information (title, price, duration, and buttons) is visible by default to ensure ease of tapping. 
+-------------------------+
|    [Image: Bamboo]      |
|                         |
| Masaj cu bețe de bambus |
| ⏱ 60 min | 💰 150 RON   |
|                         |
| [ Detalii ] [ Rezervă ] |
+-------------------------+
           [Space: 16px]
+-------------------------+
|    [Image: Stones]      |
|                         |
| Masaj cu pietre         |
| vulcanice               |
| ⏱ 60 min | 💰 150 RON   |
|                         |
| [ Detalii ] [ Rezervă ] |
+-------------------------+

### C. The Details Modal
* **Triggered:** when a user clicks the "Detalii" (Details) button.
* **Background:** Dark semi-transparent backdrop blur (e.g., backdrop-blur-sm).
* **Desktop Layout:** 2-column layout to utilize wide screens efficiently. Left side is a high-res image (transparent PNG if equipment, or styled stock photo), right side is scrollable text and CTA.
* **Mobile Layout:** Stacked. Image on top, text below.

=============================================================================
|                                                                [X] Close  |
|  +-------------------------+  +----------------------------------------+  |
|  |                         |  |  Masaj cu bețe de bambus               |  |
|  |                         |  |  ⏱ 60 min | 💰 150 RON                 |  |
|  |      [Large High-Res    |  |                                        |  |
|  |       Image Here]       |  |  Descriere:                            |  |
|  |       (No harsh         |  |  Folosește bețe de bambus pentru a     |  |
|  |       white square      |  |  destinde mușchii și a activa          |  |
|  |       backgrounds)      |  |  circulația...                         |  |
|  |                         |  |                                        |  |
|  |                         |  |  Beneficii:                            |  |
|  +-------------------------+  |  • Destinde mușchii                    |  |
|                               |  • Oferă o experiență tonifiantă       |  |
|                               |  • Combate oboseala musculară          |  |
|                               |                                        |  |
|                               |  [      Rezervă Acum (Primary CTA)  ]  |  |
|                               +----------------------------------------+  |
=============================================================================