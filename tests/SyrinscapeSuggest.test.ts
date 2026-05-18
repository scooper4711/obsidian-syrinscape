import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setDebug } from '../src/SyrinscapeDebug';

vi.mock('SyrinscapePlayerView', () => ({
  isSyrinscapeAuthenticated: vi.fn(() => false),
  resetArtwork: vi.fn(),
}));

vi.mock('SyrinscapePlayerWidget', () => ({
  inlinePlugin: vi.fn(() => []),
}));

vi.mock('SyrinscapeRenderChild', () => ({
  SyrinscapeRenderChild: vi.fn(),
}));

vi.mock('SyrinscapeSettingsTab', () => ({
  SyrinscapeSettingsTab: vi.fn(),
}));

import SyrinscapeSuggest from '../src/SyrinscapeSuggest';
import SyrinscapePlugin from '../src/main';

describe('SyrinscapeSuggest', () => {
  let suggest: SyrinscapeSuggest;
  let plugin: SyrinscapePlugin;

  beforeEach(() => {
    setDebug(false);
    plugin = new SyrinscapePlugin();
    plugin.settings = {
      authToken: 'test-token',
      triggerWord: 'syrinscape',
      csvContent: '',
      lastUpdated: null,
      maxCacheAge: 7,
      debug: false,
      lastVolume: '50',
    };
    plugin.saveSettings = vi.fn().mockResolvedValue(undefined);
    suggest = new SyrinscapeSuggest({} as unknown, plugin);
  });

  describe('findTriggerWordOccurrence', () => {
    it('finds trigger word before cursor', () => {
      const line = 'some text `syrinscape:mood';
      const result = suggest.findTriggerWordOccurrence(line, '`syrinscape:', 26);
      expect(result).toBe(10);
    });

    it('returns -1 when trigger word is not present', () => {
      const line = 'no trigger here';
      const result = suggest.findTriggerWordOccurrence(line, '`syrinscape:', 15);
      expect(result).toBe(-1);
    });

    it('returns -1 when trigger word is after cursor', () => {
      const line = 'text `syrinscape:mood';
      const result = suggest.findTriggerWordOccurrence(line, '`syrinscape:', 3);
      expect(result).toBe(-1);
    });

    it('finds the last occurrence when multiple exist', () => {
      const line = '`syrinscape:first `syrinscape:second';
      const result = suggest.findTriggerWordOccurrence(line, '`syrinscape:', 36);
      expect(result).toBe(18);
    });

    it('handles cursor at exact end of trigger word', () => {
      const line = '`syrinscape:';
      const result = suggest.findTriggerWordOccurrence(line, '`syrinscape:', 12);
      expect(result).toBe(0);
    });

    it('handles empty line', () => {
      const result = suggest.findTriggerWordOccurrence('', '`syrinscape:', 0);
      expect(result).toBe(-1);
    });
  });

  describe('onTrigger', () => {
    it('returns trigger info when trigger word is found', () => {
      const cursor = { line: 0, ch: 20 };
      const editor = {
        getLine: vi.fn(() => '`syrinscape:mood:123'),
      };
      const result = suggest.onTrigger(cursor, editor as never, null);
      expect(result).not.toBeNull();
      expect(result!.query).toBe('mood:123');
    });

    it('returns null when trigger word is not found', () => {
      const cursor = { line: 0, ch: 10 };
      const editor = {
        getLine: vi.fn(() => 'plain text'),
      };
      const result = suggest.onTrigger(cursor, editor as never, null);
      expect(result).toBeNull();
    });

    it('uses custom trigger word from settings', () => {
      plugin.settings.triggerWord = 'sscape';
      const cursor = { line: 0, ch: 12 };
      const editor = {
        getLine: vi.fn(() => '`sscape:mood'),
      };
      const result = suggest.onTrigger(cursor, editor as never, null);
      expect(result).not.toBeNull();
      expect(result!.query).toBe('mood');
    });
  });

  describe('getSuggestions', () => {
    beforeEach(() => {
      suggest.parseRemoteLinks(
        'id,status,subcategory,product_or_pack,soundset,name,type,sub_type,genre_players_play_url,genre_players_stop_url,online_player_play_url,online_player_stop_url\n' +
        'pk123,active,cat,pack,Battle,Sword Clash,element,oneshot,,,, \n' +
        'pk456,active,cat,pack,Tavern,Cheerful Music,mood,mood,,,, \n' +
        'pk789,active,cat,pack,Forest,Bird Song,element,sfx,,,, '
      );
    });

    it('returns all completions when query is empty', () => {
      const context = { query: '' } as unknown;
      const results = suggest.getSuggestions(context as never);
      expect(results.length).toBe(3);
    });

    it('filters by title word', () => {
      const context = { query: 'sword' } as unknown;
      const results = suggest.getSuggestions(context as never);
      expect(results.length).toBe(1);
      expect(results[0].title).toContain('Sword Clash');
    });

    it('filters by type', () => {
      const context = { query: 'mood' } as unknown;
      const results = suggest.getSuggestions(context as never);
      expect(results.length).toBe(1);
      expect(results[0].type).toBe('mood');
    });

    it('filters by multiple words (AND logic)', () => {
      const context = { query: 'bird forest' } as unknown;
      const results = suggest.getSuggestions(context as never);
      expect(results.length).toBe(1);
      expect(results[0].title).toContain('Bird Song');
    });

    it('returns empty when no match', () => {
      const context = { query: 'nonexistent' } as unknown;
      const results = suggest.getSuggestions(context as never);
      expect(results.length).toBe(0);
    });

    it('filters by id', () => {
      const context = { query: '123' } as unknown;
      const results = suggest.getSuggestions(context as never);
      expect(results.length).toBe(1);
      expect(results[0].id).toBe('123');
    });

    it('is case insensitive', () => {
      const context = { query: 'SWORD' } as unknown;
      const results = suggest.getSuggestions(context as never);
      expect(results.length).toBe(1);
    });
  });

  describe('parseRemoteLinks', () => {
    it('parses CSV content into sounds', () => {
      suggest.parseRemoteLinks(
        'id,status,subcategory,product_or_pack,soundset,name,type,sub_type,genre_players_play_url,genre_players_stop_url,online_player_play_url,online_player_stop_url\n' +
        'pk100,active,cat,pack,Dungeon,Dripping Water,element,sfx,,,, '
      );
      const context = { query: 'dripping' } as unknown;
      const results = suggest.getSuggestions(context as never);
      expect(results.length).toBe(1);
      expect(results[0].id).toBe('100');
      expect(results[0].type).toBe('sfx');
    });

    it('strips pk prefix from id', () => {
      suggest.parseRemoteLinks(
        'id,status,subcategory,product_or_pack,soundset,name,type,sub_type,genre_players_play_url,genre_players_stop_url,online_player_play_url,online_player_stop_url\n' +
        'pk999,active,cat,pack,Set,Name,element,oneshot,,,, '
      );
      const context = { query: 'name' } as unknown;
      const results = suggest.getSuggestions(context as never);
      expect(results[0].id).toBe('999');
    });

    it('uses sub_type for element type rows', () => {
      suggest.parseRemoteLinks(
        'id,status,subcategory,product_or_pack,soundset,name,type,sub_type,genre_players_play_url,genre_players_stop_url,online_player_play_url,online_player_stop_url\n' +
        'pk50,active,cat,pack,Set,Effect,element,music,,,, '
      );
      const context = { query: 'effect' } as unknown;
      const results = suggest.getSuggestions(context as never);
      expect(results[0].type).toBe('music');
    });

    it('uses type directly for mood rows', () => {
      suggest.parseRemoteLinks(
        'id,status,subcategory,product_or_pack,soundset,name,type,sub_type,genre_players_play_url,genre_players_stop_url,online_player_play_url,online_player_stop_url\n' +
        'pk60,active,cat,pack,Set,Ambient,mood,mood,,,, '
      );
      const context = { query: 'ambient' } as unknown;
      const results = suggest.getSuggestions(context as never);
      expect(results[0].type).toBe('mood');
    });

    it('handles empty CSV content', () => {
      suggest.parseRemoteLinks('');
      const context = { query: '' } as unknown;
      const results = suggest.getSuggestions(context as never);
      expect(results.length).toBe(0);
    });

    it('clears existing entries before parsing', () => {
      suggest.parseRemoteLinks(
        'id,status,subcategory,product_or_pack,soundset,name,type,sub_type,genre_players_play_url,genre_players_stop_url,online_player_play_url,online_player_stop_url\n' +
        'pk1,active,cat,pack,Set,First,mood,mood,,,, '
      );
      suggest.parseRemoteLinks(
        'id,status,subcategory,product_or_pack,soundset,name,type,sub_type,genre_players_play_url,genre_players_stop_url,online_player_play_url,online_player_stop_url\n' +
        'pk2,active,cat,pack,Set,Second,mood,mood,,,, '
      );
      const context = { query: '' } as unknown;
      const results = suggest.getSuggestions(context as never);
      expect(results.length).toBe(1);
      expect(results[0].title).toContain('Second');
    });

    it('combines name and soundset in title', () => {
      suggest.parseRemoteLinks(
        'id,status,subcategory,product_or_pack,soundset,name,type,sub_type,genre_players_play_url,genre_players_stop_url,online_player_play_url,online_player_stop_url\n' +
        'pk10,active,cat,pack,Dungeon Crawl,Drip,element,sfx,,,, '
      );
      const context = { query: '' } as unknown;
      const results = suggest.getSuggestions(context as never);
      expect(results[0].title).toBe('Drip (Dungeon Crawl)');
    });
  });

  describe('renderSuggestion', () => {
    it('creates a span with suggestion text', () => {
      suggest.parseRemoteLinks(
        'id,status,subcategory,product_or_pack,soundset,name,type,sub_type,genre_players_play_url,genre_players_stop_url,online_player_play_url,online_player_stop_url\n' +
        'pk100,active,cat,pack,Set,Thunder,element,oneshot,,,, '
      );
      const context = { query: '' } as unknown;
      const results = suggest.getSuggestions(context as never);
      const el = document.createElement('div');
      const rendered = suggest.renderSuggestion(results[0], el);
      expect(rendered.textContent).toContain('oneshot');
      expect(rendered.textContent).toContain('100');
      expect(rendered.textContent).toContain('Thunder');
      expect(rendered.classList.contains('syrinscape-suggestion')).toBe(true);
    });
  });

  describe('fetchRemoteLinks', () => {
    it('uses cached content when available', async () => {
      plugin.settings.csvContent = 'id,status,subcategory,product_or_pack,soundset,name,type,sub_type,genre_players_play_url,genre_players_stop_url,online_player_play_url,online_player_stop_url\npk1,active,cat,pack,Set,Cached,mood,mood,,,, ';
      await suggest.fetchRemoteLinks();
      const context = { query: '' } as unknown;
      const results = suggest.getSuggestions(context as never);
      expect(results.length).toBe(1);
      expect(results[0].title).toContain('Cached');
    });

    it('downloads CSV when cache is empty', async () => {
      const { requestUrl } = await import('obsidian');
      const mockRequestUrl = vi.mocked(requestUrl);
      mockRequestUrl.mockResolvedValue({
        text: 'id,status,subcategory,product_or_pack,soundset,name,type,sub_type,genre_players_play_url,genre_players_stop_url,online_player_play_url,online_player_stop_url\npk99,active,cat,pack,Set,Downloaded,mood,mood,,,, ',
      });

      plugin.settings.csvContent = '';
      await suggest.fetchRemoteLinks();
      const context = { query: '' } as unknown;
      const results = suggest.getSuggestions(context as never);
      expect(results.length).toBe(1);
      expect(results[0].title).toContain('Downloaded');
      expect(plugin.saveSettings).toHaveBeenCalled();
    });

    it('handles fetch error gracefully', async () => {
      const { requestUrl } = await import('obsidian');
      const mockRequestUrl = vi.mocked(requestUrl);
      mockRequestUrl.mockRejectedValue(new Error('Network error'));

      plugin.settings.csvContent = '';
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      await suggest.fetchRemoteLinks();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('selectSuggestion', () => {
    it('replaces text in editor with selected suggestion', () => {
      suggest.parseRemoteLinks(
        'id,status,subcategory,product_or_pack,soundset,name,type,sub_type,genre_players_play_url,genre_players_stop_url,online_player_play_url,online_player_stop_url\n' +
        'pk100,active,cat,pack,Set,Thunder,element,oneshot,,,, '
      );
      const context = { query: '' } as unknown;
      const results = suggest.getSuggestions(context as never);

      const mockEditor = {
        getCursor: vi.fn((type?: string) => ({ line: 0, ch: type === 'from' ? 20 : 20 })),
        replaceRange: vi.fn(),
      };

      // Set the context on the suggest instance
      (suggest as unknown as { context: { query: string; editor: unknown } }).context = {
        query: 'thunder',
        editor: mockEditor,
      };

      suggest.selectSuggestion(results[0], new MouseEvent('click'));
      expect(mockEditor.replaceRange).toHaveBeenCalled();
    });
  });
});
