import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setDebug } from '../src/SyrinscapeDebug';

vi.mock('SyrinscapePlayerView', () => ({
  isSyrinscapeAuthenticated: vi.fn(() => true),
  resetArtwork: vi.fn(),
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

// Mock CodeMirror modules
vi.mock('@codemirror/view', () => {
  class MockWidgetType {
    eq(_other: unknown) { return false; }
    toDOM() { return document.createElement('span'); }
    ignoreEvent(_event: unknown) { return true; }
  }
  return {
    EditorView: vi.fn(),
    ViewPlugin: {
      fromClass: vi.fn((cls: new () => unknown, _opts: unknown) => {
        // Store the class so we can test it
        return { _cls: cls };
      }),
    },
    Decoration: {
      none: { size: 0 },
      set: vi.fn((_widgets: unknown[], _sort: boolean) => ({})),
      replace: vi.fn((_opts: unknown) => ({
        range: vi.fn((_from: number, _to: number) => ({})),
      })),
    },
    WidgetType: MockWidgetType,
  };
});

vi.mock('@codemirror/state', () => ({
  EditorSelection: { ranges: [] },
  Range: vi.fn(),
}));

vi.mock('@codemirror/language', () => ({
  syntaxTree: vi.fn(() => ({
    iterate: vi.fn(),
  })),
}));

vi.mock('obsidian', async () => {
  const actual = await import('../tests/__mocks__/obsidian');
  return {
    ...actual,
    editorEditorField: 'editorEditorField',
    editorLivePreviewField: 'editorLivePreviewField',
    editorInfoField: 'editorInfoField',
  };
});

import { SyrinscapePlayerWidget, inlinePlugin } from '../src/SyrinscapePlayerWidget';
import { SyrinscapeSound } from '../src/SyrinscapeSound';
import SyrinscapePlugin from '../src/main';

describe('SyrinscapePlayerWidget', () => {
  let plugin: SyrinscapePlugin;

  beforeEach(() => {
    setDebug(false);
    document.body.innerHTML = '';
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

  describe('eq', () => {
    it('returns true for same rawQuery', () => {
      const sound = new SyrinscapeSound('100', 'oneshot', 'Thunder');
      const view = {} as unknown;
      const widget1 = new SyrinscapePlayerWidget('syrinscape:oneshot:100:Thunder', view as never, plugin, sound);
      const widget2 = new SyrinscapePlayerWidget('syrinscape:oneshot:100:Thunder', view as never, plugin, sound);
      expect(widget1.eq(widget2)).toBe(true);
    });

    it('returns false for different rawQuery', () => {
      const sound1 = new SyrinscapeSound('100', 'oneshot', 'Thunder');
      const sound2 = new SyrinscapeSound('200', 'mood', 'Battle');
      const view = {} as unknown;
      const widget1 = new SyrinscapePlayerWidget('syrinscape:oneshot:100:Thunder', view as never, plugin, sound1);
      const widget2 = new SyrinscapePlayerWidget('syrinscape:mood:200:Battle', view as never, plugin, sound2);
      expect(widget1.eq(widget2)).toBe(false);
    });
  });

  describe('toDOM', () => {
    it('creates a span element with rendered sound', () => {
      const sound = new SyrinscapeSound('100', 'oneshot', 'Thunder');
      const view = {} as unknown;
      const widget = new SyrinscapePlayerWidget('syrinscape:oneshot:100:Thunder', view as never, plugin, sound);
      const dom = widget.toDOM();
      expect(dom.tagName).toBe('SPAN');
      // Should contain the rendered sound (an anchor for oneshot)
      expect(dom.querySelector('a')).not.toBeNull();
    });
  });

  describe('ignoreEvent', () => {
    it('returns true for non-mousedown events', () => {
      const sound = new SyrinscapeSound('100', 'oneshot', 'Thunder');
      const view = {} as unknown;
      const widget = new SyrinscapePlayerWidget('syrinscape:oneshot:100:Thunder', view as never, plugin, sound);
      const event = new Event('click');
      expect(widget.ignoreEvent(event)).toBe(true);
    });

    it('returns true for non-shift mousedown', () => {
      const sound = new SyrinscapeSound('100', 'oneshot', 'Thunder');
      const view = {
        posAtCoords: vi.fn(() => 5),
        state: { field: vi.fn(() => ({ state: { field: vi.fn(() => ({ editor: null })) } })) }
      } as unknown;
      const widget = new SyrinscapePlayerWidget('syrinscape:oneshot:100:Thunder', view as never, plugin, sound);
      const event = new MouseEvent('mousedown', { shiftKey: false });
      expect(widget.ignoreEvent(event)).toBe(true);
    });

    it('returns false for shift+mousedown with editor', () => {
      const mockEditor = { setCursor: vi.fn(), offsetToPos: vi.fn(() => ({ line: 0, ch: 5 })) };
      const view = {
        posAtCoords: vi.fn(() => 5),
        state: {
          field: vi.fn(() => ({
            state: {
              field: vi.fn(() => ({ editor: mockEditor }))
            }
          }))
        }
      } as unknown;
      const sound = new SyrinscapeSound('100', 'oneshot', 'Thunder');
      const widget = new SyrinscapePlayerWidget('syrinscape:oneshot:100:Thunder', view as never, plugin, sound);
      const event = new MouseEvent('mousedown', { shiftKey: true });
      expect(widget.ignoreEvent(event)).toBe(false);
      expect(mockEditor.setCursor).toHaveBeenCalled();
    });

    it('returns false for shift+mousedown without editor', () => {
      const view = {
        posAtCoords: vi.fn(() => 5),
        state: {
          field: vi.fn(() => ({
            state: {
              field: vi.fn(() => ({ editor: null }))
            }
          }))
        }
      } as unknown;
      const sound = new SyrinscapeSound('100', 'oneshot', 'Thunder');
      const widget = new SyrinscapePlayerWidget('syrinscape:oneshot:100:Thunder', view as never, plugin, sound);
      const event = new MouseEvent('mousedown', { shiftKey: true });
      expect(widget.ignoreEvent(event)).toBe(false);
    });

    it('returns false for shift+mousedown when posAtCoords returns null', () => {
      const view = {
        posAtCoords: vi.fn(() => null),
        state: {
          field: vi.fn(() => ({
            state: {
              field: vi.fn(() => ({ editor: null }))
            }
          }))
        }
      } as unknown;
      const sound = new SyrinscapeSound('100', 'oneshot', 'Thunder');
      const widget = new SyrinscapePlayerWidget('syrinscape:oneshot:100:Thunder', view as never, plugin, sound);
      const event = new MouseEvent('mousedown', { shiftKey: true });
      expect(widget.ignoreEvent(event)).toBe(false);
    });
  });

  describe('inlinePlugin', () => {
    it('returns a ViewPlugin result', () => {
      const result = inlinePlugin(plugin);
      expect(result).toBeDefined();
    });

    it('creates a plugin class with decorations property', () => {
      const result = inlinePlugin(plugin) as unknown as { _cls: new () => { decorations: unknown; update: (update: unknown) => void } };
      if (result._cls) {
        const instance = new result._cls();
        expect(instance.decorations).toBeDefined();
      }
    });

    it('plugin update sets decorations to none when not in live preview', () => {
      const result = inlinePlugin(plugin) as unknown as { _cls: new () => { decorations: unknown; update: (update: unknown) => void } };
      if (result._cls) {
        const instance = new result._cls();
        const update = {
          state: { field: vi.fn(() => false) },
          docChanged: false,
          viewportChanged: false,
          selectionSet: false,
        };
        instance.update(update);
        expect(instance.decorations).toEqual({ size: 0 });
      }
    });
  });
});
