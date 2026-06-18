// ============================================================
// utils/GeometryCache.js
// Shared BoxGeometry instances and primitive helpers.
// Avoid creating new geometries per chunk — reuse them.
// ============================================================

import * as THREE from 'three';

const _cache = new Map();

// Get a unit box (1,1,1)
export function getUnitBox() {
  if (_cache.has('unitBox')) return _cache.get('unitBox');
  const g = new THREE.BoxGeometry(1, 1, 1);
  _cache.set('unitBox', g);
  return g;
}

export function getBox(w, h, d) {
  const k = `box:${w}:${h}:${d}`;
  if (_cache.has(k)) return _cache.get(k);
  const g = new THREE.BoxGeometry(w, h, d);
  _cache.set(k, g);
  return g;
}

export function getPlane(w, h) {
  const k = `plane:${w}:${h}`;
  if (_cache.has(k)) return _cache.get(k);
  const g = new THREE.PlaneGeometry(w, h);
  _cache.set(k, g);
  return g;
}

// ============================================================
// WallBuilder — accumulates wall boxes / floor / ceiling quads
// into a single BufferGeometry, so each chunk = one mesh = one
// draw call.
//
// Uses 24 verts per box (4 per face) so each face has its own
// UV mapping into the texture atlas.
// ============================================================

export class WallBuilder {
  constructor() {
    this.positions = [];
    this.normals = [];
    this.uvs = [];
    this.indices = [];
    this._vtx = 0;
  }

  // Add an axis-aligned box centered at (cx, cy, cz) with size (sx, sy, sz).
  // uvRegion = [u0, v0, u1, v1] inside the texture atlas.
  // tileU/tileV: world size per texture tile on horizontal / vertical axes.
  addBox(cx, cy, cz, sx, sy, sz, uvRegion, tileU = 1, tileV = 1) {
    const hx = sx * 0.5, hy = sy * 0.5, hz = sz * 0.5;
    const [u0, v0, u1, v1] = uvRegion;
    const du = u1 - u0, dv = v1 - v0;

    // Texture repeat counts (how many tiles fit on each face)
    const tuX = Math.max(0.001, sx / tileU) * du;  // +Z/-Z horizontal
    const tvX = Math.max(0.001, sy / tileV) * dv;  // +Z/-Z vertical
    const tuZ = Math.max(0.001, sz / tileU) * du;  // +X/-X horizontal
    const tvZ = Math.max(0.001, sy / tileV) * dv;  // +X/-X vertical
    const tuT = Math.max(0.001, sx / tileU) * du;  // top/bottom
    const tvT = Math.max(0.001, sz / tileV) * dv;  // top/bottom

    // 8 corner positions
    const p = [
      [cx - hx, cy - hy, cz - hz],
      [cx + hx, cy - hy, cz - hz],
      [cx + hx, cy + hy, cz - hz],
      [cx - hx, cy + hy, cz - hz],
      [cx - hx, cy - hy, cz + hz],
      [cx + hx, cy - hy, cz + hz],
      [cx + hx, cy + hy, cz + hz],
      [cx - hx, cy + hy, cz + hz],
    ];

    // Faces: normal, 4 corner indices (CCW from outside), UV mapping
    // For each face we list uv as 4 [u,v] pairs forming the tile rectangle.
    const faces = [
      // -Z (front)
      { n: [0, 0, -1], v: [0, 3, 2, 1], u: [0, 0, 0, tvX, tuX, tvX, tuX, 0] },
      // +Z (back)
      { n: [0, 0,  1], v: [4, 5, 6, 7], u: [0, 0, tuX, 0, tuX, tvX, 0, tvX] },
      // -X (left)
      { n: [-1, 0, 0], v: [0, 4, 7, 3], u: [0, 0, tuZ, 0, tuZ, tvZ, 0, tvZ] },
      // +X (right)
      { n: [ 1, 0, 0], v: [1, 2, 6, 5], u: [0, 0, 0, tvZ, tuZ, tvZ, tuZ, 0] },
      // +Y (top)
      { n: [0, 1, 0], v: [3, 7, 6, 2], u: [0, 0, tuT, 0, tuT, tvT, 0, tvT] },
      // -Y (bottom)
      { n: [0,-1, 0], v: [0, 1, 5, 4], u: [0, 0, tuT, 0, tuT, tvT, 0, tvT] },
    ];

    for (const f of faces) {
      const b = this._vtx;
      for (let i = 0; i < 4; i++) {
        const vi = f.v[i];
        this.positions.push(p[vi][0], p[vi][1], p[vi][2]);
        this.normals.push(f.n[0], f.n[1], f.n[2]);
        this.uvs.push(u0 + f.u[i * 2], v0 + f.u[i * 2 + 1]);
      }
      this._vtx += 4;
      this.indices.push(b, b + 1, b + 2, b, b + 2, b + 3);
    }
  }

  // Horizontal floor quad at height y (facing up).
  addFloorQuad(x0, z0, x1, z1, y, uvRegion, tileU = 1, tileV = 1) {
    const [u0, v0, u1, v1] = uvRegion;
    const du = u1 - u0, dv = v1 - v0;
    const su = Math.max(0.001, (x1 - x0) / tileU) * du;
    const sv = Math.max(0.001, (z1 - z0) / tileV) * dv;
    const b = this._vtx;
    this.positions.push(
      x0, y, z0,
      x1, y, z0,
      x1, y, z1,
      x0, y, z1,
    );
    this.normals.push(0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0);
    this.uvs.push(
      u0, v0,
      u0 + su, v0,
      u0 + su, v0 + sv,
      u0, v0 + sv,
    );
    this._vtx += 4;
    this.indices.push(b, b + 1, b + 2, b, b + 2, b + 3);
  }

  // Ceiling quad at height y (facing down).
  addCeilingQuad(x0, z0, x1, z1, y, uvRegion, tileU = 1, tileV = 1) {
    const [u0, v0, u1, v1] = uvRegion;
    const du = u1 - u0, dv = v1 - v0;
    const su = Math.max(0.001, (x1 - x0) / tileU) * du;
    const sv = Math.max(0.001, (z1 - z0) / tileV) * dv;
    const b = this._vtx;
    this.positions.push(
      x0, y, z0,
      x0, y, z1,
      x1, y, z1,
      x1, y, z0,
    );
    this.normals.push(0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0);
    this.uvs.push(
      u0, v0,
      u0, v0 + sv,
      u0 + su, v0 + sv,
      u0 + su, v0,
    );
    this._vtx += 4;
    this.indices.push(b, b + 1, b + 2, b, b + 2, b + 3);
  }

  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.positions, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.normals, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uvs, 2));
    g.setIndex(this.indices);
    return g;
  }

  get isEmpty() {
    return this.positions.length === 0;
  }
}

// ============================================================
// AABB (axis-aligned bounding box) list — used by Collision.js
// Each chunk exposes its wall AABBs; the player queries nearby
// chunks and tests against their AABBs.
// ============================================================
export class AABBList {
  constructor() { this.boxes = []; }
  add(cx, cy, cz, sx, sy, sz) {
    this.boxes.push([cx, cy, cz, sx, sy, sz]);
  }
  clear() { this.boxes.length = 0; }
}
