import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setDebug } from '../src/SyrinscapeDebug';

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

describe('checkForExpiredData', () => {
  let plugin: SyrinscapePlugin;

  beforeEach(() => {
    setDebug(false);
    plugin = new SyrinscapePlugin();
    plugin.settings = {
      authToken: 'token',
      triggerWord: 'syrinscape',
      csvContent: 'some,csv,data',
      lastUpdated: null,
      maxCacheAge: 7,
      debug: false,
      lastVolume: '50',
    };
    plugin.saveSettings = vi.fn().mockResolvedValue(undefined);
    plugin.saveData = vi.fn().mockResolvedValue(undefined);
  });

  it('does nothing when lastUpdated is null', async () => {
    plugin.settings.lastUpdated = null;
    await plugin.checkForExpiredData();
    expect(plugin.settings.csvContent).toBe('some,csv,data');
  });

  it('clears cache when data is older than maxCacheAge', async () => {
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    plugin.settings.lastUpdated = tenDaysAgo;
    plugin.settings.maxCacheAge = 7;

    await plugin.checkForExpiredData();
    expect(plugin.settings.csvContent).toBe('');
    expect(plugin.settings.lastUpdated).toBeNull();
  });

  it('keeps cache when data is within maxCacheAge', async () => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    plugin.settings.lastUpdated = twoDaysAgo;
    plugin.settings.maxCacheAge = 7;

    await plugin.checkForExpiredData();
    expect(plugin.settings.csvContent).toBe('some,csv,data');
  });

  it('clears cache at exactly maxCacheAge + 1 days', async () => {
    const eightDaysAgo = new Date();
    eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);
    plugin.settings.lastUpdated = eightDaysAgo;
    plugin.settings.maxCacheAge = 7;

    await plugin.checkForExpiredData();
    expect(plugin.settings.csvContent).toBe('');
  });

  it('respects custom maxCacheAge', async () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    plugin.settings.lastUpdated = threeDaysAgo;
    plugin.settings.maxCacheAge = 2;

    await plugin.checkForExpiredData();
    expect(plugin.settings.csvContent).toBe('');
  });
});
