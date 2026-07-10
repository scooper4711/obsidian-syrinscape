/**
 * Polyfills for Obsidian's extensions to built-in prototypes.
 * Obsidian adds methods like createEl, createDiv, createSpan, empty, addClass
 * to HTMLElement and Element prototypes.
 */

// String.prototype.contains
if (!String.prototype.contains) {
  String.prototype.contains = function (searchString: string): boolean {
    return this.includes(searchString);
  };
}

// HTMLElement.prototype.createEl
if (!HTMLElement.prototype.createEl) {
  HTMLElement.prototype.createEl = function (
    tag: string,
    options?: { cls?: string; text?: string; type?: string; title?: string; href?: string; attr?: Record<string, string> }
  ): HTMLElement {
    const el = document.createElement(tag);
    if (options?.cls) {
      for (const c of options.cls.split(' ')) {
        if (c) el.classList.add(c);
      }
    }
    if (options?.text) el.textContent = options.text;
    if (options?.type) el.setAttribute('type', options.type);
    if (options?.title) el.setAttribute('title', options.title);
    if (options?.href) el.setAttribute('href', options.href);
    if (options?.attr) {
      for (const [k, v] of Object.entries(options.attr)) {
        el.setAttribute(k, v);
      }
    }
    this.appendChild(el);
    return el;
  };
}

// HTMLElement.prototype.createDiv
if (!HTMLElement.prototype.createDiv) {
  HTMLElement.prototype.createDiv = function (options?: { cls?: string; text?: string }): HTMLDivElement {
    return this.createEl('div', options) as HTMLDivElement;
  };
}

// HTMLElement.prototype.createSpan  
if (!HTMLElement.prototype.createSpan) {
  HTMLElement.prototype.createSpan = function (options?: { cls?: string; text?: string }): HTMLSpanElement {
    return this.createEl('span', options) as HTMLSpanElement;
  };
}

// HTMLElement.prototype.createSvg
if (!HTMLElement.prototype.createSvg) {
  HTMLElement.prototype.createSvg = function (tag: string, options?: { cls?: string }): SVGElement {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    if (options?.cls) {
      for (const c of options.cls.split(' ')) {
        if (c) el.classList.add(c);
      }
    }
    this.appendChild(el);
    return el as SVGElement;
  };
}

// Element.prototype.empty (Obsidian extension)
if (!Element.prototype.empty) {
  Element.prototype.empty = function (): void {
    while (this.firstChild) {
      this.removeChild(this.firstChild);
    }
  };
}

// HTMLElement.prototype.addClass (Obsidian extension)
if (!HTMLElement.prototype.addClass) {
  HTMLElement.prototype.addClass = function (...classes: string[]): void {
    this.classList.add(...classes);
  };
}

// HTMLElement.prototype.removeClass (Obsidian extension)
if (!HTMLElement.prototype.removeClass) {
  HTMLElement.prototype.removeClass = function (...classes: string[]): void {
    this.classList.remove(...classes);
  };
}

// HTMLInputElement setAttr
if (!HTMLElement.prototype.setAttr) {
  HTMLElement.prototype.setAttr = function (name: string, value: string): void {
    this.setAttribute(name, value);
  };
}

// HTMLElement.prototype.appendText (Obsidian extension)
if (!HTMLElement.prototype.appendText) {
  HTMLElement.prototype.appendText = function (text: string): void {
    this.appendChild(document.createTextNode(text));
  };
}

// DocumentFragment extensions
if (!DocumentFragment.prototype.createEl) {
  DocumentFragment.prototype.createEl = function (
    tag: string,
    options?: { cls?: string; text?: string; href?: string }
  ): HTMLElement {
    const el = document.createElement(tag);
    if (options?.cls) {
      for (const c of options.cls.split(' ')) {
        if (c) el.classList.add(c);
      }
    }
    if (options?.text) el.textContent = options.text;
    if (options?.href) el.setAttribute('href', options.href);
    this.appendChild(el);
    return el;
  };
}

if (!DocumentFragment.prototype.appendText) {
  DocumentFragment.prototype.appendText = function (text: string): void {
    this.appendChild(document.createTextNode(text));
  };
}

declare global {
  interface String {
    contains(searchString: string): boolean;
  }
  interface HTMLElement {
    createEl(tag: string, options?: Record<string, unknown>): HTMLElement;
    createDiv(options?: Record<string, unknown>): HTMLDivElement;
    createSpan(options?: Record<string, unknown>): HTMLSpanElement;
    createSvg(tag: string, options?: Record<string, unknown>): SVGElement;
    addClass(...classes: string[]): void;
    removeClass(...classes: string[]): void;
    setAttr(name: string, value: string): void;
    appendText(text: string): void;
  }
  interface Element {
    empty(): void;
    instanceOf<T>(type: new (...args: unknown[]) => T): this is T;
  }
  interface DocumentFragment {
    createEl(tag: string, options?: Record<string, unknown>): HTMLElement;
    appendText(text: string): void;
  }
   
  var syrinscape: typeof import('./syrinscapeMock').syrinscapeMock;
   
  var activeDocument: Document;
   
  var activeWindow: Window & typeof globalThis;
  function createSpan(options?: Record<string, unknown>): HTMLSpanElement;
  function createEl(tag: string, options?: Record<string, unknown>): HTMLElement;
}

/**
 * Set up the global syrinscape mock that simulates the Syrinscape player API.
 */
import { syrinscapeMock } from './syrinscapeMock';

Object.defineProperty(window, 'syrinscape', {
  value: syrinscapeMock,
  writable: true,
  configurable: true,
});

(globalThis as unknown as Record<string, unknown>).syrinscape = syrinscapeMock;

/**
 * Obsidian globals: activeDocument, activeWindow, createSpan, createEl
 */
(globalThis as unknown as Record<string, unknown>).activeDocument = document;
(globalThis as unknown as Record<string, unknown>).activeWindow = window;

(globalThis as unknown as Record<string, unknown>).createSpan = function (options?: { cls?: string; text?: string }): HTMLSpanElement {
  const el = document.createElement('span');
  if (options?.cls) {
    for (const c of options.cls.split(' ')) {
      if (c) el.classList.add(c);
    }
  }
  if (options?.text) el.textContent = options.text;
  return el;
};

(globalThis as unknown as Record<string, unknown>).createEl = function (tag: string, options?: { cls?: string; text?: string }): HTMLElement {
  const el = document.createElement(tag);
  if (options?.cls) {
    for (const c of options.cls.split(' ')) {
      if (c) el.classList.add(c);
    }
  }
  if (options?.text) el.textContent = options.text;
  return el;
};

/**
 * Element.prototype.instanceOf - Obsidian's cross-window instanceof check
 */
if (!Element.prototype.instanceOf) {
  Element.prototype.instanceOf = function <T>(type: new (...args: unknown[]) => T): boolean {
    return this instanceof type;
  } as Element['instanceOf'];
}
