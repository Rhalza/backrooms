// ============================================================
// core/Renderer.js
// Thin wrapper around THREE.WebGLRenderer with mobile-friendly
// defaults, capped pixel ratio, and resize handling.
// ============================================================

import * as THREE from 'three';

export class Renderer {
  constructor(canvas, config) {
    this.canvas = canvas;
    this.config = config;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: config.antialias,
      powerPreference: config.powerPreference,
      stencil: false,
      depth: true,
      alpha: false,
      desynchronized: true,
      failIfMajorPerformanceCaveat: false,
    });

    renderer.setClearColor(0x0a0805, 1);
    this._r = renderer;
    this._applyPixelRatio();
  }

  _applyPixelRatio() {
    const dpr = window.devicePixelRatio || 1;
    const cap = this.config.pixelRatioCap || 1;
    const ratio = Math.min(dpr, cap);
    this._r.setPixelRatio(ratio);
  }

  resize(width, height) {
    this._r.setSize(width, height, false);
  }

  updateConfig(config) {
    this.config = config;
    this._applyPixelRatio();
  }

  get three() { return this._r; }

  render(scene, camera) {
    this._r.render(scene, camera);
  }

  dispose() {
    this._r.dispose();
  }
}
