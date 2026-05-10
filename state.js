/**
 * state.js — ASCII CAM
 * Centralised mutable state. All modules read/write this object.
 */

'use strict';

const state = {
  // ── Source ──────────────────────────────────────────────
  sourceMode:  'camera',   // 'camera' | 'image'
  imgBitmap:   null,

  // ── Render parameters ───────────────────────────────────
  charSet:     CHAR_SETS[DEFAULTS.charSet],
  colorMode:   DEFAULTS.colorMode,
  numCols:     DEFAULTS.numCols,
  fontSize:    DEFAULTS.fontSize,
  fontW:       Math.round(DEFAULTS.fontSize * 0.6),
  fpsInterval: DEFAULTS.fpsInterval,
  bgLevel:     DEFAULTS.bgLevel,
  brightness:  DEFAULTS.brightness,
  contrast:    DEFAULTS.contrast,

  // ── Flags ───────────────────────────────────────────────
  mirror:  DEFAULTS.mirror,
  invert:  DEFAULTS.invert,
  paused:  false,
  running: false,

  // ── FPS tracking ────────────────────────────────────────
  lastTime: 0,

  // ── HUE animation ───────────────────────────────────────
  hueAngle: 0,

  // ── Custom color ────────────────────────────────────────
  customDark:   [0, 0, 0],
  customBright: [255, 0, 255],

  // ── Effects ─────────────────────────────────────────────
  fx: {
    glitch: false,
    rain:   false,
    hue:    false,
    edge:   false,
    ca:     false,
    scan:   false,
  },

  // ── Rain internals ──────────────────────────────────────
  rainCols:        [],
  rainInitialized: false,
};
