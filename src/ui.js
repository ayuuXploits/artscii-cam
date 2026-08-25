/**
 * ASCII CAM - UI Controller & DOM Event Bindings
 */

class UIController {
  constructor(state, app) {
    this.state = state;
    this.app = app;
    this.toastTimer = null;

    this.initElements();
    this.bindEvents();
    this.bindStateSync();
  }

  initElements() {
    this.elements = {
      app: document.getElementById('app'),
      viewport: document.getElementById('viewport'),
      canvas: document.getElementById('ascii-canvas'),
      overlay: document.getElementById('overlay'),
      initCameraBtn: document.getElementById('init-camera-btn'),
      demoBtn: document.getElementById('demo-btn'),
      statusText: document.getElementById('status'),
      liveDot: document.querySelector('.live-dot'),
      resBadge: document.getElementById('res-badge'),
      fpsBadge: document.getElementById('fps-badge'),
      toast: document.getElementById('toast'),
      crtOverlay: document.getElementById('crt-overlay'),

      // Sources
      imgUpload: document.getElementById('img-upload'),
      imgBtn: document.getElementById('img-btn'),

      // Charset
      customCharsInput: document.getElementById('custom-chars-input'),

      // Sliders & Values
      fontSlider: document.getElementById('font-slider'),
      fontVal: document.getElementById('font-val'),
      brightnessSlider: document.getElementById('brightness-slider'),
      brVal: document.getElementById('br-val'),
      contrastSlider: document.getElementById('contrast-slider'),
      coVal: document.getElementById('co-val'),
      bgSlider: document.getElementById('bg-slider'),
      colsSlider: document.getElementById('cols-slider'),
      colsVal: document.getElementById('cols-val'),

      // Custom color pickers
      customWrap: document.getElementById('custom-wrap'),
      ccDark: document.getElementById('cc-dark'),
      ccBright: document.getElementById('cc-bright'),
      ccDh: document.getElementById('cc-dh'),
      ccBh: document.getElementById('cc-bh'),
      customSwatch: document.getElementById('custom-swatch'),

      // Toggles
      toggleMirror: document.getElementById('t-mirror'),
      toggleInvert: document.getElementById('t-invert'),

      // Actions
      pauseBtn: document.getElementById('pause-btn'),
      copyBtn: document.getElementById('copy-btn'),
      saveBtn: document.getElementById('save-btn'),
      fullscreenBtn: document.getElementById('fullscreen-btn')
    };
  }

  showToast(message, duration = 2400) {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.elements.toast.textContent = message;
    this.elements.toast.classList.add('show');
    this.toastTimer = setTimeout(() => {
      this.elements.toast.classList.remove('show');
    }, duration);
  }

  bindEvents() {
    // 1. Source selector
    document.querySelectorAll('[data-action="setSource"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const val = btn.dataset.value;
        if (val === 'image') {
          this.elements.imgUpload.click();
        } else {
          this.setActivePill('[data-action="setSource"]', btn);
          this.state.set('source', 'camera');
          this.app.startCamera();
        }
      });
    });

    // Image Upload
    this.elements.imgUpload.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.app.loadImageFromFile(file);
        this.setActivePill('[data-action="setSource"]', this.elements.imgBtn);
      }
    });

    // Drag & Drop Image onto Viewport
    window.addEventListener('dragover', (e) => e.preventDefault());
    window.addEventListener('drop', (e) => {
      e.preventDefault();
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0];
        if (file.type.startsWith('image/')) {
          this.app.loadImageFromFile(file);
          this.setActivePill('[data-action="setSource"]', this.elements.imgBtn);
        }
      }
    });

    // 2. CharSet selector
    document.querySelectorAll('[data-action="setCharSet"]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.setActivePill('[data-action="setCharSet"]', btn);
        const val = btn.dataset.value;
        this.state.set('charSet', val);

        if (val === 'custom_chars') {
          this.elements.customCharsInput.style.display = 'block';
          this.elements.customCharsInput.focus();
        } else {
          this.elements.customCharsInput.style.display = 'none';
        }
      });
    });

    this.elements.customCharsInput.addEventListener('input', (e) => {
      this.state.set('customChars', e.target.value || ' #');
    });

    // 3. Font Size Slider
    this.elements.fontSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      this.elements.fontVal.textContent = val;
      this.state.set('fontSize', val);
    });

    // 4. Color Mode selector
    document.querySelectorAll('[data-action="setColorMode"]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.setActivePill('[data-action="setColorMode"]', btn);
        const val = btn.dataset.value;
        this.state.set('colorMode', val);

        if (val === 'custom') {
          this.elements.customWrap.style.display = 'flex';
        } else {
          this.elements.customWrap.style.display = 'none';
        }
      });
    });

    // Custom Color Pickers
    const updateCustomPalette = () => {
      const dark = this.elements.ccDark.value;
      const bright = this.elements.ccBright.value;
      this.elements.ccDh.textContent = dark;
      this.elements.ccBh.textContent = bright;
      this.elements.customSwatch.style.background = `linear-gradient(90deg, ${dark}, ${bright})`;
      this.state.update({
        customColorDark: dark,
        customColorBright: bright
      });
    };

    this.elements.ccDark.addEventListener('input', updateCustomPalette);
    this.elements.ccBright.addEventListener('input', updateCustomPalette);

    // 5. Adjustments: Brightness & Contrast
    this.elements.brightnessSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      this.elements.brVal.textContent = val;
      this.state.set('brightness', val);
    });

    this.elements.contrastSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      this.elements.coVal.textContent = val;
      this.state.set('contrast', val);
    });

    // 6. Background Lightness
    this.elements.bgSlider.addEventListener('input', (e) => {
      this.state.set('bgLightness', parseInt(e.target.value, 10));
    });

    // 7. Columns Slider
    this.elements.colsSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      this.elements.colsVal.textContent = val;
      this.state.set('cols', val);
    });

    // 8. FPS Cap selector
    document.querySelectorAll('[data-action="setFps"]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.setActivePill('[data-action="setFps"]', btn);
        this.state.set('fpsCap', parseInt(btn.dataset.value, 10));
      });
    });

    // 9. Toggles (Mirror & Invert)
    this.elements.toggleMirror.addEventListener('click', () => {
      this.state.toggle('mirror');
    });

    this.elements.toggleInvert.addEventListener('click', () => {
      this.state.toggle('invert');
    });

    // 10. Effects toggles
    document.querySelectorAll('[data-fx]').forEach(btn => {
      btn.addEventListener('click', () => {
        const fxName = btn.dataset.fx;
        this.state.toggleFx(fxName);
        btn.classList.toggle('active', this.state.get('fx')[fxName]);

        if (fxName === 'scan') {
          this.elements.crtOverlay.style.display = this.state.get('fx').scan ? 'block' : 'none';
        }
      });
    });

    // 11. Actions
    this.elements.initCameraBtn.addEventListener('click', () => {
      this.app.startCamera();
    });

    if (this.elements.demoBtn) {
      this.elements.demoBtn.addEventListener('click', () => {
        this.app.loadTestPattern();
      });
    }

    this.elements.pauseBtn.addEventListener('click', () => {
      this.togglePause();
    });

    this.elements.copyBtn.addEventListener('click', () => {
      this.copyAsciiText();
    });

    this.elements.saveBtn.addEventListener('click', () => {
      this.saveSnapshot();
    });

    this.elements.fullscreenBtn.addEventListener('click', () => {
      this.toggleFullscreen();
    });

    // 12. Keyboard shortcuts
    window.addEventListener('keydown', (e) => {
      // Ignore when typing inside input
      if (e.target.tagName === 'INPUT') return;

      if (e.code === 'Space') {
        e.preventDefault();
        this.togglePause();
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        this.saveSnapshot();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        this.toggleFullscreen();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const current = this.state.get('cols');
        const next = Math.max(30, current - 5);
        this.elements.colsSlider.value = next;
        this.elements.colsVal.textContent = next;
        this.state.set('cols', next);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        const current = this.state.get('cols');
        const next = Math.min(200, current + 5);
        this.elements.colsSlider.value = next;
        this.elements.colsVal.textContent = next;
        this.state.set('cols', next);
      }
    });
  }

  setActivePill(selector, targetBtn) {
    document.querySelectorAll(selector).forEach(btn => btn.classList.remove('active'));
    targetBtn.classList.add('active');
  }

  togglePause() {
    const isPaused = !this.state.get('isPaused');
    this.state.set('isPaused', isPaused);
    this.elements.pauseBtn.textContent = isPaused ? '▶ RESUME' : '⏸ PAUSE';
    this.showToast(isPaused ? 'Stream Paused' : 'Stream Resumed', 1200);
  }

  async copyAsciiText() {
    const text = this.state.get('lastAsciiText');
    if (!text) {
      this.showToast('No ASCII frame available yet!');
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      this.showToast('📋 ASCII Art copied to clipboard!');
    } catch (err) {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      this.showToast('📋 ASCII Art copied to clipboard!');
    }
  }

  saveSnapshot() {
    const canvas = this.elements.canvas;
    if (!canvas || canvas.width === 0) {
      this.showToast('No frame to save');
      return;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const link = document.createElement('a');
    link.download = `ascii-cam-${timestamp}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    this.showToast('💾 Snapshot saved as PNG!');
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      this.elements.viewport.requestFullscreen().catch(err => {
        document.documentElement.requestFullscreen();
      });
      this.showToast('Entered Fullscreen');
    } else {
      document.exitFullscreen();
      this.showToast('Exited Fullscreen');
    }
  }

  bindStateSync() {
    this.state.subscribe('mirror', (val) => {
      this.elements.toggleMirror.classList.toggle('on', val);
      this.elements.toggleMirror.setAttribute('aria-checked', val);
    });

    this.state.subscribe('invert', (val) => {
      this.elements.toggleInvert.classList.toggle('on', val);
      this.elements.toggleInvert.setAttribute('aria-checked', val);
    });

    this.state.subscribe('hasCameraSignal', (hasSignal) => {
      if (hasSignal) {
        this.elements.overlay.classList.add('hidden');
        this.elements.pauseBtn.style.display = 'block';
        this.elements.saveBtn.style.display = 'block';
        this.elements.liveDot.classList.add('active');
        this.elements.statusText.textContent = '// live stream';
      } else {
        this.elements.overlay.classList.remove('hidden');
        this.elements.liveDot.classList.remove('active');
        this.elements.statusText.textContent = '// no signal';
      }
    });

    this.state.subscribe('currentFps', (fps) => {
      this.elements.fpsBadge.textContent = `${fps} FPS`;
    });

    this.state.subscribe('rows', (rows) => {
      const cols = this.state.get('cols');
      this.elements.resBadge.textContent = `${cols}×${rows} chars`;
    });
  }
}

window.UIController = UIController;
