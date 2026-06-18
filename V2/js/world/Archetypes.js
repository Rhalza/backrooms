// ============================================================
// world/Archetypes.js
// Level 0 architectural archetypes. Each archetype adds interior
// features ON TOP OF the base (floor + ceiling + edge walls)
// that ChunkGenerator always builds.
//
// Archetypes are selected based on the chunk's edge configuration
// (how many of N/E/S/W are open) plus a deterministic hash, so
// the same chunk always yields the same architecture.
//
// Design principles:
//   - Office architecture, not random wall spam
//   - Long sightlines where possible
//   - Partial walls and pillars feel intentional
//   - Variety without obvious repetition
//   - All features use the shared atlas material via WallBuilder
// ============================================================

import { UV } from './Materials.js';
import { hash01, hashInt, hashPick } from '../utils/Hash.js';
import { WALL_HEIGHT, WALL_THICKNESS, OPENING_WIDTH } from '../config/Presets.js';

// Each archetype function receives ctx = {
//   builder, aabb, cx, cz, edges, S, H, T, OPEN, rng (salt-based)
// }

// Helper: add a pillar (square column) at (x, z) with given width
function pillar(ctx, x, z, w = 0.4, h = ctx.H) {
  const { builder, aabb, H } = ctx;
  builder.addBox(x, h * 0.5, z, w, h, w, UV.wallpaper, 0.5, h);
  aabb.add(x, h * 0.5, z, w, h, w);
}

// Helper: add a half-wall (low divider you can see over)
function halfWall(ctx, x, z, sx, sz, h = 1.4) {
  const { builder, aabb, H } = ctx;
  // Top of half-wall gets a darker "cap" via ceiling texture? Just use wallpaper.
  builder.addBox(x, h * 0.5, z, sx, h, sz, UV.wallpaper, 0.5, h);
  aabb.add(x, h * 0.5, z, sx, h, sz);
}

// Helper: add a full interior wall segment
function interiorWall(ctx, x, z, sx, sz, h = ctx.H) {
  const { builder, aabb } = ctx;
  builder.addBox(x, h * 0.5, z, sx, h, sz, UV.wallpaper, 0.5, h);
  aabb.add(x, h * 0.5, z, sx, h, sz);
}

// Helper: niche — an indentation in a wall. Implemented as a thin
// secondary wall segment shorter than full height, creating a visual
// alcove without modifying the main wall geometry. For simplicity
// we just place a small recessed "shelf" — visually distinct from
// a full pillar.
function niche(ctx, x, z, w = 0.6, d = 0.4) {
  const { builder, aabb, H } = ctx;
  // Lower shelf
  builder.addBox(x, 0.5, z, w, 1.0, d, UV.carpet, 0.5, 0.5);
  // No collision for the alcove interior (it's recessed)
  aabb.add(x, 0.5, z, w, 1.0, d);
}

// ============================================================
// Archetype definitions
// Each returns void; mutates ctx.builder and ctx.aabb.
// ============================================================

// HALLWAY: 2 opposite edges open. Long sightline.
export function hallway(ctx) {
  const { cx, cz, edges, S, H } = ctx;
  // 15% chance of a center pillar for variety
  if (hash01(cx, cz, 11) < 0.15) {
    pillar(ctx, S * 0.5, S * 0.5, 0.35, H);
  }
}

// CORNER: 2 adjacent edges open (L-shape).
export function corner(ctx) {
  const { cx, cz, edges, S, H } = ctx;
  // 20% chance of a pillar in the closed corner
  if (hash01(cx, cz, 12) < 0.20) {
    // Find closed corner (intersection of two closed edges)
    if (!edges.north && !edges.west) pillar(ctx, 1.0, 1.0, 0.4);
    else if (!edges.north && !edges.east) pillar(ctx, S - 1.0, 1.0, 0.4);
    else if (!edges.south && !edges.west) pillar(ctx, 1.0, S - 1.0, 0.4);
    else if (!edges.south && !edges.east) pillar(ctx, S - 1.0, S - 1.0, 0.4);
  }
}

// T JUNCTION: 3 edges open.
export function tJunction(ctx) {
  const { cx, cz, edges, S, H } = ctx;
  // 30% chance of a pillar near the closed edge
  if (hash01(cx, cz, 13) < 0.30) {
    if (!edges.north) pillar(ctx, S * 0.5, 1.2, 0.4);
    else if (!edges.south) pillar(ctx, S * 0.5, S - 1.2, 0.4);
    else if (!edges.east) pillar(ctx, S - 1.2, S * 0.5, 0.4);
    else if (!edges.west) pillar(ctx, 1.2, S * 0.5, 0.4);
  }
}

// CROSS JUNCTION: all 4 edges open. Minimal interior.
export function crossJunction(ctx) {
  const { cx, cz, S, H } = ctx;
  // 25% chance of a single central pillar
  if (hash01(cx, cz, 14) < 0.25) {
    pillar(ctx, S * 0.5, S * 0.5, 0.4);
  }
}

// OPEN ROOM: all 4 open with multiple pillars (cubicle-like)
export function openRoom(ctx) {
  const { cx, cz, S, H } = ctx;
  // 2 or 4 pillars arranged in a loose pattern
  const variant = hashInt(cx, cz, 15, 0, 3);
  if (variant === 0) {
    pillar(ctx, S * 0.3, S * 0.3, 0.35);
    pillar(ctx, S * 0.7, S * 0.7, 0.35);
  } else if (variant === 1) {
    pillar(ctx, S * 0.25, S * 0.5, 0.35);
    pillar(ctx, S * 0.75, S * 0.5, 0.35);
  } else if (variant === 2) {
    pillar(ctx, S * 0.3, S * 0.3, 0.3);
    pillar(ctx, S * 0.7, S * 0.3, 0.3);
    pillar(ctx, S * 0.3, S * 0.7, 0.3);
    pillar(ctx, S * 0.7, S * 0.7, 0.3);
  }
  // variant 3: no extra pillars — pure open room
}

// PILLAR ROOM: 4 open, with a more pillar-heavy layout
export function pillarRoom(ctx) {
  const { cx, cz, S, H } = ctx;
  // Grid of 4 pillars
  const off = S * 0.3;
  pillar(ctx, off, off, 0.35);
  pillar(ctx, S - off, off, 0.35);
  pillar(ctx, off, S - off, 0.35);
  pillar(ctx, S - off, S - off, 0.35);
}

// DIVIDER ROOM: 4 open, with half-walls forming partial cubicles
export function dividerRoom(ctx) {
  const { cx, cz, S, H } = ctx;
  const variant = hashInt(cx, cz, 16, 0, 3);
  if (variant === 0) {
    // Two parallel dividers
    halfWall(ctx, S * 0.35, S * 0.5, 0.15, S * 0.6);
    halfWall(ctx, S * 0.65, S * 0.5, 0.15, S * 0.6);
  } else if (variant === 1) {
    // L-shaped divider
    halfWall(ctx, S * 0.5, S * 0.35, S * 0.6, 0.15);
    halfWall(ctx, S * 0.35, S * 0.5, 0.15, S * 0.4);
  } else {
    // Single center divider with gap
    halfWall(ctx, S * 0.5, S * 0.25, 0.15, S * 0.4);
    halfWall(ctx, S * 0.5, S * 0.75, 0.15, S * 0.4);
  }
}

// HALF-WALL ROOM: 3-4 open, with low see-over walls
export function halfWallRoom(ctx) {
  const { cx, cz, S, H } = ctx;
  const variant = hashInt(cx, cz, 17, 0, 2);
  if (variant === 0) {
    halfWall(ctx, S * 0.5, S * 0.5, S * 0.7, 0.15, 1.2);
  } else {
    halfWall(ctx, S * 0.3, S * 0.5, 0.15, S * 0.5, 1.2);
    halfWall(ctx, S * 0.7, S * 0.5, 0.15, S * 0.5, 1.2);
  }
}

// NICHE ROOM: 1-2 open, with small alcoves in closed walls
export function nicheRoom(ctx) {
  const { cx, cz, edges, S, H } = ctx;
  // Add niches on closed edges
  if (!edges.north) {
    niche(ctx, S * 0.5, 0.5, 0.8, 0.4);
  }
  if (!edges.south) {
    niche(ctx, S * 0.5, S - 0.5, 0.8, 0.4);
  }
  if (!edges.east) {
    niche(ctx, S - 0.5, S * 0.5, 0.4, 0.8);
  }
  if (!edges.west) {
    niche(ctx, 0.5, S * 0.5, 0.4, 0.8);
  }
}

// DEAD END: 1 edge open. Add a niche opposite the opening
// and maybe a pillar to break sightline.
export function deadEnd(ctx) {
  const { cx, cz, edges, S, H } = ctx;
  // The closed-off side gets a niche
  if (edges.north) {
    niche(ctx, S * 0.5, S - 0.5, 1.0, 0.4);
    if (hash01(cx, cz, 18) < 0.5) pillar(ctx, S * 0.5, S * 0.6, 0.35);
  } else if (edges.south) {
    niche(ctx, S * 0.5, 0.5, 1.0, 0.4);
    if (hash01(cx, cz, 18) < 0.5) pillar(ctx, S * 0.5, S * 0.4, 0.35);
  } else if (edges.east) {
    niche(ctx, S - 0.5, S * 0.5, 0.4, 1.0);
    if (hash01(cx, cz, 18) < 0.5) pillar(ctx, S * 0.6, S * 0.5, 0.35);
  } else if (edges.west) {
    niche(ctx, 0.5, S * 0.5, 0.4, 1.0);
    if (hash01(cx, cz, 18) < 0.5) pillar(ctx, S * 0.4, S * 0.5, 0.35);
  }
}

// CRAWLSPACE ROOM: rare. Low ceiling section + half-walls forming
// a narrow passage. Visual claustrophobia — the low ceiling is
// decorative (no ceiling collision), so the player just walks
// through but it FEELS tight.
export function crawlspaceRoom(ctx) {
  const { cx, cz, edges, S, H } = ctx;
  // Two half-walls creating a zigzag passage
  const variant = hashInt(cx, cz, 19, 0, 2);
  if (variant === 0) {
    halfWall(ctx, S * 0.4, S * 0.3, 0.15, S * 0.5, 1.0);
    halfWall(ctx, S * 0.6, S * 0.7, 0.15, S * 0.5, 1.0);
  } else if (variant === 1) {
    halfWall(ctx, S * 0.3, S * 0.5, 0.15, S * 0.7, 1.0);
    halfWall(ctx, S * 0.7, S * 0.5, 0.15, S * 0.7, 1.0);
  } else {
    halfWall(ctx, S * 0.5, S * 0.35, 0.15, S * 0.6, 1.0);
    halfWall(ctx, S * 0.5, S * 0.65, 0.15, S * 0.6, 1.0);
  }
  // A short pillar too, to break sightlines
  if (hash01(cx, cz, 20) < 0.5) pillar(ctx, S * 0.5, S * 0.5, 0.3, H * 0.7);
}

// CLOSED ROOM: very rare (0 open). Add a "light shaft" pillar
// in the middle so it doesn't feel totally empty.
export function closedRoom(ctx) {
  const { cx, cz, S, H } = ctx;
  pillar(ctx, S * 0.5, S * 0.5, 0.5);
  // Maybe a half-wall for visual interest
  if (hash01(cx, cz, 21) < 0.5) {
    halfWall(ctx, S * 0.3, S * 0.5, 0.15, S * 0.4, 1.0);
  }
}

// ============================================================
// Archetype selection
// Given edges (which are open), pick an archetype function.
// Uses deterministic hash for variety.
// ============================================================

export function pickArchetype(cx, cz, edges) {
  const openCount =
    (edges.north ? 1 : 0) +
    (edges.south ? 1 : 0) +
    (edges.east ? 1 : 0) +
    (edges.west ? 1 : 0);

  // Determine if open edges are opposite or adjacent (for 2-open case)
  const oppositePair =
    (edges.north && edges.south && !edges.east && !edges.west) ||
    (edges.east && edges.west && !edges.north && !edges.south);

  // Weighted list of candidate archetypes for this config
  let candidates; // array of [weight, fn]

  switch (openCount) {
    case 4:
      // Open room family — hash picks a variant
      candidates = [
        [30, crossJunction],
        [20, openRoom],
        [12, pillarRoom],
        [10, dividerRoom],
        [8,  halfWallRoom],
      ];
      break;
    case 3:
      candidates = [
        [70, tJunction],
        [20, halfWallRoom],
        [10, nicheRoom],
      ];
      break;
    case 2:
      if (oppositePair) {
        candidates = [
          [70, hallway],
          [15, halfWallRoom],
          [10, nicheRoom],
          [5,  crawlspaceRoom],
        ];
      } else {
        candidates = [
          [60, corner],
          [20, halfWallRoom],
          [15, nicheRoom],
          [5,  crawlspaceRoom],
        ];
      }
      break;
    case 1:
      candidates = [
        [55, deadEnd],
        [25, nicheRoom],
        [15, halfWallRoom],
        [5,  crawlspaceRoom],
      ];
      break;
    case 0:
    default:
      candidates = [
        [70, closedRoom],
        [30, nicheRoom],
      ];
      break;
  }

  // Weighted pick using hash
  let total = 0;
  for (const c of candidates) total += c[0];
  let r = hash01(cx, cz, 99) * total;
  for (const c of candidates) {
    r -= c[0];
    if (r <= 0) return c[1];
  }
  return candidates[0][1];
}
