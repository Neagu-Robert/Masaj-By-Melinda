# Spa Website UI/UX Specification: "/pachete" (Special Offers) Redesign

## 1. Project Context & Goals
* **Objective:** Elevate the Special Packages page to match the premium, dark-themed "high-end clinic" aesthetic of the main services page.
* **Key Fixes:** Improve text scannability, fix broken visual immersion caused by bright stock assets, and reduce friction for purchasing by bringing Call-to-Action (CTA) buttons directly to the package cards.

## 2. Action Items & Refactoring Rules
1. **Asset Harmony:** Replace the images from the current cards with their corresponding images from the `public/new_images` folder.
2. **Typography & Hierarchy:** * Stop using "walls of text" for package details. 
   * Extract features into a bulleted list (`<ul>`).
   * Bold the key metrics (Price, Duration).
3. **UX Optimization (CTAs):** * Add a button row at the bottom of the text content inside *every* card.
   * Button 1 (Primary): Phone icon + visible phone number (e.g., "📞 0771 761 649"). Tapping opens the phone's dialer (`tel:0771761649`).
   * Button 2 (Secondary): Email icon + text "Email". Tapping opens the default mail app (`mailto:melindaneagu22@gmail.com`).
4. **Header Banner Simplification:** Because the CTAs are now on the cards, reduce the top floating box to a simple text banner or remove the redundant buttons inside it to avoid clutter.

## 3. The Blueprint: Upgraded Package Card

**Desktop Layout:** 2x2 Grid. Cards are horizontal (Image Left, Content Right).
**Mobile Layout:** 1-column vertical stack (Image Top, Content Bottom).

```text
+-------------------------+-----------------------------------------+
|                         |                                         |
|                         |  [Icon] Pachet loialitate               |
|                         |  -------------------------------------  |
|       [Premium          |                                         |
|       Dark-Themed       |  Ce include:                            |
|       Image Here]       |  • 10 ședințe de masaj                  |
|                         |  • 1 ședință GRATUITĂ                   |
|       (Cover            |  • Transmisibil (familie / prieteni)    |
|       Styling)          |                                         |
|                         |  💰 Preț: [Suma] RON                    |
|                         |                                         |
|                         |  [ 📞 0771 761 649 ]  [ ✉️ Email ]      |
|                         |                                         |
+-------------------------+-----------------------------------------+