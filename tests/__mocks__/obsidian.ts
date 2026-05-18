// Mock for the obsidian module used in tests

export class Notice {
  constructor(public message: string) {}
}

export class Plugin {
  app: unknown = {};
  loadData = vi.fn().mockResolvedValue({});
  saveData = vi.fn().mockResolvedValue(undefined);
  registerMarkdownPostProcessor = vi.fn();
  registerView = vi.fn();
  addRibbonIcon = vi.fn();
  registerEditorExtension = vi.fn();
  registerEditorSuggest = vi.fn();
  addSettingTab = vi.fn();
}

export class PluginSettingTab {
  app: unknown;
  plugin: unknown;
  containerEl = { empty: vi.fn() };
  constructor(app: unknown, plugin: unknown) {
    this.app = app;
    this.plugin = plugin;
  }
}

export class MarkdownRenderChild {
  containerEl: HTMLElement;
  constructor(containerEl: HTMLElement) {
    this.containerEl = containerEl;
  }
  onload() {}
  onunload() {}
}

export class ItemView {
  app: unknown = { workspace: { onLayoutReady: vi.fn() } };
  containerEl = { children: [null, { empty: vi.fn(), createDiv: vi.fn() }] };
  leaf: unknown;
  constructor(leaf: unknown) {
    this.leaf = leaf;
  }
  getViewType() { return ''; }
  getDisplayText() { return ''; }
}

export class EditorSuggest {
  app: unknown;
  constructor(app: unknown) {
    this.app = app;
  }
}

export class Setting {
  constructor(_containerEl: unknown) {}
  setName(_name: string) { return this; }
  setDesc(_desc: unknown) { return this; }
  addText(_cb: unknown) { return this; }
  addButton(_cb: unknown) { return this; }
  addToggle(_cb: unknown) { return this; }
}

export class WorkspaceLeaf {}

export function requestUrl(_options: unknown): Promise<{ text: string }> {
  return Promise.resolve({ text: '' });
}

export type MarkdownPostProcessorContext = unknown;
export type Editor = unknown;
export type EditorPosition = { line: number; ch: number };
export type EditorSuggestContext = { query: string; editor: unknown };
export type EditorSuggestTriggerInfo = { start: EditorPosition; end: EditorPosition; query: string };
export type TFile = unknown;
export type App = unknown;
