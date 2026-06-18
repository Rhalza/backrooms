// ============================================================
// player/Controls.js
// Unified input: desktop pointer-lock + keyboard, mobile touch.
// Exposes a single input state object that Movement.js reads:
//   move: {x: -1..1, y: -1..1}  (y is forward axis)
//   look: {dx, dy}              (delta since last consume)
//   sprint: bool
//   crouch: bool
//   paused: bool
// ============================================================

export class Controls {
  constructor(domElement, settings) {
    this.dom = domElement;
    this.settings = settings;

    this.state = {
      move: { x: 0, y: 0 },
      look: { dx: 0, dy: 0 },
      sprint: false,
      crouch: false,
      paused: true,
      pointerLocked: false,
    };

    this._keys = new Set();
    this._lookTouchId = null;
    this._lookLast = { x: 0, y: 0 };
    this._moveTouchId = null;
    this._joystick = { baseX: 0, baseY: 0, knobEl: null, baseEl: null };
    this._onPointerLockChange = this._onPointerLockChange.bind(this);
    this._onMouseMove = this._onMouseMove.bind(this);
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
    this._onTouchStart = this._onTouchStart.bind(this);
    this._onTouchMove = this._onTouchMove.bind(this);
    this._onTouchEnd = this._onTouchEnd.bind(this);

    this._bind();
    this._detectMobile();
  }

  _detectMobile() {
    const isTouch = ('ontouchstart' in window) ||
                    navigator.maxTouchPoints > 0;
    this.isMobile = isTouch && /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    // Treat touch-only devices as mobile for control purposes
    this.isMobile = isTouch;
  }

  _bind() {
    document.addEventListener('pointerlockchange', this._onPointerLockChange);
    document.addEventListener('mousemove', this._onMouseMove);
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);

    // Touch handlers — bound to the dom element (canvas) and to specific
    // control areas configured later via setMobileElements.
    this.dom.addEventListener('touchstart', this._onTouchStart, { passive: false });
    this.dom.addEventListener('touchmove', this._onTouchMove, { passive: false });
    this.dom.addEventListener('touchend', this._onTouchEnd, { passive: false });
    this.dom.addEventListener('touchcancel', this._onTouchEnd, { passive: false });
  }

  setMobileElements({ lookArea, joystickBase, joystickKnob, sprintBtn, crouchBtn }) {
    this._lookArea = lookArea;
    this._joystick.baseEl = joystickBase;
    this._joystick.knobEl = joystickKnob;

    if (sprintBtn) {
      const onSprint = (e) => { e.preventDefault(); this.state.sprint = true; sprintBtn.classList.add('pressed'); };
      const offSprint = (e) => { e.preventDefault(); this.state.sprint = false; sprintBtn.classList.remove('pressed'); };
      sprintBtn.addEventListener('touchstart', onSprint, { passive: false });
      sprintBtn.addEventListener('touchend', offSprint, { passive: false });
      sprintBtn.addEventListener('touchcancel', offSprint, { passive: false });
    }
    if (crouchBtn) {
      const onCrouch = (e) => { e.preventDefault(); this.state.crouch = true; crouchBtn.classList.add('pressed'); };
      const offCrouch = (e) => { e.preventDefault(); this.state.crouch = false; crouchBtn.classList.remove('pressed'); };
      crouchBtn.addEventListener('touchstart', onCrouch, { passive: false });
      crouchBtn.addEventListener('touchend', offCrouch, { passive: false });
      crouchBtn.addEventListener('touchcancel', offCrouch, { passive: false });
    }
  }

  requestPointerLock() {
    if (!this.isMobile && this.dom.requestPointerLock) {
      this.dom.requestPointerLock();
    }
  }

  exitPointerLock() {
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  }

  setPaused(p) {
    this.state.paused = p;
    if (p) {
      this.state.move.x = 0; this.state.move.y = 0;
      this._keys.clear();
      this._updateKeyboardMove();
    }
  }

  // Consume accumulated look delta (returns and resets)
  consumeLook() {
    const dx = this.state.look.dx, dy = this.state.look.dy;
    this.state.look.dx = 0; this.state.look.dy = 0;
    return { dx, dy };
  }

  // ---- Pointer lock ----
  _onPointerLockChange() {
    this.state.pointerLocked = (document.pointerLockElement === this.dom);
    if (!this.state.pointerLocked && !this.isMobile) {
      // Lost lock while playing = pause
      if (!this.state.paused) {
        this.state.paused = true;
        this._emitPause();
      }
    }
  }

  _emitPause() {
    if (this.onPause) this.onPause();
  }

  // ---- Mouse look (only when locked) ----
  _onMouseMove(e) {
    if (this.isMobile) return;
    if (!this.state.pointerLocked) return;
    const s = this.settings.sensitivity || 0.5;
    this.state.look.dx += e.movementX * s * 0.0022;
    this.state.look.dy += e.movementY * s * 0.0022;
  }

  // ---- Keyboard ----
  _onKeyDown(e) {
    if (this.state.paused) return;
    const k = e.key.toLowerCase();
    this._keys.add(k);
    if (k === 'shift') this.state.sprint = true;
    if (k === 'control' || k === 'c') this.state.crouch = true;
    this._updateKeyboardMove();
  }

  _onKeyUp(e) {
    const k = e.key.toLowerCase();
    this._keys.delete(k);
    if (k === 'shift') this.state.sprint = false;
    if (k === 'control' || k === 'c') this.state.crouch = false;
    this._updateKeyboardMove();
  }

  _updateKeyboardMove() {
    let x = 0, y = 0;
    if (this._keys.has('w') || this._keys.has('arrowup'))    y += 1;
    if (this._keys.has('s') || this._keys.has('arrowdown'))  y -= 1;
    if (this._keys.has('a') || this._keys.has('arrowleft'))  x -= 1;
    if (this._keys.has('d') || this._keys.has('arrowright')) x += 1;
    // Normalize diagonal
    if (x !== 0 && y !== 0) {
      const inv = 1 / Math.SQRT2;
      x *= inv; y *= inv;
    }
    this.state.move.x = x;
    this.state.move.y = y;
  }

  // ---- Touch ----
  // Touches flow:
  //   - touch on joystick visual (bottom-left) → movement joystick
  //   - touch on action button (captured by button) → sprint/crouch
  //   - any other touch → camera look
  // The visual elements (#joystick-base, #look-area) have pointer-events: none
  // so touches pass through to the canvas, which has the touch handler.
  _onTouchStart(e) {
    e.preventDefault();
    for (const t of e.changedTouches) {
      // Joystick: only if no current move touch and touch is in joystick rect
      if (this._moveTouchId === null && this._joystick.baseEl && this._isInElement(t, this._joystick.baseEl)) {
        this._moveTouchId = t.identifier;
        const rect = this._joystick.baseEl.getBoundingClientRect();
        this._joystick.baseX = rect.left + rect.width * 0.5;
        this._joystick.baseY = rect.top + rect.height * 0.5;
        this._updateJoystick(t.clientX, t.clientY);
      }
      // Look: any other touch (not on a button — those are captured separately)
      else if (this._lookTouchId === null) {
        this._lookTouchId = t.identifier;
        this._lookLast.x = t.clientX;
        this._lookLast.y = t.clientY;
      }
    }
  }

  _onTouchMove(e) {
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (t.identifier === this._lookTouchId) {
        const dx = t.clientX - this._lookLast.x;
        const dy = t.clientY - this._lookLast.y;
        this._lookLast.x = t.clientX;
        this._lookLast.y = t.clientY;
        const s = (this.settings.sensitivity || 0.5) * 1.4;
        this.state.look.dx += dx * s * 0.005;
        this.state.look.dy += dy * s * 0.005;
      } else if (t.identifier === this._moveTouchId) {
        this._updateJoystick(t.clientX, t.clientY);
      }
    }
  }

  _onTouchEnd(e) {
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (t.identifier === this._lookTouchId) {
        this._lookTouchId = null;
      } else if (t.identifier === this._moveTouchId) {
        this._moveTouchId = null;
        this.state.move.x = 0; this.state.move.y = 0;
        if (this._joystick.knobEl) {
          this._joystick.knobEl.style.transform = 'translate(-50%, -50%)';
          this._joystick.knobEl.classList.remove('active');
        }
      }
    }
  }

  _updateJoystick(tx, ty) {
    const j = this._joystick;
    const dx = tx - j.baseX;
    const dy = ty - j.baseY;
    const maxR = 50; // max knob travel
    const len = Math.hypot(dx, dy);
    let nx = dx, ny = dy;
    if (len > maxR) { nx = dx / len * maxR; ny = dy / len * maxR; }
    if (j.knobEl) {
      j.knobEl.style.transform = `translate(calc(-50% + ${nx}px), calc(-50% + ${ny}px))`;
      j.knobEl.classList.add('active');
    }
    // Normalize to [-1, 1] — y inverted (up = forward)
    this.state.move.x = nx / maxR;
    this.state.move.y = -ny / maxR;
  }

  _isInElement(t, el) {
    const r = el.getBoundingClientRect();
    return t.clientX >= r.left && t.clientX <= r.right &&
           t.clientY >= r.top  && t.clientY <= r.bottom;
  }

  dispose() {
    document.removeEventListener('pointerlockchange', this._onPointerLockChange);
    document.removeEventListener('mousemove', this._onMouseMove);
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    this.dom.removeEventListener('touchstart', this._onTouchStart);
    this.dom.removeEventListener('touchmove', this._onTouchMove);
    this.dom.removeEventListener('touchend', this._onTouchEnd);
    this.dom.removeEventListener('touchcancel', this._onTouchEnd);
  }
}
