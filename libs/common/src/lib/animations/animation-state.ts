export class AnimationState {
  isVisible = false;
  isClosing = false;
  private _isOpen = false;

  constructor(initialState = false) {
    this._isOpen = initialState;
    this.isVisible = initialState;
    this.isClosing = false;
  }

  get isOpen() {
    return this._isOpen;
  }

  set isOpen(value: boolean) {
    if (this._isOpen === value) return;
    this._isOpen = value;

    if (value) {
      this.isVisible = true;
      this.isClosing = false;
    } else {
      this.isClosing = this.isVisible;
    }
  }

  toggle() {
    this.isOpen = !this.isOpen;
  }

  onAnimationEnd() {
    if (this.isClosing && !this.isOpen) {
      this.isVisible = false;
      this.isClosing = false;
    }
  }
}
