import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setDebug } from '../src/SyrinscapeDebug';

// Mock the SyrinscapePlayerView module before importing SyrinscapeSound
vi.mock('SyrinscapePlayerView', () => ({
  isSyrinscapeAuthenticated: vi.fn(() => false),
  resetArtwork: vi.fn(),
}));

import { SyrinscapeSound } from '../src/SyrinscapeSound';

describe('SyrinscapeSound', () => {
  beforeEach(() => {
    setDebug(false);
  });

  describe('constructor', () => {
    it('creates a sound with type mood', () => {
      const sound = new SyrinscapeSound('123', 'mood', 'Battle Music');
      expect(sound.id).toBe('123');
      expect(sound.type).toBe('mood');
      expect(sound.title).toBe('Battle Music');
    });

    it('creates a sound with type sfx', () => {
      const sound = new SyrinscapeSound('456', 'sfx', 'Sword Clash');
      expect(sound.type).toBe('sfx');
    });

    it('creates a sound with type music', () => {
      const sound = new SyrinscapeSound('789', 'music', 'Tavern Song');
      expect(sound.type).toBe('music');
    });

    it('creates a sound with type oneshot', () => {
      const sound = new SyrinscapeSound('101', 'oneshot', 'Thunder');
      expect(sound.type).toBe('oneshot');
    });

    it('converts element type to oneshot', () => {
      const sound = new SyrinscapeSound('202', 'element', 'Lightning');
      expect(sound.type).toBe('oneshot');
    });

    it('throws an error for invalid type', () => {
      expect(() => new SyrinscapeSound('303', 'invalid', 'Bad Sound'))
        .toThrow('Invalid type invalid for SyrinscapeSound.');
    });

    it('throws an error for empty type', () => {
      expect(() => new SyrinscapeSound('404', '', 'No Type'))
        .toThrow('Invalid type  for SyrinscapeSound.');
    });
  });
});
