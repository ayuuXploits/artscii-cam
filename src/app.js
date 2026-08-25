/**
 * ASCII CAM - Application Orchestrator & Loop Controller
 */

class AsciiCamApp {
  constructor() {
    this.video = document.getElementById('video');
    this.canvas = document.getElementById('ascii-canvas');

    this.state = window.appState;
    this.effects = window.effectsManager;
    this.renderer = new window.AsciiRenderer(this.canvas, this.state, this.effects);
    this.ui = new window.UIController(this.state, this);

    this.stream = null;
    this.lastFrameTime = 0;
    this.frameCount = 0;
    this.fpsTimer = performance.now();

    this.init();
  }

  init() {
    // Generate synthetic test card / demo visual initially so user sees immediate response
    this.startRenderLoop();
  }

  async startCamera() {
    try {
      this.ui.showToast('Requesting camera access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: false
      });

      this.stream = stream;
      this.video.srcObject = stream;
      await this.video.play();

      this.state.set('hasCameraSignal', true);
      this.state.set('source', 'camera');
      this.state.set('isStreaming', true);
      this.ui.showToast('🎥 Camera connected!');
    } catch (err) {
      console.warn('Camera access denied or unavailable:', err);
      let msg = 'Camera access denied or not available';
      if (err.name === 'NotAllowedError') {
        msg = 'Camera permission denied. Please allow access in your browser.';
      } else if (err.name === 'NotFoundError') {
        msg = 'No camera device found.';
      }
      this.ui.showToast(msg, 4000);
      document.getElementById('status').textContent = '// camera unavailable';
    }
  }

  loadTestPattern() {
    if (!this.testCanvas) {
      this.testCanvas = document.createElement('canvas');
      this.testCanvas.width = 640;
      this.testCanvas.height = 480;
      this.testCtx = this.testCanvas.getContext('2d');
      this.testAngle = 0;
    }

    this.state.set('hasCameraSignal', true);
    this.state.set('source', 'test_pattern');
    this.state.set('isStreaming', true);
    this.ui.showToast('⚡ Cyber Test Signal active!');
  }

  updateTestPattern() {
    if (!this.testCtx) return;
    const ctx = this.testCtx;
    const w = this.testCanvas.width;
    const h = this.testCanvas.height;
    this.testAngle = (this.testAngle || 0) + 0.03;

    // Background gradient
    const grad = ctx.createRadialGradient(w/2, h/2, 40, w/2, h/2, 320);
    grad.addColorStop(0, '#102040');
    grad.addColorStop(0.5, '#050a15');
    grad.addColorStop(1, '#000000');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Color bars at top
    const barColors = ['#ffffff', '#ffff00', '#00ffff', '#00ff00', '#ff00ff', '#ff0000', '#0000ff'];
    const barW = w / barColors.length;
    for (let i = 0; i < barColors.length; i++) {
      ctx.fillStyle = barColors[i];
      ctx.fillRect(i * barW, 20, barW, 40);
    }

    // Rotating geometric 3D rings
    ctx.save();
    ctx.translate(w / 2, h / 2 + 20);
    for (let r = 0; r < 4; r++) {
      ctx.beginPath();
      ctx.ellipse(0, 0, 140 - r * 30, 70 + r * 15, this.testAngle * (r % 2 === 0 ? 1 : -1) + r, 0, Math.PI * 2);
      ctx.strokeStyle = barColors[(r * 2 + 1) % barColors.length];
      ctx.lineWidth = 6;
      ctx.stroke();
    }
    // Center glowing circle
    ctx.beginPath();
    ctx.arc(0, 0, 25, 0, Math.PI * 2);
    ctx.fillStyle = '#00ffcc';
    ctx.fill();
    ctx.restore();

    // Retro grid floor
    ctx.strokeStyle = '#005577';
    ctx.lineWidth = 1.5;
    for (let y = h - 100; y < h; y += 15) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Header & Cyber Text
    ctx.fillStyle = '#00ff88';
    ctx.font = 'bold 26px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ASCII CAM // SIGNAL ACTIVE', w / 2, h - 35);
  }

  loadImageFromFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        this.state.set('imageElement', img);
        this.state.set('source', 'image');
        this.state.set('hasCameraSignal', true);
        this.state.set('isStreaming', true);
        this.ui.showToast('🖼 Image loaded successfully!');
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  startRenderLoop() {
    const loop = (now) => {
      requestAnimationFrame(loop);

      // Check FPS Cap
      const fpsCap = this.state.get('fpsCap') || 20;
      const interval = 1000 / fpsCap;
      const delta = now - this.lastFrameTime;

      if (delta < interval) return;
      this.lastFrameTime = now - (delta % interval);

      // Calculate Real-Time FPS
      this.frameCount++;
      if (now - this.fpsTimer >= 1000) {
        const currentFps = Math.round((this.frameCount * 1000) / (now - this.fpsTimer));
        this.state.set('currentFps', currentFps);
        this.frameCount = 0;
        this.fpsTimer = now;
      }

      // Skip render if paused
      if (this.state.get('isPaused')) return;

      const source = this.state.get('source');
      let activeMedia = null;

      if (source === 'camera' && this.video.readyState >= 2) {
        activeMedia = this.video;
      } else if (source === 'image' && this.state.get('imageElement')) {
        activeMedia = this.state.get('imageElement');
      } else if (source === 'test_pattern' && this.testCanvas) {
        this.updateTestPattern();
        activeMedia = this.testCanvas;
      }

      if (activeMedia) {
        this.renderer.render(activeMedia);
      }
    };

    requestAnimationFrame(loop);
  }
}

// Bootstrap application when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  window.app = new AsciiCamApp();
});
