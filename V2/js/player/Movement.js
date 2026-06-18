// ============================================================
// player/Movement.js
// Reads input state from Controls, applies accel/decel, head
// bob, crouch transition, and collision. Writes final position
// and orientation to the Camera each frame.
// ============================================================

import * as THREE from 'three';
import { MOVEMENT, PLAYER_EYE, PLAYER_EYE_CROUCH } from '../config/Presets.js';

const _forward = new THREE.Vector3();
const _right = new THREE.Vector3();
const _wish = new THREE.Vector3();

export class Movement {
  constructor(camera, controls, collision, config) {
    this.camera = camera;
    this.controls = controls;
    this.collision = collision;
    this.config = config;

    // Player state
    this.x = 0; this.y = 0; this.z = 0;
    this.yaw = 0; this.pitch = 0;
    this.vx = 0; this.vz = 0;       // horizontal velocity
    this.crouchAmount = 0;          // 0 = standing, 1 = crouching
    this.bobPhase = 0;
    this.bobX = 0; this.bobY = 0;
    this.isMoving = false;
  }

  setPosition(x, y, z, yaw = 0, pitch = 0) {
    this.x = x; this.y = y; this.z = z;
    this.yaw = yaw; this.pitch = pitch;
  }

  setConfig(config) {
    this.config = config;
  }

  update(dt) {
    if (this.controls.state.paused) {
      // Still update camera orientation so menu doesn't snap
      this.camera.camera.position.set(this.x, this.camera.currentEye, this.z);
      this.camera.applyOrientation(this.yaw, this.pitch, 0, 0);
      return;
    }

    // ---- Look ----
    const look = this.controls.consumeLook();
    this.yaw   -= look.dx;
    this.pitch -= look.dy;
    // Clamp pitch
    const PMAX = Math.PI * 0.49;
    if (this.pitch > PMAX) this.pitch = PMAX;
    if (this.pitch < -PMAX) this.pitch = -PMAX;

    // ---- Movement direction ----
    // Build basis vectors from yaw only (no pitch — keep movement horizontal)
    _forward.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    _right.set(   Math.cos(this.yaw), 0, -Math.sin(this.yaw));

    const mv = this.controls.state.move;
    _wish.set(0, 0, 0);
    _wish.addScaledVector(_forward, mv.y);
    _wish.addScaledVector(_right,   mv.x);
    const wishLen = _wish.length();
    if (wishLen > 1e-3) _wish.multiplyScalar(1 / wishLen);

    // ---- Speed ----
    const crouch = this.controls.state.crouch;
    const sprint = this.controls.state.sprint && !crouch;
    let speed = MOVEMENT.walkSpeed;
    if (sprint) speed = MOVEMENT.sprintSpeed;
    else if (crouch) speed = MOVEMENT.crouchSpeed;

    // Target velocity
    const targetVx = _wish.x * speed;
    const targetVz = _wish.z * speed;

    // Smooth accelerate / decelerate
    const isMoving = wishLen > 0.1;
    const rate = isMoving ? MOVEMENT.accel : MOVEMENT.decel;
    this.vx += (targetVx - this.vx) * Math.min(1, dt * rate);
    this.vz += (targetVz - this.vz) * Math.min(1, dt * rate);
    this.isMoving = isMoving && (Math.abs(this.vx) + Math.abs(this.vz)) > 0.05;

    // ---- Crouch blend ----
    const targetCrouch = crouch ? 1 : 0;
    this.crouchAmount += (targetCrouch - this.crouchAmount) * Math.min(1, dt * MOVEMENT.crouchTransition);
    const eye = PLAYER_EYE + (PLAYER_EYE_CROUCH - PLAYER_EYE) * this.crouchAmount;
    this.camera.setEyeHeight(eye);

    // ---- Head bob ----
    if (this.config.bob && this.isMoving) {
      const sp = Math.hypot(this.vx, this.vz);
      const bobSpeed = MOVEMENT.bobSpeed * (sp / MOVEMENT.walkSpeed);
      this.bobPhase += dt * bobSpeed;
      const bobAmt = MOVEMENT.bobAmount * (sp / MOVEMENT.walkSpeed) * (1 - this.crouchAmount * 0.6);
      this.bobX = Math.cos(this.bobPhase) * bobAmt * 0.6;
      this.bobY = Math.abs(Math.sin(this.bobPhase)) * bobAmt;
    } else {
      // Settle back to neutral
      this.bobX *= 0.85;
      this.bobY *= 0.85;
    }

    // ---- Collision-aware integrate ----
    const dx = this.vx * dt;
    const dz = this.vz * dt;
    const resolved = this.collision.resolve(this.x, this.z, dx, dz);
    // If we collided, kill velocity along that axis (basic slide already in resolve)
    if (Math.abs(resolved.x - (this.x + dx)) > 1e-4) this.vx *= 0.0;
    if (Math.abs(resolved.z - (this.z + dz)) > 1e-4) this.vz *= 0.0;
    this.x = resolved.x;
    this.z = resolved.z;

    // ---- Apply to camera ----
    this.camera.camera.position.set(this.x + this.bobX, this.camera.currentEye, this.z);
    this.camera.applyOrientation(this.yaw, this.pitch, this.bobX, this.bobY);

    // FOV kick when sprinting
    const baseFov = this.config.fov || 75;
    this.camera.setFov(baseFov + (sprint && this.isMoving ? 6 : 0));
    this.camera.update(dt);
  }
}
