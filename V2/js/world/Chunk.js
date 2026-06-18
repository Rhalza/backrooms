// ============================================================
// world/Chunk.js
// A single chunk: builds its geometry, owns its mesh, exposes
// its wall AABBs for collision.
// ============================================================

import * as THREE from 'three';
import { WallBuilder, AABBList } from '../utils/GeometryCache.js';
import { UV } from './Materials.js';
import { CHUNK_SIZE, WALL_HEIGHT, WALL_THICKNESS, OPENING_WIDTH } from '../config/Presets.js';

export class Chunk {
  constructor(cx, cz) {
    this.cx = cx;
    this.cz = cz;
    this.mesh = null;
    this.aabb = new AABBList();
    this.built = false;
  }

  build(archetypeFn, material) {
    const S = CHUNK_SIZE;
    const H = WALL_HEIGHT;
    const T = WALL_THICKNESS;
    const OPEN = OPENING_WIDTH;

    const builder = new WallBuilder();
    const aabb = this.aabb;
    aabb.clear();

    // Compute edges from ChunkGenerator (passed in via archetype context)
    // Actually edges come from the generator — we expect the caller to provide them.
    // To keep Chunk self-contained, we re-derive edges here using the same hash.

    // Build FLOOR (always)
    builder.addFloorQuad(0, 0, S, S, 0, UV.carpet, 2, 2);
    // Floor doesn't need collision (player can't go below y=0)

    // Build CEILING (always)
    builder.addCeilingQuad(0, 0, S, S, H, UV.ceiling, 2, 2);

    // Build edge walls (always — corner stubs + middle if closed)
    const edges = this._edges;
    this._buildEdges(builder, aabb, edges, S, H, T, OPEN);

    // Build archetype-specific interior features
    const ctx = {
      builder, aabb,
      cx: this.cx, cz: this.cz,
      edges, S, H, T, OPEN,
    };
    archetypeFn(ctx);

    // Finalize geometry
    if (!builder.isEmpty) {
      const geo = builder.build();
      this.mesh = new THREE.Mesh(geo, material);
      this.mesh.position.set(this.cx * S, 0, this.cz * S);
      this.mesh.frustumCulled = true;
      this.mesh.matrixAutoUpdate = false;
      this.mesh.updateMatrix();
    } else {
      this.mesh = null;
    }
    this.built = true;
  }

  // _edges is set externally by ChunkGenerator before build() is called
  setEdges(edges) { this._edges = edges; }

  _buildEdges(builder, aabb, edges, S, H, T, OPEN) {
    const half = S * 0.5;
    const stubLen = (S - OPEN) * 0.5;
    const wallY = H * 0.5;

    // Each edge: 2 corner stubs + middle (if closed)
    // We use a helper to add a wall segment.

    const addWallX = (cx_, cz_, len) => {
      // Wall oriented along X axis (spans len in X, T in Z)
      builder.addBox(cx_, wallY, cz_, len, H, T, UV.wallpaper, 1, H);
      aabb.add(cx_, wallY, cz_, len, H, T);
    };
    const addWallZ = (cx_, cz_, len) => {
      // Wall oriented along Z axis (spans T in X, len in Z)
      builder.addBox(cx_, wallY, cz_, T, H, len, UV.wallpaper, 1, H);
      aabb.add(cx_, wallY, cz_, T, H, len);
    };

    // North edge (z = 0): two stubs in X + middle if closed
    addWallX(stubLen * 0.5, 0, stubLen);
    addWallX(S - stubLen * 0.5, 0, stubLen);
    if (!edges.north) addWallX(half, 0, OPEN);

    // South edge (z = S)
    addWallX(stubLen * 0.5, S, stubLen);
    addWallX(S - stubLen * 0.5, S, stubLen);
    if (!edges.south) addWallX(half, S, OPEN);

    // West edge (x = 0)
    addWallZ(0, stubLen * 0.5, stubLen);
    addWallZ(0, S - stubLen * 0.5, stubLen);
    if (!edges.west) addWallZ(0, half, OPEN);

    // East edge (x = S)
    addWallZ(S, stubLen * 0.5, stubLen);
    addWallZ(S, S - stubLen * 0.5, stubLen);
    if (!edges.east) addWallZ(S, half, OPEN);
  }

  dispose() {
    if (this.mesh) {
      this.mesh.geometry.dispose();
      this.mesh = null;
    }
    this.aabb.clear();
    this.built = false;
  }
}
