// ============================================================
// world/Materials.js
// Procedural texture atlas — generated once on a canvas, then
// used by all chunk meshes via a single MeshLambertMaterial.
//
// Atlas layout (square):
//   +----------+----------+
//   | wallpaper| carpet   |
//   |  (0,0)   |  (.5,0)  |
//   +----------+----------+
//   | ceiling  | light    |
//   |  (0,.5)  |  (.5,.5) |
//   +----------+----------+
//
// UV regions are returned for use by WallBuilder.
// ============================================================

import * as THREE from 'three';

// Each region is [u0, v0, u1, v1]
export const UV = {
  wallpaper: [0.0,  0.0,  0.5,  0.5],
  carpet:    [0.5,  0.0,  1.0,  0.5],
  ceiling:   [0.0,  0.5,  0.5,  1.0],
  light:     [0.5,  0.5,  1.0,  1.0],
};

let _atlasTexture = null;
let _material = null;
let _currentOptions = null;

export function getAtlasTexture(size = 256, options = {}) {
  const opts = {
    stains: options.stains !== false,
    simple: options.simple === true,
  };
  // Cache: only rebuild if options changed
  if (_atlasTexture && _currentOptions &&
      _currentOptions.stains === opts.stains &&
      _currentOptions.simple === opts.simple) {
    return _atlasTexture;
  }

  // Dispose old texture if rebuilding
  if (_atlasTexture && _currentOptions) {
    _atlasTexture.dispose();
  }
  _currentOptions = opts;

  const canvas = document.createElement('canvas');
  canvas.width = size * 2;
  canvas.height = size * 2;
  const ctx = canvas.getContext('2d');

  const S = size; // half-size

  if (opts.simple) {
    // Solid-color atlas — for very low-end devices or "textures off" mode
    drawSolidWallpaper(ctx, 0, 0, S);
    drawSolidCarpet(ctx, S, 0, S);
    drawSolidCeiling(ctx, 0, S, S);
    drawLight(ctx, S, S, S);
  } else {
    drawWallpaper(ctx, 0, 0, S, opts.stains);
    drawCarpet(ctx, S, 0, S, opts.stains);
    drawCeiling(ctx, 0, S, S, opts.stains);
    drawLight(ctx, S, S, S);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipMapLinearFilter;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.generateMipmaps = true;
  tex.anisotropy = 1;
  _atlasTexture = tex;
  return tex;
}

export function getMaterial(size = 256, options = {}) {
  const tex = getAtlasTexture(size, options);
  if (!_material) {
    _material = new THREE.MeshLambertMaterial({
      map: tex,
      vertexColors: false,
    });
  } else {
    _material.map = tex;
    _material.needsUpdate = true;
  }
  return _material;
}

// Rebuild atlas when settings change (called by WorldManager)
export function rebuildAtlas(size, options) {
  // Force rebuild by clearing cache check
  _currentOptions = null;
  return getMaterial(size, options);
}

// ============================================================
// Procedural texture drawing — pure canvas 2D, no images loaded.
// ============================================================

// --- Solid-color variants for "textures off" mode ---

function drawSolidWallpaper(ctx, ox, oy, S) {
  ctx.fillStyle = '#b9a060';
  ctx.fillRect(ox, oy, S, S);
}

function drawSolidCarpet(ctx, ox, oy, S) {
  ctx.fillStyle = '#5d4d28';
  ctx.fillRect(ox, oy, S, S);
}

function drawSolidCeiling(ctx, ox, oy, S) {
  ctx.fillStyle = '#c8c0a0';
  ctx.fillRect(ox, oy, S, S);
  // Minimal grid lines so player can perceive scale
  ctx.strokeStyle = 'rgba(40, 35, 20, 0.25)';
  ctx.lineWidth = 1;
  for (let i = 1; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(ox + i * S / 4, oy); ctx.lineTo(ox + i * S / 4, oy + S);
    ctx.moveTo(ox, oy + i * S / 4); ctx.lineTo(ox + S, oy + i * S / 4);
    ctx.stroke();
  }
}

// --- Detailed textured variants ---

function drawWallpaper(ctx, ox, oy, S, stains = true) {
  const grad = ctx.createLinearGradient(ox, oy, ox, oy + S);
  grad.addColorStop(0, '#cdb878');
  grad.addColorStop(1, '#b9a060');
  ctx.fillStyle = grad;
  ctx.fillRect(ox, oy, S, S);

  // Vertical wallpaper stripes
  ctx.fillStyle = 'rgba(120, 100, 50, 0.18)';
  const stripeW = S / 16;
  for (let i = 0; i < 16; i += 2) {
    ctx.fillRect(ox + i * stripeW, oy, stripeW, S);
  }

  // Subtle horizontal banding
  ctx.fillStyle = 'rgba(60, 45, 15, 0.10)';
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(ox, oy + (S / 4) * i, S, 1);
  }

  if (stains) {
    // Stains — darker blotches
    for (let i = 0; i < 18; i++) {
      const x = ox + Math.random() * S;
      const y = oy + Math.random() * S;
      const r = 4 + Math.random() * 14;
      const a = 0.05 + Math.random() * 0.18;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(60, 40, 10, ${a})`);
      g.addColorStop(1, 'rgba(60, 40, 10, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // A few faint scratches
    ctx.strokeStyle = 'rgba(40, 30, 10, 0.15)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      const x0 = ox + Math.random() * S, y0 = oy + Math.random() * S;
      ctx.moveTo(x0, y0);
      ctx.lineTo(x0 + (Math.random() - 0.5) * 20, y0 + (Math.random() - 0.5) * 20);
      ctx.stroke();
    }
  }
}

function drawCarpet(ctx, ox, oy, S, stains = true) {
  ctx.fillStyle = '#5d4d28';
  ctx.fillRect(ox, oy, S, S);

  // Speckle noise
  const img = ctx.getImageData(ox, oy, S, S);
  const data = img.data;
  for (let i = 0; i < data.length; i += 4) {
    const n = (Math.random() - 0.5) * 40;
    data[i]   = clamp(data[i]   + n * 0.8, 0, 255);
    data[i+1] = clamp(data[i+1] + n * 0.7, 0, 255);
    data[i+2] = clamp(data[i+2] + n * 0.3, 0, 255);
  }
  ctx.putImageData(img, ox, oy);

  if (stains) {
    // Larger dark blotches — water stains
    for (let i = 0; i < 6; i++) {
      const x = ox + Math.random() * S;
      const y = oy + Math.random() * S;
      const r = 10 + Math.random() * 30;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(20, 15, 5, 0.35)');
      g.addColorStop(1, 'rgba(20, 15, 5, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Faint grid suggesting worn carpet pile
  ctx.strokeStyle = 'rgba(20, 15, 5, 0.08)';
  ctx.lineWidth = 1;
  const step = S / 8;
  for (let i = 1; i < 8; i++) {
    ctx.beginPath();
    ctx.moveTo(ox + i * step, oy); ctx.lineTo(ox + i * step, oy + S);
    ctx.moveTo(ox, oy + i * step); ctx.lineTo(ox + S, oy + i * step);
    ctx.stroke();
  }
}

function drawCeiling(ctx, ox, oy, S, stains = true) {
  ctx.fillStyle = '#c8c0a0';
  ctx.fillRect(ox, oy, S, S);

  // Tile grid — 4x4 tiles, with darker gaps
  const tiles = 4;
  const ts = S / tiles;
  ctx.fillStyle = 'rgba(40, 35, 20, 0.35)';
  for (let i = 0; i <= tiles; i++) {
    ctx.fillRect(ox + i * ts - 1, oy, 2, S);
    ctx.fillRect(ox, oy + i * ts - 1, S, 2);
  }

  // Per-tile subtle variation
  for (let i = 0; i < tiles; i++) {
    for (let j = 0; j < tiles; j++) {
      const v = (Math.random() - 0.5) * 18;
      ctx.fillStyle = `rgba(${v < 0 ? 0 : 255}, ${v < 0 ? 0 : 255}, ${v < 0 ? 0 : 255}, ${Math.abs(v) / 255 * 0.3})`;
      ctx.fillRect(ox + i * ts + 2, oy + j * ts + 2, ts - 4, ts - 4);
    }
  }

  if (stains) {
    for (let i = 0; i < 5; i++) {
      const x = ox + Math.random() * S;
      const y = oy + Math.random() * S;
      const r = 5 + Math.random() * 12;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(70, 50, 20, 0.4)');
      g.addColorStop(1, 'rgba(70, 50, 20, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawLight(ctx, ox, oy, S) {
  const grad = ctx.createRadialGradient(ox + S/2, oy + S/2, 0, ox + S/2, oy + S/2, S * 0.7);
  grad.addColorStop(0, '#fffce0');
  grad.addColorStop(0.6, '#fff5c0');
  grad.addColorStop(1, '#d8c878');
  ctx.fillStyle = grad;
  ctx.fillRect(ox, oy, S, S);

  ctx.strokeStyle = 'rgba(80, 70, 30, 0.5)';
  ctx.lineWidth = 2;
  ctx.strokeRect(ox + 2, oy + 2, S - 4, S - 4);

  ctx.fillStyle = 'rgba(255, 255, 240, 0.7)';
  ctx.fillRect(ox + S * 0.1, oy + S * 0.25, S * 0.8, S * 0.08);
  ctx.fillRect(ox + S * 0.1, oy + S * 0.55, S * 0.8, S * 0.08);
}

function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }
