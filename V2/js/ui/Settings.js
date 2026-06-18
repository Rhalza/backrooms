// ============================================================
// ui/Settings.js
// Settings panel UI. Reads/writes the settings object passed
// from Game.js, and notifies via onChange when settings change.
// ============================================================

import { Presets } from '../config/Presets.js';

export class Settings {
  constructor(dom, settings, onChange) {
    this.dom = dom;
    this.settings = settings;
    this.onChange = onChange;

    this.elQuality = dom.querySelector('#set-quality');
    this.elRenderDistance = dom.querySelector('#set-render-distance');
    this.elPixelRatio = dom.querySelector('#set-pixel-ratio');
    this.elSensitivity = dom.querySelector('#set-sensitivity');
    this.elFov = dom.querySelector('#set-fov');
    this.elFog = dom.querySelector('#set-fog');
    this.elBob = dom.querySelector('#set-bob');
    this.elTextures = dom.querySelector('#set-textures');
    this.elStains = dom.querySelector('#set-stains');

    this.elRdVal = dom.querySelector('#rd-val');
    this.elPrVal = dom.querySelector('#pr-val');
    this.elSnVal = dom.querySelector('#sn-val');
    this.elFovVal = dom.querySelector('#fov-val');

    this._syncFromSettings();
    this._bind();
  }

  _syncFromSettings() {
    const s = this.settings;
    this.elQuality.value = s.quality;
    this.elRenderDistance.value = s.renderDistance;
    this.elPixelRatio.value = s.pixelRatio;
    this.elSensitivity.value = s.sensitivity;
    this.elFov.value = s.fov;
    this.elFog.checked = s.fog;
    this.elBob.checked = s.bob;
    this.elTextures.checked = s.textures;
    this.elStains.checked = s.stains;
    this.elRdVal.textContent = String(s.renderDistance);
    this.elPrVal.textContent = s.pixelRatio.toFixed(1);
    this.elSnVal.textContent = s.sensitivity.toFixed(2);
    this.elFovVal.textContent = String(s.fov);
  }

  _bind() {
    const update = (key, val, valEl = null, fmt = null) => {
      this.settings[key] = val;
      if (valEl) valEl.textContent = fmt ? fmt(val) : String(val);
      if (this.onChange) this.onChange({ [key]: val });
    };

    this.elQuality.addEventListener('change', (e) => {
      update('quality', e.target.value);
      // When quality preset changes, also rebase render distance & pixel ratio
      // from the preset unless the user explicitly overrides after.
      const p = Presets[e.target.value] || Presets.medium;
      this.elRenderDistance.value = p.renderDistance;
      this.elPixelRatio.value = p.pixelRatioCap;
      update('renderDistance', p.renderDistance, this.elRdVal);
      update('pixelRatio', p.pixelRatioCap, this.elPrVal, (v) => v.toFixed(1));
    });

    this.elRenderDistance.addEventListener('input', (e) => {
      update('renderDistance', parseInt(e.target.value, 10), this.elRdVal);
    });
    this.elPixelRatio.addEventListener('input', (e) => {
      update('pixelRatio', parseFloat(e.target.value), this.elPrVal, (v) => v.toFixed(1));
    });
    this.elSensitivity.addEventListener('input', (e) => {
      update('sensitivity', parseFloat(e.target.value), this.elSnVal, (v) => v.toFixed(2));
    });
    this.elFov.addEventListener('input', (e) => {
      update('fov', parseInt(e.target.value, 10), this.elFovVal);
    });
    this.elFog.addEventListener('change', (e) => update('fog', e.target.checked));
    this.elBob.addEventListener('change', (e) => update('bob', e.target.checked));
    this.elTextures.addEventListener('change', (e) => update('textures', e.target.checked));
    this.elStains.addEventListener('change', (e) => update('stains', e.target.checked));
  }

  show() { this.dom.classList.remove('hidden'); }
  hide() { this.dom.classList.add('hidden'); }
}
