import { describe, it, expect, vi, beforeEach } from 'vitest';
import { debug, setDebug } from '../src/SyrinscapeDebug';

describe('SyrinscapeDebug', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('setDebug', () => {
    it('enables debug logging when set to true', () => {
      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      setDebug(true);
      debug('test message');
      expect(consoleSpy).toHaveBeenCalledWith('Syrinscape - ', 'test message');
    });

    it('disables debug logging when set to false', () => {
      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      setDebug(false);
      debug('test message');
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe('debug', () => {
    it('passes multiple arguments to console.debug', () => {
      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      setDebug(true);
      debug('arg1', 'arg2', 123);
      expect(consoleSpy).toHaveBeenCalledWith('Syrinscape - ', 'arg1', 'arg2', 123);
    });

    it('does nothing when debug is disabled', () => {
      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      setDebug(false);
      debug('should not appear');
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });
});
