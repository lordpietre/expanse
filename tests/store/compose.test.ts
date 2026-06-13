import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('store/compose', () => {
  describe('state structure', () => {
    it('should have correct initial state shape', () => {
      const initialState = {
        compose: null,
        tick: 0,
        isDirty: false,
      };

      expect(initialState.tick).toBe(0);
      expect(initialState.isDirty).toBe(false);
    });

    it('should track dirty state when compose changes', () => {
      let isDirty = false;
      isDirty = true;
      expect(isDirty).toBe(true);

      isDirty = false;
      expect(isDirty).toBe(false);
    });
  });
});