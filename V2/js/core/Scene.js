// ============================================================
// core/Scene.js
// Holds the THREE.Scene, fog, and ambient lighting.
// Yellowed, slightly oppressive — Level 0 fluorescent hum.
// ============================================================

import * as THREE from 'three';

export class Scene {
  constructor(config) {
    this.config = config;
    const scene = new THREE.Scene();

    // Background matches fog color so distant chunks fade into "void"
    const fogColor = new THREE.Color(0x1a1408);
    scene.background = fogColor;
    scene.fog = new THREE.Fog(fogColor, config.fogNear, config.fogFar);

    // Hemisphere light — yellow sky, dim ground
    const hemi = new THREE.HemisphereLight(0xfff0b0, 0x554422, 0.85);
    scene.add(hemi);

    // Slight ambient fill so corners aren't pitch black
    const amb = new THREE.AmbientLight(0xb09858, 0.35);
    scene.add(amb);

    this._scene = scene;
    this._hemi = hemi;
    this._amb = amb;
    this._fog = scene.fog;
  }

  updateConfig(config) {
    this.config = config;
    if (config.fog) {
      this._fog.near = config.fogNear;
      this._fog.far = config.fogFar;
      this._fog.color.set(0x1a1408);
      this._scene.background = this._fog.color;
    } else {
      this._fog.near = 1e9;
      this._fog.far = 1e9;
    }
  }

  add(obj) { this._scene.add(obj); }
  remove(obj) { this._scene.remove(obj); }
  get three() { return this._scene; }
}
