// ============================================================
// ui/MobileControls.js
// Shows/hides the on-screen joystick + look area + buttons.
// The actual touch handling lives in Controls.js; this just
// manages DOM visibility and wires elements to Controls.
// ============================================================

export class MobileControls {
  constructor(dom, controls) {
    this.dom = dom;
    this.controls = controls;

    this.joystickBase = dom.querySelector('#joystick-base');
    this.joystickKnob = dom.querySelector('#joystick-knob');
    this.lookArea = dom.querySelector('#look-area');
    this.sprintBtn = dom.querySelector('#btn-sprint');
    this.crouchBtn = dom.querySelector('#btn-crouch');

    // Wire elements to Controls
    controls.setMobileElements({
      lookArea: this.lookArea,
      joystickBase: this.joystickBase,
      joystickKnob: this.joystickKnob,
      sprintBtn: this.sprintBtn,
      crouchBtn: this.crouchBtn,
    });
  }

  show() { this.dom.classList.remove('hidden'); }
  hide() { this.dom.classList.add('hidden'); }
}
