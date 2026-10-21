# Pixel Palettes

A static HTML/CSS/vanilla JavaScript exhibition homepage for Scripps College. No framework, package installation or build process is required.

## Preview and upload
Open this folder in VS Code and use Live Server, or open index.html directly.

If Python 3 is installed, run this command from this folder:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Visit http://localhost:8000/ and press Control+C in the terminal to stop the server.

For upload, select the destination directory on your static host (for example `public_html/pixel-palettes/`) and upload the site files and the complete `assets/` folder. Do not upload only the HTML files. The server should serve `index.html` by default; no routing rules, backend, installation, or build command are needed. Test the uploaded homepage, Enter, and Back to home links afterward.

 For the most reliable animated preview, use localhost or an HTTPS website in a browser with WebGPU enabled. Unzip pixel-palettes.zip and upload the contents of its pixel-palettes folder together: index.html, exhibition.html, style.css, script.js, and assets. Keep all relative paths intact.

## Background animation
The homepage now runs the actual authored Figma Moving gradient shader, with the exported colors, material, geometry and speed parameters. assets/moving-gradient.js preserves its setup/render implementation; only TypeScript/module syntax was adapted for classic JavaScript. script.js supplies the canvas, device, frame clock and controls instead of the React-based Figma runtime, keeping this site build-free.

Pause all motion stops the shader and any CSS animations. The system reduced-motion setting starts it paused; visitors can explicitly play it. Rendering also pauses in hidden tabs. Browsers without WebGPU, GPU access, or an appropriate secure context retain assets/background.png. A failed/lost device also returns to the image. The image is a fallback, not the normal animated background. The exhibition placeholder still uses the image.

## Design and accessibility
The introduction follows the reference without a rectangular text panel. Its white text uses IBM Plex Mono Medium directly on the artwork, with no outline or text shadow. This is not a full WCAG conformance claim: review text contrast in the default artwork mode across animation states, especially on actual target displays. The high-contrast mode provides a consistent alternative. Semantic HTML, native links, the skip link, visible keyboard focus, responsive reflow, local fonts and a minimum 44px Enter target are retained. Rounded display controls sit in document flow so they cannot obscure enlarged text. Accessibility mode removes the artwork, uses white text on a solid #102b43 background (about 14.5:1 contrast), and stops all motion. Its native toggle reports its state with aria-pressed. Switching the mode off leaves motion paused until Resume motion is selected. Preferences persist in localStorage across both pages; if browser storage is blocked, controls still work for the current page.

Alvera DEMO Bold Square and FindersKeepers are bundled with permission confirmed by the project owner on October 21, 2026. Keep the applicable permissions with institutional records. IBM Plex Mono matches the design; the menu uses the licensed VT323 substitute because the exact ChiKareGo2 file is not available. Other bundled open-font licenses are in assets/licenses.

## Validation and remaining work
Chrome checks verify that the WebGPU renderer starts, successive frames change, Pause stops the frame clock and reduced-motion starts at time zero. Desktop, tablet and mobile layout, 200% text size, keyboard links and asset loading are checked. Before publication, verify Safari/Firefox and the actual hosting environment, screen-reader behavior, text spacing and contrast throughout motion. exhibition.html intentionally remains Coming Soon; exhibition content still needs to be supplied.

Design and artwork originate from the supplied Pixel Palette Web Design Figma project.

## Project files and future rooms

- `index.html`: homepage and native Enter link.
- `exhibition.html`: temporary Coming Soon page; replace its main content when the rooms are ready.
- `style.css`: shared responsive layout, local fonts, focus and reduced-motion rules.
- `script.js`: optional WebGPU canvas lifecycle and play/pause controls.
- `assets/`: local Figma artwork, authored shader, fonts, and license/permission records.

To add a room, create another HTML file with the same document language, viewport, stylesheet, skip link, and main landmark, then add a descriptive native link from `exhibition.html`. No JavaScript is required for navigation.

## Final QA (October 21, 2026)

Headless Chrome checks at 1440, 768, 390 and 320 CSS pixels passed without horizontal page overflow or failed asset requests. Both pages passed 200% root text-size reflow checks at 1440, 390 and 320 pixels. Keyboard testing followed Skip to main content → main → Enter → exhibition, then Back to home. Each page has one h1; decorative images have empty alt text, and the decorative menu is hidden from assistive technology. The desktop card is 968px wide at x=236 and y=129, matching the Figma reference placement. The rendered screenshots were visually reviewed against the Figma homepage.

Remaining manual checks: VoiceOver or NVDA reading and navigation; browser-native text-only zoom and custom text spacing; Safari/Firefox on real devices; animation contrast over a longer viewing period; and the institution's actual HTTPS deployment. These checks are needed before asserting full WCAG 2.2 AA conformance. Retain the original-font permission evidence noted in `assets/licenses/FONT-PERMISSIONS.txt` with the project records.

To package manually, compress this folder while excluding `.DS_Store` and any previous ZIP. The supplied `pixel-palettes.zip` already contains the deployable files under one `pixel-palettes/` folder.
