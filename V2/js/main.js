// ============================================================
// main.js — entry point
// Boots the Game once the DOM is ready. Lightweight.
// ============================================================

import { Game } from './Game.js';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('canvas');
  if (!canvas) {
    console.error('Canvas element not found');
    return;
  }

  let game;
  try {
    game = new Game(canvas);
    window.__game = game; // expose for debugging
  } catch (e) {
    console.error('Failed to initialize game:', e);
    document.body.innerHTML = '<div style="color:#d8c884;padding:20px;font-family:monospace">Failed to initialize. Your browser may not support WebGL.<br><br>' + (e && e.message ? e.message : '') + '</div>';
    return;
  }

  // Pause when tab is hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && game._running) {
      game.pause();
    }
  });
});
