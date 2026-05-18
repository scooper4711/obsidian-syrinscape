import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setDebug } from '../src/SyrinscapeDebug';

vi.mock('SyrinscapePlayerView', () => ({
  isSyrinscapeAuthenticated: vi.fn(() => true),
  resetArtwork: vi.fn(),
}));

import { SyrinscapeRenderChild } from '../src/SyrinscapeRenderChild';
import { SyrinscapeSound, SYRINSCAPE_CLASS } from '../src/SyrinscapeSound';

describe('SyrinscapeRenderChild', () => {
  beforeEach(() => {
    setDebug(false);
    document.body.innerHTML = '';
  });

  it('replaces the element with a rendered span on load', () => {
    const codeEl = document.createElement('code');
    codeEl.textContent = 'syrinscape:mood:123:Battle';
    document.body.appendChild(codeEl);

    const sound = new SyrinscapeSound('123', 'mood', 'Battle');
    const renderChild = new SyrinscapeRenderChild(codeEl, sound);
    renderChild.onload();

    // The code element should be replaced
    expect(document.querySelector('code')).toBeNull();
    // The syrinscape span should be present
    expect(document.querySelector(`.${SYRINSCAPE_CLASS}`)).not.toBeNull();
  });

  it('renders a oneshot sound correctly', () => {
    const codeEl = document.createElement('code');
    document.body.appendChild(codeEl);

    const sound = new SyrinscapeSound('456', 'oneshot', 'Thunder');
    const renderChild = new SyrinscapeRenderChild(codeEl, sound);
    renderChild.onload();

    const anchor = document.querySelector('a.oneshot');
    expect(anchor).not.toBeNull();
    expect(anchor!.textContent).toBe('▶️');
  });

  it('renders a mood sound with slider', () => {
    const codeEl = document.createElement('code');
    document.body.appendChild(codeEl);

    const sound = new SyrinscapeSound('789', 'mood', 'Calm');
    const renderChild = new SyrinscapeRenderChild(codeEl, sound);
    renderChild.onload();

    const input = document.querySelector('input[type="checkbox"].mood');
    expect(input).not.toBeNull();
  });
});
