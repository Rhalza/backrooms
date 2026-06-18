// ============================================================
// config/Presets.js
// Quality presets + global tunable constants.
// All numbers chosen for very low-end devices baseline.
// ============================================================

export const CHUNK_SIZE = 8;          // meters per chunk side
export const WALL_HEIGHT = 3.0;       // ceiling height
export const WALL_THICKNESS = 0.15;   // wall thickness
export const OPENING_WIDTH = 3.5;     // width of doorway in an open edge
export const PLAYER_RADIUS = 0.30;
export const PLAYER_EYE = 1.65;
export const PLAYER_EYE_CROUCH = 0.95;
export const PLAYER_HEIGHT = 1.8;
export const PLAYER_HEIGHT_CROUCH = 1.1;

export const Presets = {
  low: {
    label: 'LOW',
    renderDistance: 3,        // chunks each direction
    pixelRatioCap: 0.75,
    antialias: false,
    fog: true,
    fogNear: 4,
    fogFar: 22,
    textures: true,
    stains: false,
    lightCount: 0,            // no extra point lights
    textureSize: 128,         // atlas resolution
    powerPreference: 'low-power',
    shadows: false,
    bob: true,
    maxFPS: 60,
  },
  medium: {
    label: 'MEDIUM',
    renderDistance: 4,
    pixelRatioCap: 1.0,
    antialias: false,
    fog: true,
    fogNear: 6,
    fogFar: 30,
    textures: true,
    stains: true,
    lightCount: 0,
    textureSize: 256,
    powerPreference: 'high-performance',
    shadows: false,
    bob: true,
    maxFPS: 60,
  },
  high: {
    label: 'HIGH',
    renderDistance: 6,
    pixelRatioCap: 1.5,
    antialias: true,
    fog: true,
    fogNear: 8,
    fogFar: 45,
    textures: true,
    stains: true,
    lightCount: 0,
    textureSize: 512,
    powerPreference: 'high-performance',
    shadows: false,
    bob: true,
    maxFPS: 60,
  },
};

export const DEFAULT_SETTINGS = {
  quality: 'medium',
  renderDistance: 4,        // overrides preset when set explicitly
  pixelRatio: 1.0,
  sensitivity: 0.5,
  fov: 75,
  fog: true,
  bob: true,
  textures: true,
  stains: true,
  audio: false,             // reserved for future
};

// Default movement tuning
export const MOVEMENT = {
  walkSpeed: 2.6,           // m/s
  sprintSpeed: 4.4,
  crouchSpeed: 1.2,
  accel: 9.0,               // m/s^2
  decel: 11.0,
  airControl: 0.6,
  bobAmount: 0.045,
  bobSpeed: 9.5,
  crouchTransition: 8.0,    // how fast crouch animates
};

// Merge preset with user settings
export function resolveConfig(settings) {
  const base = Presets[settings.quality] || Presets.medium;
  return {
    ...base,
    fov: settings.fov ?? 75,
    sensitivity: settings.sensitivity ?? 0.5,
    renderDistance: settings.renderDistance ?? base.renderDistance,
    pixelRatioCap: settings.pixelRatio ?? base.pixelRatioCap,
    fog: settings.fog ?? base.fog,
    bob: settings.bob ?? base.bob,
    textures: settings.textures ?? base.textures,
    stains: settings.stains ?? base.stains,
  };
}
