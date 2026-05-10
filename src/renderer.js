/**
 * renderer.js — ASCII CAM
 * Owns the sample canvas + output canvas; exposes drawFrame().
 */

'use strict';

// ── Canvas references ────────────────────────────────────
const canvas   = document.getElementById('ascii-canvas');
const ctx      = canvas.getContext('2d');
const sample   = document.createElement('canvas');
const sCtx     = sample.getContext('2d', { willReadFrequently: true });

// ── Sobel helper ─────────────────────────────────────────
function sobelAt(lum, x, y, w, h) {
  const get = (cx, cy) =>
    lum[Math.min(h - 1, Math.max(0, cy)) * w + Math.min(w - 1, Math.max(0, cx))];

  const gx =
    -get(x-1,y-1) + get(x+1,y-1) +
    -2*get(x-1,y) + 2*get(x+1,y) +
    -get(x-1,y+1) + get(x+1,y+1);

  const gy =
    -get(x-1,y-1) - 2*get(x,y-1) - get(x+1,y-1) +
     get(x-1,y+1) + 2*get(x,y+1) + get(x+1,y+1);

  return Math.sqrt(gx * gx + gy * gy);
}

// ── Color functions ───────────────────────────────────────
function getColorFn() {
  switch (state.colorMode) {
    case 'real':
      return (r, g, b) => `rgb(${r},${g},${b})`;
    case 'green':
      return (_, __, ___, l) => `rgb(0,${l * .9 | 0},${l * .3 | 0})`;
    case 'amber':
      return (_, __, ___, l) => `rgb(${l * .95 | 0},${l * .6 | 0},0)`;
    case 'cyan':
      return (_, __, ___, l) => `rgb(0,${l * .85 | 0},${l | 0})`;
    case 'red':
      return (_, __, ___, l) => `rgb(${l | 0},${l * .15 | 0},${l * .15 | 0})`;
    case 'purple':
      return (_, __, ___, l) => `rgb(${l * .7 | 0},0,${l | 0})`;
    case 'white':
      return (_, __, ___, l) => `rgb(${l | 0},${l | 0},${l | 0})`;
    case 'rainbow':
      return (r, g, b, l) => {
        const h = (state.hueAngle + (l / 255) * 120) % 360;
        return `hsl(${h},100%,55%)`;
      };
    case 'custom':
      return customColorFn;
    default:
      return (r, g, b) => `rgb(${r},${g},${b})`;
  }
}

function customColorFn(r, g, b, lum) {
  const t  = lum / 255;
  const [dr, dg, db] = state.customDark;
  const [br, bg2, bb] = state.customBright;
  return `rgb(${(dr + (br - dr) * t) | 0},${(dg + (bg2 - dg) * t) | 0},${(db + (bb - db) * t) | 0})`;
}

// ── Main draw ────────────────────────────────────────────
function drawFrame() {
  const src  = state.sourceMode === 'image' ? state.imgBitmap : document.getElementById('video');
  const srcW = state.sourceMode === 'image' ? state.imgBitmap.width  : (src.videoWidth  || 640);
  const srcH = state.sourceMode === 'image' ? state.imgBitmap.height : (src.videoHeight || 480);

  const aspect = srcH / srcW || 0.75;
  const rows   = Math.max(1, Math.round(state.numCols * aspect * (state.fontW / state.fontSize)));

  sample.width  = state.numCols;
  sample.height = rows;

  // Build CSS filter string
  let filter = '';
  if (state.brightness !== 0) filter += `brightness(${1 + state.brightness / 100}) `;
  if (state.contrast   !== 0) filter += `contrast(${1 + state.contrast / 100}) `;
  if (state.fx.hue)            filter += `hue-rotate(${state.hueAngle}deg) `;
  sCtx.filter = filter || 'none';

  if (state.mirror && state.sourceMode === 'camera') {
    sCtx.save();
    sCtx.translate(state.numCols, 0);
    sCtx.scale(-1, 1);
  }
  sCtx.drawImage(src, 0, 0, state.numCols, rows);
  if (state.mirror && state.sourceMode === 'camera') sCtx.restore();
  sCtx.filter = 'none';

  let pixels;
  try {
    pixels = sCtx.getImageData(0, 0, state.numCols, rows).data;
  } catch (e) {
    document.getElementById('status').textContent = '// use localhost — file:// blocked';
    return;
  }

  // Pre-compute luminance map for edge detection
  let lumMap = null;
  if (state.fx.edge) {
    lumMap = new Float32Array(state.numCols * rows);
    for (let i = 0; i < state.numCols * rows; i++) {
      const p = i * 4;
      lumMap[i] = 0.299 * pixels[p] + 0.587 * pixels[p + 1] + 0.114 * pixels[p + 2];
    }
  }

  // Resize output canvas
  canvas.width  = state.numCols * state.fontW;
  canvas.height = rows          * state.fontSize;

  const bg = state.bgLevel;
  ctx.fillStyle = `rgb(${bg},${bg},${bg})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.font         = `${state.fontSize}px "Share Tech Mono",monospace`;
  ctx.textBaseline = 'top';

  const maxIdx  = state.charSet.length - 1;
  const colorFn = getColorFn();

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < state.numCols; x++) {
      const i = (y * state.numCols + x) * 4;
      let r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];

      // Chromatic aberration — offset R and B channels horizontally
      if (state.fx.ca) {
        const ox = Math.min(state.numCols - 1, x + 1);
        const bx = Math.max(0, x - 1);
        r = pixels[(y * state.numCols + ox) * 4];
        b = pixels[(y * state.numCols + bx) * 4 + 2];
      }

      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      const val = state.invert ? 255 - lum : lum;

      // Edge detection — Sobel
      if (state.fx.edge && lumMap) {
        const sobel = sobelAt(lumMap, x, y, state.numCols, rows);
        if (sobel > EDGE_THRESHOLD) {
          ctx.fillStyle = colorFn(r, g, b, val);
          ctx.fillText('@', x * state.fontW, y * state.fontSize);
        }
        continue;
      }

      // Glitch — random character injection
      if (state.fx.glitch && Math.random() < GLITCH_PROBABILITY) {
        const matrixChars = CHAR_SETS.matrix;
        const ch = matrixChars[Math.floor(Math.random() * matrixChars.length)];
        ctx.fillStyle = '#00ff41';
        ctx.fillText(ch, x * state.fontW, y * state.fontSize);
        continue;
      }

      const idx = Math.max(0, Math.min(maxIdx, Math.floor(val / 255 * maxIdx)));
      const ch  = state.charSet[idx];
      if (!ch || !ch.trim()) continue;

      ctx.fillStyle = colorFn(r, g, b, val);
      ctx.fillText(ch, x * state.fontW, y * state.fontSize);
    }
  }

  // Post-process overlays
  if (state.fx.rain) effects.drawRain(state.numCols, rows);
  if (state.fx.scan) effects.drawScanlines();
}

// ── Text export ──────────────────────────────────────────
function generateTextFrame() {
  const src  = state.sourceMode === 'image' ? state.imgBitmap : document.getElementById('video');
  const srcW = state.sourceMode === 'image' ? (state.imgBitmap?.width  || 640) : (src.videoWidth  || 640);
  const srcH = state.sourceMode === 'image' ? (state.imgBitmap?.height || 480) : (src.videoHeight || 480);
  const rows = Math.max(1, Math.round(state.numCols * (srcH / srcW) * (state.fontW / state.fontSize)));

  sample.width  = state.numCols;
  sample.height = rows;
  sCtx.drawImage(src, 0, 0, state.numCols, rows);

  let pixels;
  try {
    pixels = sCtx.getImageData(0, 0, state.numCols, rows).data;
  } catch (e) {
    return null;
  }

  const maxIdx = state.charSet.length - 1;
  let text = '';

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < state.numCols; x++) {
      const i   = (y * state.numCols + x) * 4;
      const lum = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
      const val = state.invert ? 255 - lum : lum;
      const idx = Math.max(0, Math.min(maxIdx, Math.floor(val / 255 * maxIdx)));
      text += state.charSet[idx] || ' ';
    }
    text += '\n';
  }

  return text;
}
