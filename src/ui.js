/**
 * ui.js — ASCII CAM
 * Wires all DOM controls to state mutations.
 * Depends on: state, config, renderer (for generateTextFrame)
 */

'use strict';

// ── Helpers ──────────────────────────────────────────────
function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function setActiveInGroup(group, active) {
  group.forEach(b => b.classList.remove('active'));
  active.classList.add('active');
}

function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2000);
}

// ── Source ───────────────────────────────────────────────
function setSource(value, btn) {
  const pills = document.querySelectorAll('#sidebar .s-section:first-of-type .pill');
  setActiveInGroup(pills, btn);

  if (value === 'image') {
    document.getElementById('img-upload').click();
  } else {
    state.sourceMode = 'camera';
    if (!state.running) app.startCamera();
  }
}

// ── Char set ─────────────────────────────────────────────
function setCharSet(value, btn) {
  const pills = document.querySelectorAll('#charset-section .pill');
  setActiveInGroup(pills, btn);

  state.charSet = CHAR_SETS[value] || CHAR_SETS.detailed;
  const customInput = document.getElementById('custom-chars-input');
  customInput.style.display = value === 'custom_chars' ? 'block' : 'none';
}

function updateCustomChars(value) {
  if (value.trim().length >= 2) {
    CHAR_SETS.custom_chars = value;
    state.charSet = value;
  }
}

// ── Color mode ───────────────────────────────────────────
function setColorMode(value, btn) {
  state.colorMode = value;
  const btns = document.querySelectorAll('.cm-btn');
  setActiveInGroup(btns, btn);
  document.getElementById('custom-wrap').classList.toggle('show', value === 'custom');
}

function updateCustomColor() {
  const darkHex   = document.getElementById('cc-dark').value;
  const brightHex = document.getElementById('cc-bright').value;
  state.customDark   = hexToRgb(darkHex);
  state.customBright = hexToRgb(brightHex);
  document.getElementById('cc-dh').textContent = darkHex;
  document.getElementById('cc-bh').textContent = brightHex;
  document.getElementById('custom-swatch').style.background =
    `linear-gradient(90deg,${darkHex},${brightHex})`;
}

// ── Sliders ──────────────────────────────────────────────
function updateFontSize(value) {
  state.fontSize = +value;
  state.fontW    = Math.round(state.fontSize * 0.6);
  document.getElementById('font-val').textContent = value;
}

function updateCols(value) {
  state.numCols        = +value;
  state.rainInitialized = false;
  document.getElementById('cols-val').textContent = value;
}

function updateBg(value) {
  state.bgLevel = +value;
}

function updateBrightness(value) {
  state.brightness = +value;
  document.getElementById('br-val').textContent = value;
}

function updateContrast(value) {
  state.contrast = +value;
  document.getElementById('co-val').textContent = value;
}

// ── FPS ──────────────────────────────────────────────────
function setFps(value, btn) {
  state.fpsInterval = 1000 / +value;
  const pills = document.querySelectorAll('#fps-section .pill');
  setActiveInGroup(pills, btn);
}

// ── Toggles ──────────────────────────────────────────────
function toggleOpt(name, el) {
  if (name === 'mirror') state.mirror = !state.mirror;
  if (name === 'invert') state.invert = !state.invert;
  el.classList.toggle('on');
}

// ── FX ───────────────────────────────────────────────────
function toggleFx(name, btn) {
  state.fx[name] = !state.fx[name];
  btn.classList.toggle('active', state.fx[name]);
  if (name === 'rain' && !state.fx.rain) state.rainInitialized = false;
}

// ── Pause ────────────────────────────────────────────────
function togglePause() {
  state.paused = !state.paused;
  const btn = document.getElementById('pause-btn');
  btn.textContent = state.paused ? '▶ RESUME' : '⏸ PAUSE';
  btn.classList.toggle('active', state.paused);
  document.getElementById('status').textContent = state.paused ? '// paused' : '// streaming';
}

// ── Save / Copy ──────────────────────────────────────────
function saveFrame() {
  const link    = document.createElement('a');
  link.download = 'ascii_frame.png';
  link.href     = canvas.toDataURL('image/png');
  link.click();
  showToast('Frame saved!');
}

function copyText() {
  const text = generateTextFrame();
  if (!text) { showToast('Cannot read pixels'); return; }
  navigator.clipboard.writeText(text)
    .then(()  => showToast('Copied to clipboard!'))
    .catch(()  => showToast('Copy failed'));
}

// ── Fullscreen ───────────────────────────────────────────
function toggleFullscreen() {
  document.getElementById('app').classList.toggle('fullscreen');
}

// ── Keyboard shortcuts ───────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT') return;

  switch (e.key) {
    case ' ':
      e.preventDefault();
      if (document.getElementById('pause-btn').style.display !== 'none') togglePause();
      break;
    case 's':
    case 'S':
      if (document.getElementById('save-btn').style.display !== 'none') saveFrame();
      break;
    case 'f':
    case 'F':
      toggleFullscreen();
      break;
    case 'ArrowRight':
      state.numCols = Math.min(200, state.numCols + 5);
      document.getElementById('cols-val').textContent = state.numCols;
      break;
    case 'ArrowLeft':
      state.numCols = Math.max(30, state.numCols - 5);
      document.getElementById('cols-val').textContent = state.numCols;
      break;
  }
});

// ── Visibility API — pause when tab hidden ───────────────
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    state.paused = true;
  } else if (state.sourceMode === 'camera') {
    state.paused = false;
  }
});

// ── Wire up DOM events on DOMContentLoaded ───────────────
document.addEventListener('DOMContentLoaded', () => {

  // Data-action buttons (setSource, setCharSet, setColorMode, setFps)
  document.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      const value  = btn.dataset.value;
      switch (action) {
        case 'setSource':    setSource(value, btn);    break;
        case 'setCharSet':   setCharSet(value, btn);   break;
        case 'setColorMode': setColorMode(value, btn); break;
        case 'setFps':       setFps(value, btn);       break;
      }
    });
  });

  // FX toggles
  document.querySelectorAll('[data-fx]').forEach(btn => {
    btn.addEventListener('click', () => toggleFx(btn.dataset.fx, btn));
  });

  // Toggle switches
  document.querySelectorAll('[data-toggle]').forEach(el => {
    el.addEventListener('click', () => toggleOpt(el.dataset.toggle, el));
  });

  // Sliders
  document.getElementById('font-slider').addEventListener('input', e => updateFontSize(e.target.value));
  document.getElementById('cols-slider').addEventListener('input', e => updateCols(e.target.value));
  document.getElementById('bg-slider').addEventListener('input', e => updateBg(e.target.value));
  document.getElementById('brightness-slider').addEventListener('input', e => updateBrightness(e.target.value));
  document.getElementById('contrast-slider').addEventListener('input', e => updateContrast(e.target.value));

  // Custom chars
  document.getElementById('custom-chars-input').addEventListener('input', e => updateCustomChars(e.target.value));

  // Custom color pickers
  document.getElementById('cc-dark').addEventListener('input', updateCustomColor);
  document.getElementById('cc-bright').addEventListener('input', updateCustomColor);

  // Action buttons
  document.getElementById('pause-btn').addEventListener('click', togglePause);
  document.getElementById('save-btn').addEventListener('click', saveFrame);
  document.getElementById('copy-btn').addEventListener('click', copyText);
  document.getElementById('fullscreen-btn').addEventListener('click', toggleFullscreen);
  document.getElementById('init-camera-btn').addEventListener('click', () => app.startCamera());

  // File upload
  document.getElementById('img-upload').addEventListener('change', function () {
    app.loadImage(this);
  });
});
