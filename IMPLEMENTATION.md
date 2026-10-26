# Pixel Palettes website update

The existing plain HTML/CSS/JavaScript structure is retained. Open `index.html`, or serve this folder with `python3 -m http.server 8000`. No build or external runtime dependency is required. The WebGPU background requires a supported browser and secure context; the existing still background remains the fallback.

## Implemented

- Rebuilt the home and exhibition pages using the current Figma layout and computer assets.
- Added complete press release and exhibition guide pages, with the current Figma wording, punctuation, and diacritics retained. Nancy Macko's opening typography is the reference for both curatorial essays. All ten artist statement names are bold.
- Used semantic landmarks, headings, links, buttons, accessible control names, keyboard focus styles, labeled scroll regions, and a skip link.
- Added green #2B493E accessibility mode with locally served OpenDyslexic, increased spacing, and disabled animation. Preferences persist between pages. Reduced-motion preferences are respected.
- Preserved the existing shader background and bounded confetti behavior.
- Implemented custom Macintosh scrollbars on native overflow containers. Thumb size and position follow the real viewport/content ratio, with a 32px minimum. Dragging, track paging, arrows, wheel, touch, and keyboard scrolling work. Resize/content/font changes recalculate geometry. Controls disappear when there is no overflow. Native scrolling remains available without JavaScript.

## Figma sources inspected

Main file: https://www.figma.com/design/42G3v19CmxxOtawTavRFVH/Pixel-Palette-Web-Design?node-id=4-2

Frames: home 4:3, exhibition 153:981, press release 167:2442, exhibition guide 170:3049. Current text was extracted directly from these frames.

UI kit: https://www.figma.com/design/MmMuxyafJX48UTlP8PngDj/Classic-Macintosh-UI-Kit--Community-

Inspected actual component properties and variants: Button 73:3378 (Style, State, 1-bit), Dialog 177:8142 (Type, Color), Titlebar 152:4823, Scrollbar 68:2020 (Direction, State, Color). Matched the Modeless/8-bit dialog and Vertical/Enabled/8-bit scrollbar. Reused exported controls and artwork; typography and palette are based on the measured nodes. UI kit design-context export failed, so its actual components were inspected with the Figma Plugin API and their instances in the main file were exported successfully.

## Verification performed

Chrome/Playwright, October 26, 2026:

- Browser screenshots visually reviewed against inspected Figma frames for all four desktop pages, plus mobile and accessibility views.
- axe checks for WCAG 2 A/AA, 2.1 AA and 2.2 AA: no detected violations on all four pages at 1440, 768 and 320px, in both display modes (24 combinations).
- No page-level horizontal overflow in those combinations, including a 200% root text-size and increased text-spacing stress test. Mobile issues found during testing were corrected.
- Press and guide: thumb dragging to both ends, track clicks, arrows, wheel input, Home/End/PageDown, dynamic content changes, and no-overflow states checked with assertions.
- Information panel: wheel, arrow, keyboard and thumb drag tested in accessibility mode.
- Touch scrolling tested with Chrome touch emulation. Wheel tests include pixel-based deltas; this is not a physical trackpad test.
- Keyboard navigation between pages, close controls, visible focus, preference persistence, and JavaScript-disabled native overflow fallback checked.
- Nancy Macko and Vályi-Nagy sections visually inspected. Full guide and press text compared against Figma text after normalizing whitespace; all source text retained. All ten artist names checked for bold markup.
- No JavaScript page errors in the responsive/accessibility matrix.

## Intentional differences and limitations

Responsive reflow, visible focus rings, at least 44px primary actions, 32px minimum scrollbar thumbs, and dynamically sized thumbs replace fixed decorative geometry where needed for usability. The inconsistent 40px guide body text was normalized to the 24px Nancy opening reference. Narrow screens use smaller readable type; accessibility mode uses OpenDyslexic rather than the pixel fonts. Decorative computers are hidden on small screens and in accessibility mode. Background animation timing and browser font rasterization can differ from Figma.

These checks are not a complete WCAG conformance audit. Physical touch/trackpad hardware, screen readers, Safari/Firefox and the WebGPU animation were not exhaustively tested. The exhibition remains the current Figma's “artwork COMING SOON” page; no artwork content was invented.
