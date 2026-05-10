/**
 * effects.js — ASCII CAM
 * Post-process visual effects that draw on top of the ASCII canvas.
 * Depends on: state, canvas/ctx from renderer.js
 */

'use strict';

const effects = {

  /**
   * Matrix-style falling character columns.
   * @param {number} cols  - current column count
   * @param {number} rows  - current row count
   */
  drawRain(cols, rows) {
    if (!state.rainInitialized || state.rainCols.length !== cols) {
      state.rainCols = Array.from({ length: cols }, () => ({
        y:     (Math.random() * rows) | 0,
        speed: 0.3 + Math.random() * 0.7,
      }));
      state.rainInitialized = true;
    }

    const matrixChars = CHAR_SETS.matrix;
    ctx.font         = `${state.fontSize}px "Share Tech Mono",monospace`;
    ctx.textBaseline = 'top';

    for (let x = 0; x < cols; x++) {
      const drop = state.rainCols[x];
      const ch   = matrixChars[Math.floor(Math.random() * matrixChars.length)] || '0';
      const yPx  = (drop.y | 0) * state.fontSize;

      // Bright head
      ctx.fillStyle  = '#00ff41';
      ctx.globalAlpha = 0.85;
      ctx.fillText(ch, x * state.fontW, yPx);

      // Dim tail one row above
      if ((drop.y | 0) - 1 >= 0) {
        ctx.globalAlpha = 0.3;
        ctx.fillStyle   = '#004d14';
        ctx.fillText(ch, x * state.fontW, yPx - state.fontSize);
      }

      ctx.globalAlpha = 1;

      drop.y += drop.speed;
      if (drop.y >= rows) drop.y = 0;
    }
  },

  /**
   * CRT-style horizontal scanline overlay.
   */
  drawScanlines() {
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    for (let y = 0; y < canvas.height; y += state.fontSize * 2) {
      ctx.fillRect(0, y, canvas.width, Math.ceil(state.fontSize * 0.6));
    }
  },
};
