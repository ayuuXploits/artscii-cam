/**
 * app.js — ASCII CAM
 * Entry point: camera init, image loading, and the rAF render loop.
 * Depends on: state, renderer (drawFrame), ui (showToast)
 */

'use strict';

const app = {

  // ── Camera ─────────────────────────────────────────────
  async startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });

      const video = document.getElementById('video');
      video.srcObject = stream;
      await video.play();

      document.getElementById('overlay').style.display = 'none';
      document.getElementById('pause-btn').style.display = '';
      document.getElementById('save-btn').style.display  = '';
      document.getElementById('status').textContent      = '// streaming';

      state.sourceMode = 'camera';

      if (!state.running) {
        state.running = true;
        requestAnimationFrame(app._loop);
      }
    } catch (err) {
      document.getElementById('overlay').innerHTML = `
        <div style="color:#f44;font-size:16px;">CAMERA DENIED</div>
        <div style="font-size:12px;margin-top:6px;color:#666;">${err.message}</div>
      `;
    }
  },

  // ── Image source ───────────────────────────────────────
  loadImage(input) {
    const file = input.files[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      createImageBitmap(img).then(bmp => {
        state.imgBitmap  = bmp;
        state.sourceMode = 'image';

        document.getElementById('overlay').style.display = 'none';
        document.getElementById('save-btn').style.display = '';
        document.getElementById('status').textContent = '// image loaded';

        if (!state.running) {
          state.running = true;
          requestAnimationFrame(app._loop);
        }
        drawFrame();
        URL.revokeObjectURL(url);
      });
    };

    img.onerror = () => {
      showToast('Failed to load image');
      URL.revokeObjectURL(url);
    };

    img.src = url;
  },

  // ── rAF loop ───────────────────────────────────────────
  _loop(ts) {
    requestAnimationFrame(app._loop);

    if (state.paused && state.sourceMode === 'camera') return;

    const video = document.getElementById('video');
    if (state.sourceMode === 'camera' && video.readyState < 2) return;

    if (ts - state.lastTime < state.fpsInterval) return;

    document.getElementById('fps-badge').textContent =
      Math.round(1000 / (ts - state.lastTime)) + ' fps';

    state.lastTime = ts;

    if (state.fx.hue) state.hueAngle = (state.hueAngle + 1) % 360;

    drawFrame();
  },
};
