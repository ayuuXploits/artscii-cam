# ArtSCII CAM

A real-time ASCII art camera and image converter that runs entirely in the browser — no server, no dependencies, no build step.

![ASCII CAM screenshot](artscii.png)

## Features

- **Live camera feed** rendered as ASCII art in real time
- **Static image** upload → ASCII conversion
- **8 character sets** — Detailed, Simple, Blocks, Binary, Matrix, Braille, Dots, Custom
- **9 color modes** — Real, Green, Amber, Cyan, Red, Purple, White, Rainbow, Custom gradient
- **6 visual effects** — Glitch, Matrix Rain, Hue Rotation, Edge Detection (Sobel), Chromatic Aberration, Scanlines
- **Adjustable** font size, column count, brightness, contrast, background darkness
- **Mirror & Invert** toggles
- **FPS cap** (10 / 20 / 30)
- **Export** — save as PNG or copy plain-text ASCII to clipboard
- **Fullscreen mode** and keyboard shortcuts
- **Zero dependencies** — plain HTML + CSS + JS

## Quick Start

```bash
git clone https://github.com/ayuuXPploits/artscii-cam.git
cd artscii-cam
# Serve over HTTP (required for camera + canvas pixel access)
npx serve .
# or
python3 -m http.server 8080
```

Then open `http://localhost:8080` in your browser and click **INIT CAMERA**.

> **Note:** The app must be served over HTTP/HTTPS (not opened as a `file://` URL) for camera access and canvas `getImageData()` to work.

## Project Structure

```
ascii-cam/
├── index.html          # Shell — layout, markup, script tags
├── src/
│   ├── config.js       # Character sets, defaults, constants
│   ├── state.js        # Centralised mutable state object
│   ├── renderer.js     # Canvas drawing, Sobel edge, color functions
│   ├── effects.js      # Rain + scanline post-process overlays
│   ├── ui.js           # DOM event wiring, keyboard shortcuts
│   ├── app.js          # Camera init, image loading, rAF loop
│   └── styles.css      # All CSS (CSS custom properties, responsive)
└── docs/
    └── screenshot.png  # (add your own)
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Pause / Resume (camera mode) |
| `S` | Save frame as PNG |
| `F` | Toggle fullscreen |
| `←` / `→` | Decrease / Increase column count |

## Browser Support

Any modern browser with:
- `MediaDevices.getUserMedia` (camera)
- `createImageBitmap`
- `OffscreenCanvas` (polyfilled via regular `<canvas>`)
- `navigator.clipboard` (copy-text feature)

Tested in Chrome 120+, Firefox 121+, Safari 17+.

## Deployment

The app is a static site — deploy to any static host:

```bash
# GitHub Pages (from repo root)
# Enable Pages → Deploy from branch → main / (root)

# Netlify / Vercel
# Point build output to the repo root, no build command needed
```

## Development

No build toolchain required. Edit files and refresh. If you want live-reload:

```bash
npx browser-sync start --server --files "**/*.html,**/*.js,**/*.css"
```

## License

MIT — see [LICENSE](LICENSE).
