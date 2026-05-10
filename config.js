/**
 * config.js — ASCII CAM
 * Static configuration: character sets, defaults, constants.
 */

'use strict';

const CHAR_SETS = {
  detailed:     ' .`-_\':,;r^=+/"|\\<>ivxclrs{}#@',
  simple:       ' .oO0@',
  blocks:       ' ░▒▓█',
  binary:       ' 01',
  matrix:       ' ｦｧｨｩｪｫｬｭｮｯｱｲｳｴｵ01',
  braille:      ' ⠁⠂⠃⠄⠅⠆⠇⠈⠉⠊⠋⠌⠍⠎⠏⠿',
  minimal:      ' ·∙•',
  custom_chars: ' .oO@',
};

const DEFAULTS = {
  numCols:    90,
  fontSize:   13,
  fpsInterval: 50,   // 1000 / 20fps
  bgLevel:    10,
  brightness: 0,
  contrast:   0,
  mirror:     true,
  invert:     false,
  charSet:    'detailed',
  colorMode:  'real',
};

const COLOR_MODES = [
  'real', 'green', 'amber', 'cyan',
  'red', 'purple', 'white', 'rainbow', 'custom',
];

const FX_NAMES = ['glitch', 'rain', 'hue', 'edge', 'ca', 'scan'];

// Sobel edge threshold (0–255 luminance delta)
const EDGE_THRESHOLD = 40;

// Glitch probability per-character per-frame
const GLITCH_PROBABILITY = 0.005;
