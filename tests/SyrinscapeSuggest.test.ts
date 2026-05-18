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
import { SyrinscapeSound } from '../src/SyrinscapeSound';

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
  });

  describe('getSuggestions', () => {
    beforeEach(() => {
      // Populate remoteLinks via parseRemoteLinks
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
  });
});
