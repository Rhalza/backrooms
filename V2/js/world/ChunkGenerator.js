// ============================================================
// world/ChunkGenerator.js
// Deterministic chunk generation. Same (cx, cz) always produces
// the same edges, archetype, and final geometry.
//
// Edge states are shared between neighbors:
//   east(cx, cz)  = west(cx+1, cz)   → derived from hash('E', cx, cz)
//   south(cx, cz) = north(cx, cz+1)  → derived from hash('S', cx, cz)
// This guarantees seamless chunk boundaries.
// ============================================================

import { hash01 } from '../utils/Hash.js';
import { Chunk } from './Chunk.js';
import { pickArchetype } from './Archetypes.js';

// Probability that a given shared edge is open.
// Higher = more open / connected; lower = more walls.
const EDGE_OPEN_PROB = 0.72;

export class ChunkGenerator {
  constructor(material) {
    this.material = material;
  }

  // Compute the 4 edge states for a chunk
  edgesFor(cx, cz) {
    return {
      east:  hash01(cx, cz, 1) < EDGE_OPEN_PROB,        // shared with (cx+1, cz)
      west:  hash01(cx - 1, cz, 1) < EDGE_OPEN_PROB,    // shared with (cx-1, cz)
      south: hash01(cx, cz, 2) < EDGE_OPEN_PROB,        // shared with (cx, cz+1)
      north: hash01(cx, cz - 1, 2) < EDGE_OPEN_PROB,    // shared with (cx, cz-1)
    };
  }

  // Build a chunk for the given coords. Returns a built Chunk
  // (geometry + aabb ready, mesh created).
  generate(cx, cz) {
    const chunk = new Chunk(cx, cz);
    const edges = this.edgesFor(cx, cz);
    chunk.setEdges(edges);

    // Ensure at least 1 open edge — if all closed, force one open
    // (rare, but prevents unreachable sealed rooms)
    let anyOpen = edges.north || edges.south || edges.east || edges.west;
    if (!anyOpen) {
      // Deterministically pick one to open
      const pick = Math.floor(hash01(cx, cz, 7) * 4);
      if (pick === 0) edges.north = true;
      else if (pick === 1) edges.south = true;
      else if (pick === 2) edges.east = true;
      else edges.west = true;
      chunk.setEdges(edges);
    }

    const archetypeFn = pickArchetype(cx, cz, edges);
    chunk.build(archetypeFn, this.material);
    return chunk;
  }
}
