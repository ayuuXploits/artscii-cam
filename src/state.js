/**
 * ASCII CAM - Reactive State Management
 */

class AppState {
  constructor() {
    this.state = {
      ...CONFIG.DEFAULTS,
      isPaused: false,
      isStreaming: false,
      hasCameraSignal: false,
      imageElement: null,
      lastAsciiText: '',
      currentFps: 0,
      rows: 0,
      time: 0
    };

    this.listeners = new Map();
  }

  get(key) {
    return this.state[key];
  }

  getAll() {
    return { ...this.state };
  }

  set(key, value) {
    const oldValue = this.state[key];
    if (oldValue === value) return;

    this.state[key] = value;
    this.notify(key, value, oldValue);
    this.notify('*', this.state);
  }

  update(patch) {
    const changes = [];
    for (const [key, val] of Object.entries(patch)) {
      if (this.state[key] !== val) {
        const old = this.state[key];
        this.state[key] = val;
        changes.push({ key, val, old });
      }
    }
    for (const { key, val, old } of changes) {
      this.notify(key, val, old);
    }
    if (changes.length > 0) {
      this.notify('*', this.state);
    }
  }

  toggleFx(fxName) {
    if (this.state.fx.hasOwnProperty(fxName)) {
      const nextFx = { ...this.state.fx, [fxName]: !this.state.fx[fxName] };
      this.set('fx', nextFx);
    }
  }

  toggle(key) {
    if (typeof this.state[key] === 'boolean') {
      this.set(key, !this.state[key]);
    }
  }

  getCurrentRamp() {
    if (this.state.charSet === 'custom_chars') {
      return this.state.customChars || ' #';
    }
    return CONFIG.CHARSETS[this.state.charSet] || CONFIG.CHARSETS.detailed;
  }

  subscribe(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key).add(callback);
    return () => this.listeners.get(key).delete(callback);
  }

  notify(key, ...args) {
    if (this.listeners.has(key)) {
      this.listeners.get(key).forEach(cb => {
        try {
          cb(...args);
        } catch (err) {
          console.error(`Error in state subscriber for "${key}":`, err);
        }
      });
    }
  }
}

window.appState = new AppState();
