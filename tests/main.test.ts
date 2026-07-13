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
  default: vi.fn(function () {
    this.fetchRemoteLinks = vi.fn().mockResolvedValue(undefined);
  }),
}));

vi.mock('SyrinscapeSettingsTab', () => ({
  SyrinscapeSettingsTab: vi.fn(),
}));

import SyrinscapePlugin, { DEFAULT_SETTINGS } from '../src/main';

describe('SyrinscapePlugin', () => {
  let plugin: SyrinscapePlugin;

  beforeEach(() => {
    setDebug(false);
    document.body.innerHTML = '';
    plugin = new SyrinscapePlugin();
    plugin.settings = { ...DEFAULT_SETTINGS };
    plugin.saveData = vi.fn().mockResolvedValue(undefined);
    plugin.loadData = vi.fn().mockResolvedValue({});
  });

  describe('DEFAULT_SETTINGS', () => {
    it('has correct default values', () => {
      expect(DEFAULT_SETTINGS.authToken).toBe('');
      expect(DEFAULT_SETTINGS.triggerWord).toBe('syrinscape');
      expect(DEFAULT_SETTINGS.csvContent).toBe('');
      expect(DEFAULT_SETTINGS.lastUpdated).toBeNull();
      expect(DEFAULT_SETTINGS.maxCacheAge).toBe(7);
      expect(DEFAULT_SETTINGS.debug).toBe(false);
      expect(DEFAULT_SETTINGS.lastVolume).toBe('50');
    });
  });

  describe('parseSoundString', () => {
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

    it('rejects non-numeric ids', () => {
      expect(plugin.parseSoundString('syrinscape:mood:abc:Title')).toBeNull();
    });

    it('handles title with colons', () => {
      const result = plugin.parseSoundString('syrinscape:mood:1:Title:With:Colons');
      expect(result).not.toBeNull();
      expect(result!.title).toBe('Title:With:Colons');
    });

    it('rejects uppercase type because SyrinscapeSound validates lowercase', () => {
      expect(() => plugin.parseSoundString('syrinscape:MOOD:50:Loud')).toThrow();
    });
  });

  describe('clearCache', () => {
    it('clears csvContent and lastUpdated', () => {
      plugin.settings.csvContent = 'some,data';
      plugin.settings.lastUpdated = new Date();
      plugin.clearCache();
      expect(plugin.settings.csvContent).toBe('');
      expect(plugin.settings.lastUpdated).toBeNull();
    });

    it('calls saveSettings', () => {
      plugin.saveSettings = vi.fn();
      plugin.clearCache();
      expect(plugin.saveSettings).toHaveBeenCalled();
    });
  });

  describe('checkForExpiredData', () => {
    it('does nothing when lastUpdated is null', async () => {
      plugin.settings.lastUpdated = null;
      plugin.settings.csvContent = 'data';
      await plugin.checkForExpiredData();
      expect(plugin.settings.csvContent).toBe('data');
    });

    it('clears cache when data is older than maxCacheAge', async () => {
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
      plugin.settings.lastUpdated = tenDaysAgo;
      plugin.settings.maxCacheAge = 7;
      plugin.settings.csvContent = 'old data';

      await plugin.checkForExpiredData();
      expect(plugin.settings.csvContent).toBe('');
      expect(plugin.settings.lastUpdated).toBeNull();
    });

    it('keeps cache when data is within maxCacheAge', async () => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      plugin.settings.lastUpdated = twoDaysAgo;
      plugin.settings.maxCacheAge = 7;
      plugin.settings.csvContent = 'fresh data';

      await plugin.checkForExpiredData();
      expect(plugin.settings.csvContent).toBe('fresh data');
    });
  });

  describe('loadSettings', () => {
    it('merges loaded data with defaults', async () => {
      plugin.loadData = vi.fn().mockResolvedValue({ authToken: 'my-token', debug: true });
      await plugin.loadSettings();
      expect(plugin.settings.authToken).toBe('my-token');
      expect(plugin.settings.debug).toBe(true);
      expect(plugin.settings.triggerWord).toBe('syrinscape');
    });

    it('handles null lastUpdated', async () => {
      plugin.loadData = vi.fn().mockResolvedValue({ lastUpdated: null });
      await plugin.loadSettings();
      expect(plugin.settings.lastUpdated).toBeNull();
    });

    it('converts lastUpdated string to Date', async () => {
      const dateStr = '2024-01-15T00:00:00.000Z';
      plugin.loadData = vi.fn().mockResolvedValue({ lastUpdated: dateStr });
      await plugin.loadSettings();
      expect(plugin.settings.lastUpdated).toBeInstanceOf(Date);
    });
  });

  describe('saveSettings', () => {
    it('calls saveData with current settings', async () => {
      await plugin.saveSettings();
      expect(plugin.saveData).toHaveBeenCalledWith(plugin.settings);
    });
  });

  describe('markdownPostProcessor', () => {
    it('processes code blocks with syrinscape syntax', async () => {
      const element = document.createElement('div');
      element.innerHTML = '<code>syrinscape:mood:123:Battle</code>';
      const context = { addChild: vi.fn() };

      await plugin.markdownPostProcessor(element, context as unknown as never);
      expect(context.addChild).toHaveBeenCalled();
    });

    it('ignores code blocks without syrinscape syntax', async () => {
      const element = document.createElement('div');
      element.innerHTML = '<code>const x = 1;</code>';
      const context = { addChild: vi.fn() };

      await plugin.markdownPostProcessor(element, context as unknown as never);
      expect(context.addChild).not.toHaveBeenCalled();
    });

    it('does nothing when no code blocks exist', async () => {
      const element = document.createElement('div');
      element.innerHTML = '<p>No code here</p>';
      const context = { addChild: vi.fn() };

      await plugin.markdownPostProcessor(element, context as unknown as never);
      expect(context.addChild).not.toHaveBeenCalled();
    });

    it('handles empty code blocks', async () => {
      const element = document.createElement('div');
      element.innerHTML = '<code></code>';
      const context = { addChild: vi.fn() };

      await plugin.markdownPostProcessor(element, context as unknown as never);
      expect(context.addChild).not.toHaveBeenCalled();
    });

    it('processes multiple code blocks', async () => {
      const element = document.createElement('div');
      element.innerHTML = '<code>syrinscape:mood:1:A</code><code>syrinscape:oneshot:2:B</code>';
      const context = { addChild: vi.fn() };

      await plugin.markdownPostProcessor(element, context as unknown as never);
      expect(context.addChild).toHaveBeenCalledTimes(2);
    });
  });

  describe('onload', () => {
    it('registers all plugin components', async () => {
      await plugin.onload();

      expect(plugin.addSettingTab).toHaveBeenCalled();
      expect(plugin.registerMarkdownPostProcessor).toHaveBeenCalled();
      expect(plugin.registerView).toHaveBeenCalled();
      expect(plugin.addRibbonIcon).toHaveBeenCalledWith('speaker', 'Open Syrinscape Player', expect.any(Function));
      expect(plugin.registerEditorExtension).toHaveBeenCalled();
      expect(plugin.registerEditorSuggest).toHaveBeenCalled();
    });

    it('triggers parse-style-settings on workspace', async () => {
      await plugin.onload();
      expect(plugin.app.workspace.trigger).toHaveBeenCalledWith('parse-style-settings');
    });

    it('sets up editor suggest on layout ready', async () => {
      await plugin.onload();
      expect(plugin.editorSuggest).not.toBeNull();
    });

    it('ribbon icon callback calls activateView', async () => {
      await plugin.onload();
      const ribbonCallback = (plugin.addRibbonIcon as ReturnType<typeof vi.fn>).mock.calls[0][2];
      const spy = vi.spyOn(plugin, 'activateView').mockResolvedValue(undefined);
      ribbonCallback();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('activateView', () => {
    it('does not throw when no leaves exist', async () => {
      await expect(plugin.activateView()).resolves.not.toThrow();
    });

    it('uses existing leaf when one exists', async () => {
      const mockLeaf = { view: {} };
      (plugin.app.workspace as Record<string, unknown>).getLeavesOfType = vi.fn(() => [mockLeaf]);
      await expect(plugin.activateView()).resolves.not.toThrow();
    });

    it('creates new leaf when none exist and right leaf is available', async () => {
      const mockLeaf = { setViewState: vi.fn().mockResolvedValue(undefined) };
      (plugin.app.workspace as Record<string, unknown>).getLeavesOfType = vi.fn(() => []);
      (plugin.app.workspace as Record<string, unknown>).getRightLeaf = vi.fn(() => mockLeaf);
      (plugin.app.workspace as Record<string, unknown>).revealLeaf = vi.fn();
      await plugin.activateView();
      expect(mockLeaf.setViewState).toHaveBeenCalledWith({ type: 'syrinscape-player', active: true });
    });
  });

});
