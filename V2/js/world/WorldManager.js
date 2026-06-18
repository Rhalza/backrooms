// ============================================================
// world/WorldManager.js
// Loads/unloads chunks around the player based on render distance.
// Each frame: determine which chunks should be visible, build new
// ones, dispose far ones, and update the collision AABB list.
//
// Performance:
//   - Hard cap on simultaneous chunks
//   - Lazy build budget per frame (don't build 100 chunks at once)
//   - Reuses material across all chunk meshes (1 material, many geos)
//   - Frustum culling handled by Three.js per-mesh
// ============================================================

import * as THREE from 'three';
import { ChunkGenerator } from './ChunkGenerator.js';
import { getMaterial, rebuildAtlas } from './Materials.js';
import { CHUNK_SIZE } from '../config/Presets.js';

export class WorldManager {
  constructor(scene, config) {
    this.scene = scene;
    this.config = config;
    this.material = getMaterial(config.textureSize, {
      stains: config.stains,
      simple: !config.textures,
    });
    this.generator = new ChunkGenerator(this.material);

    /** @type {Map<string, Chunk>} */
    this.chunks = new Map();
    this._buildQueue = [];      // [ {cx, cz} ] — processed FIFO each frame
    this._buildBudget = 2;      // max chunks built per frame

    // Group containing all chunk meshes — added to scene once.
    this.group = new THREE.Group();
    this.group.matrixAutoUpdate = false;
    this.scene.add(this.group);

    // Combined AABB list for collision (rebuilt each time a chunk is added/removed)
    this._collisionDirty = true;
    this._aabbs = [];
  }

  setConfig(config) {
    const texturesChanged =
      this.config.textures !== config.textures ||
      this.config.stains !== config.stains ||
      this.config.textureSize !== config.textureSize;
    this.config = config;
    if (texturesChanged) {
      // Rebuild atlas with new options; existing chunks pick up the new
      // texture automatically since they share the same material.
      this.material = rebuildAtlas(config.textureSize, {
        stains: config.stains,
        simple: !config.textures,
      });
      this.generator.material = this.material;
    }
  }

  key(cx, cz) { return cx + ',' + cz; }

  // Update which chunks are loaded based on player position
  update(playerX, playerZ) {
    const rd = this.config.renderDistance;
    const pcx = Math.floor(playerX / CHUNK_SIZE);
    const pcz = Math.floor(playerZ / CHUNK_SIZE);

    // Determine desired chunk set
    const desired = new Set();
    for (let dz = -rd; dz <= rd; dz++) {
      for (let dx = -rd; dx <= rd; dx++) {
        // Optional: skip corner chunks to reduce count (circle-ish)
        // Use square for simplicity & full coverage
        const cx = pcx + dx, cz = pcz + dz;
        desired.add(this.key(cx, cz));
      }
    }

    // Unload chunks no longer desired
    const toUnload = [];
    for (const [k, chunk] of this.chunks) {
      if (!desired.has(k)) toUnload.push(k);
    }
    for (const k of toUnload) {
      const chunk = this.chunks.get(k);
      if (chunk.mesh) this.group.remove(chunk.mesh);
      chunk.dispose();
      this.chunks.delete(k);
      this._collisionDirty = true;
    }

    // Queue new chunks for building (closest first)
    const toBuild = [];
    for (const k of desired) {
      if (this.chunks.has(k)) continue;
      const [cx, cz] = k.split(',').map(Number);
      const dist = Math.max(Math.abs(cx - pcx), Math.abs(cz - pcz));
      toBuild.push({ cx, cz, dist });
    }
    toBuild.sort((a, b) => a.dist - b.dist);
    // Append to queue (dedup)
    for (const b of toBuild) {
      this._buildQueue.push(b);
    }

    // Process build budget for this frame
    let built = 0;
    while (built < this._buildBudget && this._buildQueue.length > 0) {
      const { cx, cz } = this._buildQueue.shift();
      const k = this.key(cx, cz);
      if (this.chunks.has(k)) continue; // already built
      const chunk = this.generator.generate(cx, cz);
      this.chunks.set(k, chunk);
      if (chunk.mesh) this.group.add(chunk.mesh);
      this._collisionDirty = true;
      built++;
    }
  }

  // Returns a flat array of all wall AABBs from loaded chunks.
  // Used by Collision.
  getAABBs() {
    if (this._collisionDirty) {
      this._aabbs.length = 0;
      for (const chunk of this.chunks.values()) {
        const boxes = chunk.aabb.boxes;
        const offX = chunk.cx * CHUNK_SIZE;
        const offZ = chunk.cz * CHUNK_SIZE;
        for (let i = 0; i < boxes.length; i++) {
          const b = boxes[i];
          // Offset box to world space
          this._aabbs.push([b[0] + offX, b[1], b[2] + offZ, b[3], b[4], b[5]]);
        }
      }
      this._collisionDirty = false;
    }
    return this._aabbs;
  }

  // Returns the chunk count currently loaded
  get loadedCount() { return this.chunks.size; }

  // Dispose everything
  dispose() {
    for (const chunk of this.chunks.values()) {
      chunk.dispose();
    }
    this.chunks.clear();
    this._aabbs.length = 0;
    this._buildQueue.length = 0;
    this.scene.remove(this.group);
  }
}
