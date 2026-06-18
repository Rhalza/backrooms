// ============================================================
// utils/Hash.js
// Deterministic hash functions for chunk generation.
// Same inputs always produce same outputs — no Math.random()
// anywhere in the world generation pipeline.
// ============================================================

// FNV-1a 32-bit hash for an integer tuple.
export function hash2i(x, z, salt = 0) {
  let h = 0x811c9dc5 >>> 0;
  const mix = (v) => {
    v = v | 0;
    h = (h ^ (v & 0xff)) >>> 0;
    h = Math.imul(h, 0x01000193) >>> 0;
    h = (h ^ ((v >>> 8) & 0xff)) >>> 0;
    h = Math.imul(h, 0x01000193) >>> 0;
    h = (h ^ ((v >>> 16) & 0xff)) >>> 0;
    h = Math.imul(h, 0x01000193) >>> 0;
    h = (h ^ ((v >>> 24) & 0xff)) >>> 0;
    h = Math.imul(h, 0x01000193) >>> 0;
  };
  mix(x);
  mix(z);
  mix(salt);
  return h >>> 0;
}

// Returns a float in [0, 1)
export function hash01(x, z, salt = 0) {
  return hash2i(x, z, salt) / 4294967296;
}

// Returns a float in [min, max)
export function hashRange(x, z, salt, min, max) {
  return min + hash01(x, z, salt) * (max - min);
}

// Returns an integer in [min, max)
export function hashInt(x, z, salt, min, max) {
  return min + Math.floor(hash01(x, z, salt) * (max - min));
}

// Pick from an array
export function hashPick(x, z, salt, arr) {
  return arr[hashInt(x, z, salt, 0, arr.length)];
}

// Weighted pick: weights is array of numbers, returns index
export function hashWeighted(x, z, salt, weights) {
  let total = 0;
  for (let i = 0; i < weights.length; i++) total += weights[i];
  let r = hash01(x, z, salt) * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return weights.length - 1;
}

// 2D value noise — smooth interpolated noise in [0,1]
// Used for carpet stains, lighting variation, etc.
const _noiseCache = new Map();
function _noiseAt(ix, iz, salt) {
  const key = ix * 73856093 + iz * 19349663 + salt * 83492791;
  if (_noiseCache.has(key)) return _noiseCache.get(key);
  const v = hash01(ix, iz, salt);
  _noiseCache.set(key, v);
  return v;
}

function _smooth(t) { return t * t * (3 - 2 * t); }

export function noise2D(x, z, salt = 0) {
  const ix = Math.floor(x), iz = Math.floor(z);
  const fx = x - ix, fz = z - iz;
  const sx = _smooth(fx), sz = _smooth(fz);
  const n00 = _noiseAt(ix, iz, salt);
  const n10 = _noiseAt(ix + 1, iz, salt);
  const n01 = _noiseAt(ix, iz + 1, salt);
  const n11 = _noiseAt(ix + 1, iz + 1, salt);
  const nx0 = n00 + (n10 - n00) * sx;
  const nx1 = n01 + (n11 - n01) * sx;
  return nx0 + (nx1 - nx0) * sz;
}
