// ============================================================
// ui/HUD.js
// Heads-up display: crosshair, FPS counter, coordinates, chunk info.
// Pure DOM, minimal updates (throttled).
// ============================================================

export class HUD {
  constructor(dom) {
    this.dom = dom;
    this.elFps = dom.querySelector('#fps');
    this.elCoords = dom.querySelector('#coords');
    this.elChunk = dom.querySelector('#chunk-info');
    this.elQuality = dom.querySelector('#quality-badge');
    this.elToast = dom.querySelector('#toast');

    this._frameCount = 0;
    this._fpsAccum = 0;
    this._fpsValue = 0;
    this._fpsTimer = 0;
    this._toastTimer = 0;

    this.show();
  }

  show() { this.dom.classList.remove('hidden'); }
  hide() { this.dom.classList.add('hidden'); }

  setQualityLabel(label) {
    this.elQuality.textContent = label;
  }

  // Called every frame
  update(dt, playerX, playerZ, chunkX, chunkZ) {
    this._frameCount++;
    this._fpsTimer += dt;
    if (this._fpsTimer >= 0.5) {
      this._fpsValue = Math.round(this._frameCount / this._fpsTimer);
      this._frameCount = 0;
      this._fpsTimer = 0;
      this.elFps.textContent = 'FPS ' + this._fpsValue;
      this.elCoords.textContent = `X ${playerX.toFixed(1)} / Z ${playerZ.toFixed(1)}`;
      this.elChunk.textContent = `chunk ${chunkX},${chunkZ}`;
    }

    // Toast fade
    if (this._toastTimer > 0) {
      this._toastTimer -= dt;
      if (this._toastTimer <= 0) {
        this.elToast.classList.add('hidden');
      }
    }
  }

  toast(msg, duration = 2.5) {
    this.elToast.textContent = msg;
    this.elToast.classList.remove('hidden');
    this._toastTimer = duration;
  }
}
