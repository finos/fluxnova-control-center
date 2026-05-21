import { beforeEach, describe, expect, it } from 'vitest';
import { AnimationState } from './animation-state';

describe('AnimationState', () => {
  let state: AnimationState;

  beforeEach(() => {
    state = new AnimationState();
  });

  it('should open correctly', () => {
    state.isOpen = true;
    expect(state.isOpen).toBe(true);
    expect(state.isVisible).toBe(true);
    expect(state.isClosing).toBe(false);
  });

  it('should start closing when set to false while visible', () => {
    state.isOpen = true;

    state.isOpen = false;
    expect(state.isOpen).toBe(false);
    expect(state.isClosing).toBe(true);
  });

  describe('toggle', () => {
    it('should toggle from closed to open', () => {
      state.toggle();
      expect(state.isOpen).toBe(true);
      expect(state.isVisible).toBe(true);
    });

    it('should toggle from open to closing', () => {
      state.isOpen = true;
      state.toggle();
      expect(state.isOpen).toBe(false);
      expect(state.isClosing).toBe(true);
    });
  });

  describe('onAnimationEnd', () => {
    it('should finalize closing state', () => {
      state.isOpen = true; // Needs to open first
      state.isOpen = false;

      expect(state.isClosing).toBe(true);
      expect(state.isVisible).toBe(true);

      state.onAnimationEnd();

      expect(state.isVisible).toBe(false);
      expect(state.isClosing).toBe(false);
      expect(state.isOpen).toBe(false);
    });

    it('should do nothing if not closing', () => {
      state.isOpen = true;
      state.onAnimationEnd();

      expect(state.isVisible).toBe(true);
      expect(state.isOpen).toBe(true);
    });
  });
});
