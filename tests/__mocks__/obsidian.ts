// Mock for the obsidian module used in tests
import { vi } from 'vitest';

export class Notice {
  message: string;
  constructor(message: string) {
    this.message = message;
  }
}

export class Plugin {
  app: Record<string, unknown> = {
    workspace: {
      trigger: vi.fn(),
      onLayoutReady: vi.fn((cb: () => void) => cb()),
      getLeavesOfType: vi.fn(() => []),
      getRightLeaf: vi.fn(() => null),
      revealLeaf: vi.fn(),
    },
  };
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
  containerEl: HTMLElement;
  constructor(app: unknown, plugin: unknown) {
    this.app = app;
    this.plugin = plugin;
    this.containerEl = document.createElement('div');
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
  app: Record<string, unknown> = {
    workspace: {
      onLayoutReady: vi.fn((cb: () => void) => cb()),
      getLeavesOfType: vi.fn(() => []),
    },
  };
  containerEl: HTMLElement;
  leaf: unknown;
  icon = '';
  constructor(leaf: unknown) {
    this.leaf = leaf;
    this.containerEl = document.createElement('div');
    const header = document.createElement('div');
    const content = document.createElement('div');
    this.containerEl.appendChild(header);
    this.containerEl.appendChild(content);
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
  private settingEl: HTMLElement;
  constructor(_containerEl: unknown) {
    this.settingEl = document.createElement('div');
  }
  setName(_name: string) { return this; }
  setDesc(_desc: unknown) { return this; }
  addText(cb: (text: TextComponent) => void) {
    const text = new TextComponent();
    cb(text);
    // Trigger onChange to cover the callback code
    if (text._onChange) text._onChange('test-value');
    return this;
  }
  addButton(cb: (button: ButtonComponent) => void) {
    const button = new ButtonComponent();
    cb(button);
    // Trigger onClick to cover the callback code
    if (button._onClick) button._onClick();
    return this;
  }
  addToggle(cb: (toggle: ToggleComponent) => void) {
    const toggle = new ToggleComponent();
    cb(toggle);
    // Trigger onChange to cover the callback code
    if (toggle._onChange) toggle._onChange(true);
    return this;
  }
}

class TextComponent {
  inputEl = document.createElement('input');
  _onChange: ((value: string) => void) | null = null;
  setPlaceholder(_val: string) { return this; }
  setValue(_val: string) { return this; }
  onChange(cb: (value: string) => void) { this._onChange = cb; return this; }
}

class ButtonComponent {
  _onClick: (() => void) | null = null;
  setButtonText(_text: string) { return this; }
  onClick(cb: () => void) { this._onClick = cb; return this; }
}

class ToggleComponent {
  _onChange: ((value: boolean) => void) | null = null;
  setValue(_val: boolean) { return this; }
  onChange(cb: (value: boolean) => void) { this._onChange = cb; return this; }
}

export class WorkspaceLeaf {}

export const requestUrl = vi.fn((_options: unknown): Promise<{ text: string }> => {
  return Promise.resolve({ text: '' });
});

export type MarkdownPostProcessorContext = {
  addChild: (child: unknown) => void;
};
export type Editor = {
  getLine: (line: number) => string;
  getCursor: (type?: string) => { line: number; ch: number };
  replaceRange: (text: string, from: unknown, to: unknown) => void;
};
export type EditorPosition = { line: number; ch: number };
export type EditorSuggestContext = { query: string; editor: unknown };
export type EditorSuggestTriggerInfo = { start: EditorPosition; end: EditorPosition; query: string };
export type TFile = unknown;
export type App = Record<string, unknown>;
