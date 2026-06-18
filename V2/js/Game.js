// ============================================================
// Game.js
// Main orchestrator. Owns renderer, scene, camera, world,
// player, controls, and UI. Runs the main loop.
// ============================================================

import * as THREE from 'three';
import { Renderer } from './core/Renderer.js';
import { Scene } from './core/Scene.js';
import { Camera } from './core/Camera.js';
import { Controls } from './player/Controls.js';
import { Collision } from './player/Collision.js';
import { Movement } from './player/Movement.js';
import { WorldManager } from './world/WorldManager.js';
import { HUD } from './ui/HUD.js';
import { MobileControls } from './ui/MobileControls.js';
import { Settings as SettingsUI } from './ui/Settings.js';
import { Menu } from './ui/Menu.js';
import { Storage } from './utils/Storage.js';
import { resolveConfig, Presets, CHUNK_SIZE, PLAYER_EYE } from './config/Presets.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.state = Storage.load();
    this.config = resolveConfig(this.state.settings);

    // Core
    this.renderer = new Renderer(canvas, this.config);
    this.scene = new Scene(this.config);
    this.camera = new Camera(this.state.settings.fov);

    // Player
    this.collision = new Collision();
    this.controls = new Controls(canvas, this.state.settings);
    this.movement = new Movement(this.camera, this.controls, this.collision, this.config);

    // World
    this.world = new WorldManager(this.scene.three, this.config);

    // UI
    this.hud = new HUD(document.querySelector('#hud'));
    this.mobileControls = new MobileControls(
      document.querySelector('#mobile-controls'),
      this.controls
    );
    this.settingsUI = new SettingsUI(
      document.querySelector('#settings'),
      this.state.settings,
      (changed) => this._onSettingsChanged(changed)
    );
    this.menu = new Menu(document.querySelector('#menu'), {
      onStart: () => this.start(),
      onSettings: () => {},
      onBack: () => {},
    });

    // Pause handling — when user clicks back from pause, resume
    this.controls.onPause = () => this.pause();

    // HUD pause button (works on both mobile and desktop)
    const btnPause = document.querySelector('#btn-pause');
    if (btnPause) {
      btnPause.addEventListener('click', () => this.pause());
    }

    // Restore player position if any
    if (this.state.player) {
      const p = this.state.player;
      this.movement.setPosition(p.x, p.y, p.z, p.yaw, p.pitch);
    } else {
      // Spawn at center of chunk (0,0) — avoids corner walls
      this.movement.setPosition(CHUNK_SIZE * 0.5, PLAYER_EYE, CHUNK_SIZE * 0.5, 0, 0);
    }

    this._running = false;
    this._lastTime = 0;
    this._saveTimer = 0;

    // Resize handling
    this._onResize = this._onResize.bind(this);
    window.addEventListener('resize', this._onResize);
    window.addEventListener('orientationchange', this._onResize);
    this._onResize();

    // Detect mobile & adjust UI
    if (this.controls.isMobile) {
      // Show mobile controls during play
      this._showMobileHint();
    } else {
      this.menu.setHint('Desktop: click to lock mouse, WASD to move, Shift to run, Ctrl to crouch.<br>Esc to release mouse.');
    }

    this.hud.setQualityLabel(this.config.label);
    this._updateConfig();
  }

  _showMobileHint() {
    this.menu.setHint('Mobile: left stick to move, right side to look.<br>Buttons for run / crouch.');
  }

  start() {
    if (this._running) return;
    this._running = true;
    this.controls.setPaused(false);
    if (!this.controls.isMobile) {
      this.controls.requestPointerLock();
    } else {
      this.mobileControls.show();
    }
    this.hud.show();
    this._lastTime = performance.now() / 1000;
    this._loop();
  }

  pause() {
    this.controls.setPaused(true);
    if (!this.controls.isMobile) {
      this.controls.exitPointerLock();
    }
    this.mobileControls.hide();
    // Save on pause
    this._persistPlayer();
    // Show menu (but only if explicitly paused, not on first load)
    if (this._running) {
      this.menu.showMenu();
      this.hud.hide();
      this._running = false;
    }
  }

  _loop = () => {
    if (!this._running) return;
    requestAnimationFrame(this._loop);

    const now = performance.now() / 1000;
    let dt = now - this._lastTime;
    this._lastTime = now;
    // Clamp dt to prevent huge jumps after tab switch
    if (dt > 0.1) dt = 0.1;

    // Update world (chunk loading)
    this.world.update(this.movement.x, this.movement.z);

    // Update collision AABBs (cached, only rebuilt when chunks change)
    this.collision.setBoxes(this.world.getAABBs());

    // Update player
    this.movement.update(dt);

    // Render
    this.renderer.render(this.scene.three, this.camera.camera);

    // HUD (throttled internally)
    const pcx = Math.floor(this.movement.x / CHUNK_SIZE);
    const pcz = Math.floor(this.movement.z / CHUNK_SIZE);
    this.hud.update(dt, this.movement.x, this.movement.z, pcx, pcz);

    // Periodic save
    this._saveTimer += dt;
    if (this._saveTimer >= 5) {
      this._saveTimer = 0;
      this._persistPlayer();
    }
  };

  _persistPlayer() {
    this.state.player = {
      x: this.movement.x,
      y: this.movement.y,
      z: this.movement.z,
      yaw: this.movement.yaw,
      pitch: this.movement.pitch,
    };
    Storage.save(this.state);
  }

  _onSettingsChanged(changed) {
    // Update settings + config
    Object.assign(this.state.settings, changed);
    this.config = resolveConfig(this.state.settings);
    this._updateConfig();
    Storage.save(this.state);
    this.hud.setQualityLabel(this.config.label);
    // Show a toast (only if running)
    if (this._running && Object.keys(changed).length > 0) {
      const k = Object.keys(changed)[0];
      this.hud.toast(`${k}: ${changed[k]}`);
    }
  }

  _updateConfig() {
    this.scene.updateConfig(this.config);
    this.renderer.updateConfig(this.config);
    this.world.setConfig(this.config);
    this.movement.setConfig(this.config);
    this.camera.setFov(this.config.fov || 75);
  }

  _onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.resize(w, h);
    this.camera.setAspect(w / h);
  }

  dispose() {
    this._running = false;
    window.removeEventListener('resize', this._onResize);
    window.removeEventListener('orientationchange', this._onResize);
    this.controls.dispose();
    this.world.dispose();
    this.renderer.dispose();
  }
}
