// ============================================================
// core/Camera.js
// First-person perspective camera with smooth FOV transitions
// (for sprint) and crouch height blending.
// ============================================================

import * as THREE from 'three';

export class Camera {
  constructor(fov = 75) {
    this.camera = new THREE.PerspectiveCamera(fov, 1, 0.05, 200);
    this.camera.position.set(0, 1.65, 0);
    this._targetFov = fov;
    this._targetEye = 1.65;
    this._eye = 1.65;
  }

  setAspect(aspect) {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  setFov(fov) {
    this._targetFov = fov;
  }

  setEyeHeight(h) {
    this._targetEye = h;
  }

  // Smooth per-frame interpolation toward targets.
  update(dt) {
    // FOV lerp
    const fovDelta = this._targetFov - this.camera.fov;
    if (Math.abs(fovDelta) > 0.01) {
      this.camera.fov += fovDelta * Math.min(1, dt * 6);
      this.camera.updateProjectionMatrix();
    }
    // Eye height lerp
    const eyeDelta = this._targetEye - this._eye;
    if (Math.abs(eyeDelta) > 0.001) {
      this._eye += eyeDelta * Math.min(1, dt * 8);
    }
  }

  get currentEye() { return this._eye; }

  // Apply yaw + pitch (radians) and head-bob offset
  applyOrientation(yaw, pitch, bobX = 0, bobY = 0) {
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = yaw;
    this.camera.rotation.x = pitch;
    // Bob is applied as positional offset; the caller sets base position.
    this.camera.position.y = this._eye + bobY;
  }
}
