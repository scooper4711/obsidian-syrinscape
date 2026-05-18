import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setDebug } from '../src/SyrinscapeDebug';

// Mock modules that SyrinscapeSound and main.ts depend on
vi.mock('SyrinscapePlayerView', () => ({
  isSyrinscapeAuthenticated: vi.fn(() => false),
  isSyrinscapeDefined: vi.fn(() => false),
  resetArtwork: vi.fn(),
  SyrinscapePlayerView: vi.fn(),
  VIEW_TYPE: 'syrinscape-player',
}));

vi.mock('SyrinscapePlayerWidget', () => ({
  inlinePlugin: vi.fn(() => []),
}));

vi.mock('SyrinscapeRenderChild', () => ({
  SyrinscapeRenderChild: vi.fn(),
}));

vi.mock('SyrinscapeSuggest', () => ({
  default: vi.fn(),
}));

vi.mock('SyrinscapeSettingsTab', () => ({
  SyrinscapeSettingsTab: vi.fn(),
}));

import SyrinscapePlugin from '../src/main';

describe('parseSoundString', () => {
  let plugin: SyrinscapePlugin;

  beforeEach(() => {
    setDebug(false);
    plugin = new SyrinscapePlugin();
    plugin.settings = {
      authToken: '',
      triggerWord: 'syrinscape',
      csvContent: '',
      lastUpdated: null,
      maxCacheAge: 7,
      debug: false,
      lastVolume: '50',
    };
  });

  it('parses a mood sound string', () => {
    const result = plugin.parseSoundString('syrinscape:mood:12345:Epic Battle');
    expect(result).not.toBeNull();
    expect(result!.type).toBe('mood');
    expect(result!.id).toBe('12345');
    expect(result!.title).toBe('Epic Battle');
  });

  it('parses a oneshot sound string', () => {
    const result = plugin.parseSoundString('syrinscape:oneshot:999:Thunder Clap');
    expect(result).not.toBeNull();
    expect(result!.type).toBe('oneshot');
    expect(result!.id).toBe('999');
    expect(result!.title).toBe('Thunder Clap');
  });

  it('parses an sfx sound string', () => {
    const result = plugin.parseSoundString('syrinscape:sfx:555:Rain');
    expect(result).not.toBeNull();
    expect(result!.type).toBe('sfx');
    expect(result!.id).toBe('555');
  });

  it('parses a music sound string', () => {
    const result = plugin.parseSoundString('syrinscape:music:777:Tavern');
    expect(result).not.toBeNull();
    expect(result!.type).toBe('music');
    expect(result!.id).toBe('777');
  });

  it('parses an element type and converts to oneshot', () => {
    const result = plugin.parseSoundString('syrinscape:element:111:Fireball');
    expect(result).not.toBeNull();
    expect(result!.type).toBe('oneshot');
    expect(result!.id).toBe('111');
  });

  it('parses a sound string without a title', () => {
    const result = plugin.parseSoundString('syrinscape:mood:42');
    expect(result).not.toBeNull();
    expect(result!.type).toBe('mood');
    expect(result!.id).toBe('42');
    expect(result!.title).toBeUndefined();
  });

  it('returns null for non-matching strings', () => {
    expect(plugin.parseSoundString('not a sound')).toBeNull();
    expect(plugin.parseSoundString('syrinscape:invalid:123')).toBeNull();
    expect(plugin.parseSoundString('')).toBeNull();
    expect(plugin.parseSoundString('syrinscape:')).toBeNull();
  });

  it('returns null when trigger word does not match', () => {
    expect(plugin.parseSoundString('other:mood:123:Title')).toBeNull();
  });

  it('works with a custom trigger word', () => {
    plugin.settings.triggerWord = 'sscape';
    const result = plugin.parseSoundString('sscape:mood:100:Custom Trigger');
    expect(result).not.toBeNull();
    expect(result!.id).toBe('100');
  });

  it('rejects uppercase type because SyrinscapeSound validates lowercase', () => {
    // The regex is case-insensitive but SyrinscapeSound constructor only accepts lowercase types
    expect(() => plugin.parseSoundString('syrinscape:MOOD:50:Loud')).toThrow();
  });

  it('rejects non-numeric ids', () => {
    expect(plugin.parseSoundString('syrinscape:mood:abc:Title')).toBeNull();
  });

  it('handles title with colons', () => {
    const result = plugin.parseSoundString('syrinscape:mood:1:Title:With:Colons');
    expect(result).not.toBeNull();
    expect(result!.title).toBe('Title:With:Colons');
  });
});
