/**
 * ASCII CAM - Configuration & Presets
 */

const CONFIG = {
  // Preset character ramps ordered from lightest (empty) to darkest (solid)
  CHARSETS: {
    detailed: " .'`^\",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$",
    simple: " .:-=+*#%@",
    blocks: "  ░▒▓█",
    binary: " 01",
    matrix: " .·:=+*0123456789ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ",
    braille: " ⠁⠂⠃⠄⠅⠆⠇⠈⠉⠊⠋⠌⠍⠎⠏⠐⠑⠒⠓⠔⠕⠖⠗⠘⠙⠚⠛⠜⠝⠞⠟⠠⠡⠢⠣⠤⠥⠦⠧⠨⠩⠪⠫⠬⠭⠮⠯⠰⠱⠲⠳⠴⠵⠶⠷⠸⠹⠺⠻⠼⠽⠾⠿⣿",
    minimal: " ·:*#",
    custom_chars: " .:-=+*#%@"
  },

  // Color preset mapping
  COLOR_PALETTES: {
    real: { type: 'real' },
    green: { type: 'gradient', dark: '#021807', bright: '#00ff66' },
    amber: { type: 'gradient', dark: '#1c0e00', bright: '#ffaa00' },
    cyan: { type: 'gradient', dark: '#001824', bright: '#00f0ff' },
    red: { type: 'gradient', dark: '#240008', bright: '#ff2d55' },
    purple: { type: 'gradient', dark: '#180026', bright: '#c042ff' },
    white: { type: 'gradient', dark: '#181818', bright: '#f5f5f7' },
    rainbow: { type: 'rainbow' },
    custom: { type: 'custom' }
  },

  // Directional edge characters for Edge effect
  EDGE_CHARS: {
    horizontal: "-",
    vertical: "|",
    diagForward: "/",
    diagBack: "\\",
    cross: "+",
    corner: "#"
  },

  // Default state initialization
  DEFAULTS: {
    source: 'camera', // 'camera' | 'image'
    charSet: 'detailed',
    customChars: ' .:-=+*#%@',
    fontSize: 13,
    colorMode: 'real',
    customColorDark: '#000000',
    customColorBright: '#ff00ff',
    brightness: 0,
    contrast: 0,
    bgLightness: 10,
    cols: 90,
    fpsCap: 20,
    mirror: true,
    invert: false,
    fx: {
      glitch: false,
      rain: false,
      hue: false,
      edge: false,
      ca: false,
      scan: false
    }
  }
};

window.CONFIG = CONFIG;
