// ============================================================
// utils/Storage.js
// localStorage persistence for settings + player state.
// Versioned, compact, defensive (never throws).
// ============================================================

const KEY = 'backrooms_l0_v1';

const DEFAULT_STATE = {
  version: 1,
  settings: {
    quality: 'medium',
    renderDistance: 4,
    pixelRatio: 1.0,
    sensitivity: 0.5,
    fov: 75,
    fog: true,
    bob: true,
    textures: true,
    stains: true,
    audio: false,
  },
  player: null, // null = use default spawn position
};

export const Storage = {
  load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return structuredClone(DEFAULT_STATE);
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.version !== 1) return structuredClone(DEFAULT_STATE);
      // Defensive merge
      return {
        version: 1,
        settings: { ...DEFAULT_STATE.settings, ...(parsed.settings || {}) },
        player:   { ...DEFAULT_STATE.player,   ...(parsed.player   || {}) },
      };
    } catch (e) {
      return structuredClone(DEFAULT_STATE);
    }
  },

  save(state) {
    try {
      // Compact serialization — only what we need
      const compact = {
        version: 1,
        settings: state.settings,
        player: state.player ? {
          x: +state.player.x.toFixed(3),
          y: +state.player.y.toFixed(3),
          z: +state.player.z.toFixed(3),
          yaw: +state.player.yaw.toFixed(4),
          pitch: +state.player.pitch.toFixed(4),
        } : null,
      };
      localStorage.setItem(KEY, JSON.stringify(compact));
      return true;
    } catch (e) {
      return false;
    }
  },

  clear() {
    try { localStorage.removeItem(KEY); return true; }
    catch (e) { return false; }
  },
};
