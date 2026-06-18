// ============================================================
// player/Collision.js
// AABB vs cylinder collision against the chunk's wall boxes.
// Player is treated as a circle in the XZ plane (radius r).
// We resolve by axis-separating sweep: try X, then Z, sliding
// along walls rather than stopping dead.
// ============================================================

import { PLAYER_RADIUS } from '../config/Presets.js';

export class Collision {
  constructor() {
    // Active AABBs from nearby chunks. Each is [cx, cy, cz, sx, sy, sz].
    this.boxes = [];
  }

  setBoxes(boxes) {
    this.boxes = boxes;
  }

  // Returns true if circle (at x,z with radius r) overlaps any box (XZ only).
  overlapsAny(x, z, r = PLAYER_RADIUS) {
    for (let i = 0; i < this.boxes.length; i++) {
      const b = this.boxes[i];
      const hx = b[3] * 0.5, hz = b[5] * 0.5;
      const bx0 = b[0] - hx, bx1 = b[0] + hx;
      const bz0 = b[2] - hz, bz1 = b[2] + hz;
      const cx = Math.max(bx0, Math.min(x, bx1));
      const cz = Math.max(bz0, Math.min(z, bz1));
      const dx = x - cx, dz = z - cz;
      if (dx * dx + dz * dz < r * r) return true;
    }
    return false;
  }

  // Resolve a desired position by axis-separated movement.
  // Returns the resolved position {x, z}.
  resolve(startX, startZ, dx, dz, r = PLAYER_RADIUS) {
    let x = startX + dx;
    let z = startZ;
    // X axis
    if (this.overlapsAny(x, z, r)) {
      // Step back to find first non-overlapping x
      x = startX;
      // Try smaller increments to slide along
      const steps = 4;
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const tx = startX + dx * t;
        if (!this.overlapsAny(tx, z, r)) {
          x = tx;
        } else {
          break;
        }
      }
    }
    // Z axis
    z = startZ + dz;
    if (this.overlapsAny(x, z, r)) {
      z = startZ;
      const steps = 4;
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const tz = startZ + dz * t;
        if (!this.overlapsAny(x, tz, r)) {
          z = tz;
        } else {
          break;
        }
      }
    }
    return { x, z };
  }
}
