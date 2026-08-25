/**
 * ASCII CAM - Canvas Renderer & Character Synthesizer
 */

class AsciiRenderer {
  constructor(canvas, state, effects) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.state = state;
    this.effects = effects;

    // Offscreen canvas for downsampled image processing
    this.sampleCanvas = document.createElement('canvas');
    this.sampleCtx = this.sampleCanvas.getContext('2d', { willReadFrequently: true });

    // Font metrics cache
    this.charWidth = 8;
    this.charHeight = 14;
    this.cachedFontSize = 0;
    this.measureFont(this.state.get('fontSize'));

    // Dynamic animation time counter
    this.animTime = 0;
  }

  measureFont(fontSize) {
    if (this.cachedFontSize === fontSize) return;
    this.cachedFontSize = fontSize;

    this.ctx.font = `${fontSize}px 'Share Tech Mono', monospace`;
    const metrics = this.ctx.measureText('M');
    this.charWidth = metrics.width || (fontSize * 0.6);
    this.charHeight = Math.round(fontSize * 1.15);
  }

  hexToRgb(hex) {
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    const num = parseInt(c, 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  }

  lerpColor(rgb1, rgb2, t) {
    return [
      Math.round(rgb1[0] + (rgb2[0] - rgb1[0]) * t),
      Math.round(rgb1[1] + (rgb2[1] - rgb1[1]) * t),
      Math.round(rgb1[2] + (rgb2[2] - rgb1[2]) * t)
    ];
  }

  render(sourceMedia) {
    if (!sourceMedia) return;

    const cols = this.state.get('cols');
    const fontSize = this.state.get('fontSize');
    this.measureFont(fontSize);

    // Get source natural dimensions
    let srcW = sourceMedia.videoWidth || sourceMedia.naturalWidth || sourceMedia.width || 640;
    let srcH = sourceMedia.videoHeight || sourceMedia.naturalHeight || sourceMedia.height || 480;

    if (srcW === 0 || srcH === 0) return;

    // Calculate aspect ratio and grid rows
    const srcAspect = srcW / srcH;
    const charAspect = this.charWidth / this.charHeight;
    const rows = Math.max(10, Math.round(cols / (srcAspect / charAspect)));

    this.state.set('rows', rows);

    // Update sampling canvas dimensions
    if (this.sampleCanvas.width !== cols || this.sampleCanvas.height !== rows) {
      this.sampleCanvas.width = cols;
      this.sampleCanvas.height = rows;
    }

    // Prepare transformation for mirroring
    this.sampleCtx.save();
    this.sampleCtx.imageSmoothingEnabled = true;

    const mirror = this.state.get('mirror');
    if (mirror && this.state.get('source') === 'camera') {
      this.sampleCtx.translate(cols, 0);
      this.sampleCtx.scale(-1, 1);
    }

    this.sampleCtx.drawImage(sourceMedia, 0, 0, cols, rows);
    this.sampleCtx.restore();

    // Extract pixel buffer
    let imgData;
    try {
      imgData = this.sampleCtx.getImageData(0, 0, cols, rows);
    } catch (e) {
      return;
    }

    const data = imgData.data;
    const totalPixels = cols * rows;

    // Pre-calculate contrast factor
    const contrast = this.state.get('contrast'); // -100 to 100
    const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
    const brightness = this.state.get('brightness') * 2.55; // -255 to 255
    const invert = this.state.get('invert');
    const fx = this.state.get('fx');

    this.animTime += 0.05;
    if (fx.hue) {
      this.effects.hueAngle = (this.effects.hueAngle + 2) % 360;
    }

    // Pixel buffers
    const lumGrid = new Uint8Array(totalPixels);
    const rGrid = new Uint8Array(totalPixels);
    const gGrid = new Uint8Array(totalPixels);
    const bGrid = new Uint8Array(totalPixels);

    for (let i = 0; i < totalPixels; i++) {
      let r = data[i * 4];
      let g = data[i * 4 + 1];
      let b = data[i * 4 + 2];

      // Brightness & Contrast
      r = contrastFactor * (r - 128) + 128 + brightness;
      g = contrastFactor * (g - 128) + 128 + brightness;
      b = contrastFactor * (b - 128) + 128 + brightness;

      r = Math.max(0, Math.min(255, r));
      g = Math.max(0, Math.min(255, g));
      b = Math.max(0, Math.min(255, b));

      // Hue Rotation FX
      if (fx.hue) {
        [r, g, b] = this.effects.rotateHue(r, g, b, this.effects.hueAngle);
      }

      // Standard Luminance
      let lum = 0.299 * r + 0.587 * g + 0.114 * b;
      if (invert) lum = 255 - lum;

      lumGrid[i] = Math.max(0, Math.min(255, Math.round(lum)));
      rGrid[i] = r;
      gGrid[i] = g;
      bGrid[i] = b;
    }

    // Sobel Edge Detection FX
    let edgeResult = null;
    if (fx.edge) {
      edgeResult = this.effects.applySobelEdge(lumGrid, cols, rows, 40);
    }

    // Rain FX update
    if (fx.rain) {
      this.effects.updateRain(cols, rows);
    }

    // Character ramp selection
    const ramp = this.state.getCurrentRamp();
    const rampLen = ramp.length;

    // Build Character & Color Matrix
    const outChars = new Array(totalPixels);
    const outColors = new Array(totalPixels);
    let plainText = '';

    const colorMode = this.state.get('colorMode');
    let darkRgb = [0, 0, 0];
    let brightRgb = [255, 255, 255];

    if (colorMode === 'custom') {
      darkRgb = this.hexToRgb(this.state.get('customColorDark'));
      brightRgb = this.hexToRgb(this.state.get('customColorBright'));
    } else if (CONFIG.COLOR_PALETTES[colorMode]?.type === 'gradient') {
      const p = CONFIG.COLOR_PALETTES[colorMode];
      darkRgb = this.hexToRgb(p.dark);
      brightRgb = this.hexToRgb(p.bright);
    }

    // Glitch row shifts
    let glitchActive = fx.glitch && Math.random() < 0.35;
    let glitchRow = glitchActive ? Math.floor(Math.random() * rows) : -1;
    let glitchShift = glitchActive ? Math.floor((Math.random() - 0.5) * 12) : 0;

    for (let y = 0; y < rows; y++) {
      let rowShift = (y === glitchRow) ? glitchShift : 0;

      for (let x = 0; x < cols; x++) {
        const sampleX = Math.max(0, Math.min(cols - 1, x + rowShift));
        const idx = y * cols + sampleX;
        const outIdx = y * cols + x;

        let lum = lumGrid[idx];
        let charCode = '';

        // Edge detection char override
        if (fx.edge && edgeResult && edgeResult.edgeGrid[idx] > 0) {
          const dir = edgeResult.dirGrid[idx];
          if (dir === 1) charCode = CONFIG.EDGE_CHARS.horizontal;
          else if (dir === 2) charCode = CONFIG.EDGE_CHARS.vertical;
          else if (dir === 3) charCode = CONFIG.EDGE_CHARS.diagForward;
          else if (dir === 4) charCode = CONFIG.EDGE_CHARS.diagBack;
          else charCode = CONFIG.EDGE_CHARS.cross;
        } else {
          // Standard Luminance mapping
          const rampIdx = Math.floor((lum / 256) * rampLen);
          charCode = ramp[Math.min(rampLen - 1, rampIdx)];
        }

        // Glitch noise chars
        if (fx.glitch && Math.random() < 0.02) {
          const gChars = '!@#$%^&*░▒▓█~><+=';
          charCode = gChars[Math.floor(Math.random() * gChars.length)];
        }

        // Rain FX overlay
        let isRainHead = false;
        let isRainTail = false;
        if (fx.rain && this.effects.rainColumns[x]) {
          const drop = this.effects.rainColumns[x];
          const dist = y - drop.y;
          if (dist >= 0 && dist < drop.length) {
            const matrixChars = CONFIG.CHARSETS.matrix;
            charCode = matrixChars[Math.floor(Math.random() * matrixChars.length)];
            if (dist < 1) isRainHead = true;
            else isRainTail = true;
          }
        }

        // Color calculation
        let colorStr = '#ffffff';

        if (isRainHead) {
          colorStr = '#ffffff';
        } else if (isRainTail) {
          colorStr = '#00ff66';
        } else if (colorMode === 'real') {
          let cr = rGrid[idx];
          let cg = gGrid[idx];
          let cb = bGrid[idx];

          // Chromatic Aberration FX
          if (fx.ca) {
            const rIdx = y * cols + Math.max(0, x - 2);
            const bIdx = y * cols + Math.min(cols - 1, x + 2);
            cr = rGrid[rIdx];
            cb = bGrid[bIdx];
          }

          if (invert) {
            cr = 255 - cr;
            cg = 255 - cg;
            cb = 255 - cb;
          }

          colorStr = `rgb(${cr},${cg},${cb})`;
        } else if (colorMode === 'rainbow') {
          const hue = ((x / cols) * 360 + this.animTime * 40 + lum) % 360;
          colorStr = `hsl(${hue}, 100%, ${Math.max(20, (lum / 255) * 80)}%)`;
        } else {
          // Gradient or Custom color lerp
          const t = lum / 255;
          const [cr, cg, cb] = this.lerpColor(darkRgb, brightRgb, t);
          colorStr = `rgb(${cr},${cg},${cb})`;
        }

        outChars[outIdx] = charCode;
        outColors[outIdx] = colorStr;
        plainText += charCode;
      }
      plainText += '\n';
    }

    this.state.set('lastAsciiText', plainText);

    // Render Characters to Canvas
    const canvasW = cols * this.charWidth;
    const canvasH = rows * this.charHeight;

    if (this.canvas.width !== canvasW || this.canvas.height !== canvasH) {
      this.canvas.width = canvasW;
      this.canvas.height = canvasH;
    }

    // Set Background
    const bgL = this.state.get('bgLightness');
    this.ctx.fillStyle = `rgb(${bgL}, ${bgL}, ${bgL})`;
    this.ctx.fillRect(0, 0, canvasW, canvasH);

    // Text rendering setup
    this.ctx.font = `${fontSize}px 'Share Tech Mono', monospace`;
    this.ctx.textBaseline = 'top';

    for (let y = 0; y < rows; y++) {
      const posY = y * this.charHeight;
      const isScanlineDim = fx.scan && (y % 2 === 1);

      for (let x = 0; x < cols; x++) {
        const idx = y * cols + x;
        const char = outChars[idx];
        if (char === ' ') continue;

        const posX = x * this.charWidth;
        this.ctx.fillStyle = outColors[idx];

        if (isScanlineDim) {
          this.ctx.globalAlpha = 0.6;
        } else {
          this.ctx.globalAlpha = 1.0;
        }

        this.ctx.fillText(char, posX, posY);
      }
    }
    this.ctx.globalAlpha = 1.0;
  }
}

window.AsciiRenderer = AsciiRenderer;
