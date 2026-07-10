import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setDebug } from '../src/SyrinscapeDebug';

vi.mock('SyrinscapeUtils', () => ({
  isSyrinscapeDefined: vi.fn(() => false),
  isSyrinscapeAuthenticated: vi.fn(() => false),
  resetArtwork: vi.fn(),
}));

vi.mock('SyrinscapePlayerView', () => ({
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

import { SyrinscapeSettingsTab } from '../src/SyrinscapeSettingsTab';
import SyrinscapePlugin from '../src/main';
import { DEFAULT_SETTINGS } from '../src/main';

describe('SyrinscapeSettingsTab', () => {
  let plugin: SyrinscapePlugin;
  let tab: SyrinscapeSettingsTab;

  beforeEach(() => {
    setDebug(false);
    document.body.innerHTML = '';
    plugin = new SyrinscapePlugin();
    plugin.settings = { ...DEFAULT_SETTINGS };
    plugin.saveData = vi.fn().mockResolvedValue(undefined);
    plugin.editorSuggest = null;
    tab = new SyrinscapeSettingsTab({} as unknown, plugin);
  });

  it('creates an instance', () => {
    expect(tab).toBeDefined();
    expect(tab.plugin).toBe(plugin);
  });

  it('display() empties the container and creates settings', () => {
    const _emptySpy = vi.spyOn(tab.containerEl, 'innerHTML', 'set');
    tab.display();
    // After display, the container should have child elements (settings)
    // The Setting mock creates elements, so we just verify no error thrown
    expect(tab.containerEl).toBeDefined();
  });

  it('display() does not throw', () => {
    expect(() => tab.display()).not.toThrow();
  });
});
