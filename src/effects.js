/**
 * ASCII CAM - Post-Processing & Grid Effects
 */

class EffectsManager {
  constructor() {
    this.rainColumns = [];
    this.lastTime = 0;
    this.hueAngle = 0;
  }

  initRain(cols, rows) {
    this.rainColumns = [];
    for (let c = 0; c < cols; c++) {
      this.rainColumns.push({
        y: Math.random() * -rows,
        speed: 0.3 + Math.random() * 0.7,
        length: Math.floor(5 + Math.random() * 15),
        chars: []
      });
    }
  }

  updateRain(cols, rows) {
    if (this.rainColumns.length !== cols) {
      this.initRain(cols, rows);
    }
    for (let c = 0; c < cols; c++) {
      const drop = this.rainColumns[c];
      drop.y += drop.speed;
      if (drop.y - drop.length > rows) {
        drop.y = -Math.random() * 10;
        drop.speed = 0.3 + Math.random() * 0.7;
        drop.length = Math.floor(5 + Math.random() * 15);
      }
    }
  }

  // Sobel Edge Detection Filter on Luminance buffer
  applySobelEdge(lumGrid, cols, rows, edgeThreshold = 35) {
    const edgeGrid = new Uint8Array(cols * rows);
    const dirGrid = new Uint8Array(cols * rows); // 0=none, 1=horiz, 2=vert, 3=diagF, 4=diagB

    for (let y = 1; y < rows - 1; y++) {
      for (let x = 1; x < cols - 1; x++) {
        const idx = y * cols + x;

        // 3x3 kernel samples
        const p00 = lumGrid[(y - 1) * cols + (x - 1)];
        const p01 = lumGrid[(y - 1) * cols + x];
        const p02 = lumGrid[(y - 1) * cols + (x + 1)];

        const p10 = lumGrid[y * cols + (x - 1)];
        const p12 = lumGrid[y * cols + (x + 1)];

        const p20 = lumGrid[(y + 1) * cols + (x - 1)];
        const p21 = lumGrid[(y + 1) * cols + x];
        const p22 = lumGrid[(y + 1) * cols + (x + 1)];

        // Sobel kernels
        const gx = (-p00 + p02) + 2 * (-p10 + p12) + (-p20 + p22);
        const gy = (-p00 - 2 * p01 - p02) + (p20 + 2 * p21 + p22);

        const magnitude = Math.sqrt(gx * gx + gy * gy);

        if (magnitude > edgeThreshold) {
          edgeGrid[idx] = Math.min(255, magnitude);
          const angle = Math.atan2(gy, gx) * (180 / Math.PI);
          const normAngle = (angle + 180) % 180;

          if (normAngle >= 22.5 && normAngle < 67.5) {
            dirGrid[idx] = 3; // /
          } else if (normAngle >= 67.5 && normAngle < 112.5) {
            dirGrid[idx] = 1; // - (gradient is vertical -> edge is horizontal)
          } else if (normAngle >= 112.5 && normAngle < 157.5) {
            dirGrid[idx] = 4; // \
          } else {
            dirGrid[idx] = 2; // | (gradient is horizontal -> edge is vertical)
          }
        }
      }
    }
    return { edgeGrid, dirGrid };
  }

  // Hue rotation helper
  rotateHue(r, g, b, angleDeg) {
    const rad = (angleDeg * Math.PI) / 180;
    const cosA = Math.cos(rad);
    const sinA = Math.sin(rad);

    const rotR = (0.213 + cosA * 0.787 - sinA * 0.213) * r +
                 (0.715 - cosA * 0.715 - sinA * 0.715) * g +
                 (0.072 - cosA * 0.072 + sinA * 0.928) * b;

    const rotG = (0.213 - cosA * 0.213 + sinA * 0.143) * r +
                 (0.715 + cosA * 0.285 + sinA * 0.140) * g +
                 (0.072 - cosA * 0.072 - sinA * 0.283) * b;

    const rotB = (0.213 - cosA * 0.213 - sinA * 0.787) * r +
                 (0.715 - cosA * 0.715 + sinA * 0.715) * g +
                 (0.072 + cosA * 0.928 + sinA * 0.072) * b;

    return [
      Math.max(0, Math.min(255, Math.round(rotR))),
      Math.max(0, Math.min(255, Math.round(rotG))),
      Math.max(0, Math.min(255, Math.round(rotB)))
    ];
  }
}

window.effectsManager = new EffectsManager();
