// ============================================================
// ui/Menu.js
// Start menu + pause overlay. Manages transitions between
// menu / settings / playing states.
// ============================================================

export class Menu {
  constructor(rootEl, { onStart, onSettings, onBack, onResume }) {
    // rootEl is the parent that contains both #menu and #settings
    // (typically #game-container). Buttons live inside their respective
    // panels, so we query the whole document for them.
    this.rootEl = rootEl;
    this.elMenu = document.querySelector('#menu');
    this.elSettings = document.querySelector('#settings');
    this.elStart = document.querySelector('#btn-start');
    this.elSettingsBtn = document.querySelector('#btn-settings');
    this.elBack = document.querySelector('#btn-back');
    this.elHint = document.querySelector('#menu-hint');

    this._onStart = onStart;
    this._onSettings = onSettings;
    this._onBack = onBack;
    this._onResume = onResume;

    if (this.elStart) this.elStart.addEventListener('click', () => {
      this.hideMenu();
      if (this._onStart) this._onStart();
    });
    if (this.elSettingsBtn) this.elSettingsBtn.addEventListener('click', () => {
      this.hideMenu();
      this.showSettings();
      if (this._onSettings) this._onSettings();
    });
    if (this.elBack) this.elBack.addEventListener('click', () => {
      this.hideSettings();
      this.showMenu();
      if (this._onBack) this._onBack();
    });
  }

  showMenu() { this.elMenu.classList.remove('hidden'); }
  hideMenu() { this.elMenu.classList.add('hidden'); }
  showSettings() { this.elSettings.classList.remove('hidden'); }
  hideSettings() { this.elSettings.classList.add('hidden'); }

  setHint(text) {
    if (this.elHint) this.elHint.innerHTML = text;
  }
}
