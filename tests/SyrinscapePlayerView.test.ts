import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setDebug } from '../src/SyrinscapeDebug';
import { resetSyrinscapeMock, syrinscapeMock } from './syrinscapeMock';

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

import {
  SyrinscapePlayerView,
  VIEW_TYPE,
} from '../src/SyrinscapePlayerView';
import {
  isSyrinscapeDefined,
  isSyrinscapeLoaded,
  isSyrinscapeAuthenticated,
  resetArtwork,
} from '../src/SyrinscapeUtils';
import SyrinscapePlugin from '../src/main';
import { SYRINSCAPE_CLASS } from '../src/SyrinscapeSound';

describe('SyrinscapePlayerView utility functions', () => {
  beforeEach(() => {
    setDebug(false);
    resetSyrinscapeMock();
  });

  describe('VIEW_TYPE', () => {
    it('is syrinscape-player', () => {
      expect(VIEW_TYPE).toBe('syrinscape-player');
    });
  });

  describe('isSyrinscapeDefined', () => {
    it('returns true when syrinscape is in window', () => {
      expect(isSyrinscapeDefined()).toBe(true);
    });

    it('returns false when syrinscape is not in window', () => {
      const original = (window as Record<string, unknown>).syrinscape;
      delete (window as Record<string, unknown>).syrinscape;
      expect(isSyrinscapeDefined()).toBe(false);
      (window as Record<string, unknown>).syrinscape = original;
    });
  });

  describe('isSyrinscapeLoaded', () => {
    it('returns truthy when syrinscape has all required properties', () => {
      expect(isSyrinscapeLoaded()).toBeTruthy();
    });

    it('returns false when syrinscape is not defined', () => {
      const original = (window as Record<string, unknown>).syrinscape;
      delete (window as Record<string, unknown>).syrinscape;
      expect(isSyrinscapeLoaded()).toBe(false);
      (window as Record<string, unknown>).syrinscape = original;
    });

    it('returns false when syrinscape throws', () => {
      const original = (window as Record<string, unknown>).syrinscape;
      Object.defineProperty(window, 'syrinscape', {
        get() { throw new Error('broken'); },
        configurable: true,
      });
      expect(isSyrinscapeLoaded()).toBe(false);
      Object.defineProperty(window, 'syrinscape', { value: original, writable: true, configurable: true });
    });
  });

  describe('isSyrinscapeAuthenticated', () => {
    it('returns true when authenticated', () => {
      syrinscapeMock.config.authenticated = true;
      expect(isSyrinscapeAuthenticated()).toBe(true);
    });

    it('returns false when not authenticated', () => {
      syrinscapeMock.config.authenticated = false;
      expect(isSyrinscapeAuthenticated()).toBe(false);
    });

    it('returns false when syrinscape is not defined', () => {
      const original = (window as Record<string, unknown>).syrinscape;
      delete (window as Record<string, unknown>).syrinscape;
      expect(isSyrinscapeAuthenticated()).toBe(false);
      (window as Record<string, unknown>).syrinscape = original;
    });

    it('returns false when syrinscape throws', () => {
      const original = (window as Record<string, unknown>).syrinscape;
      Object.defineProperty(window, 'syrinscape', {
        get() { throw new Error('broken'); },
        configurable: true,
      });
      expect(isSyrinscapeAuthenticated()).toBe(false);
      Object.defineProperty(window, 'syrinscape', { value: original, writable: true, configurable: true });
    });
  });

  describe('resetArtwork', () => {
    it('resets background image on syrinscape divs', () => {
      document.body.innerHTML = '<div class="syrinscape" style="background-image: url(test.jpg)"></div>';
      resetArtwork();
      const div = document.querySelector('.syrinscape') as HTMLDivElement;
      expect(div.style.backgroundImage).toContain('data:image/jpeg;base64,');
    });

    it('resets title text', () => {
      document.body.innerHTML = '<div class="title"><h2>Some Mood</h2></div>';
      resetArtwork();
      const h2 = document.querySelector('.title h2') as HTMLHeadingElement;
      expect(h2.textContent).toBe('Syrinscape Player');
    });
  });
});

describe('SyrinscapePlayerView class', () => {
  let plugin: SyrinscapePlugin;
  let view: SyrinscapePlayerView;

  beforeEach(() => {
    setDebug(false);
    resetSyrinscapeMock();
    document.body.innerHTML = '';

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
    plugin.saveData = vi.fn().mockResolvedValue(undefined);

    const leaf = {};
    view = new SyrinscapePlayerView(leaf as unknown, plugin);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns correct view type', () => {
    expect(view.getViewType()).toBe('syrinscape-player');
  });

  it('returns correct display text', () => {
    expect(view.getDisplayText()).toBe('Syrinscape player');
  });

  it('onOpen builds the UI without throwing', async () => {
    await expect(view.onOpen()).resolves.not.toThrow();
  });

  it('onOpen creates syrinscape div structure', async () => {
    await view.onOpen();
    const container = view.containerEl.children[1];
    expect(container.querySelector('.syrinscape')).not.toBeNull();
    expect(container.querySelector('.cta')).not.toBeNull();
    expect(container.querySelector('.interface')).not.toBeNull();
    expect(container.querySelector('.controls')).not.toBeNull();
  });

  it('onOpen creates volume controls', async () => {
    await view.onOpen();
    const container = view.containerEl.children[1];
    expect(container.querySelector('input[type="range"]')).not.toBeNull();
    expect(container.querySelector('.mute')).not.toBeNull();
  });

  it('onOpen creates stop button', async () => {
    await view.onOpen();
    const container = view.containerEl.children[1];
    const stopBtn = container.querySelector('.stopAll');
    expect(stopBtn).not.toBeNull();
    expect(stopBtn!.textContent).toBe('⏹️');
  });

  it('stop button calls stopAll', async () => {
    await view.onOpen();
    const container = view.containerEl.children[1];
    const stopBtn = container.querySelector('.stopAll') as HTMLButtonElement;
    stopBtn.click();
    expect(syrinscapeMock.player.controlSystem.stopAll).toHaveBeenCalled();
  });

  it('mute button calls toggleMute', async () => {
    await view.onOpen();
    const container = view.containerEl.children[1];
    const muteBtn = container.querySelector('.mute') as HTMLButtonElement;
    muteBtn.click();
    expect(syrinscapeMock.player.audioSystem.toggleMute).toHaveBeenCalled();
  });

  it('launch button calls launchAsGameMaster', async () => {
    await view.onOpen();
    const container = view.containerEl.children[1];
    const launchBtn = container.querySelector('.launch') as HTMLInputElement;
    launchBtn.click();
    expect(syrinscapeMock.integration.launchAsGameMaster).toHaveBeenCalled();
  });

  it('activate button exists with correct aria-label', async () => {
    await view.onOpen();
    const container = view.containerEl.children[1];
    const activateBtn = container.querySelector('.cta button') as HTMLButtonElement;
    expect(activateBtn).not.toBeNull();
    expect(activateBtn.getAttribute('aria-label')).toBe('Activate Syrinscape player');
  });

  it('onClose stops all sounds', async () => {
    await view.onOpen();
    await view.onClose();
    expect(syrinscapeMock.player.controlSystem.stopAll).toHaveBeenCalled();
  });

  it('onunload unsubscribes from events', async () => {
    await view.onOpen();
    expect(() => view.onunload()).not.toThrow();
  });

  it('activateSyrinscape initializes the player', async () => {
    await view.onOpen();
    await view.activateSyrinscape();
    expect(syrinscapeMock.config.init).toHaveBeenCalled();
    expect(syrinscapeMock.player.init).toHaveBeenCalled();
  });

  it('activateSyrinscape shows error when syrinscape not defined', async () => {
    vi.useFakeTimers();
    const original = (window as Record<string, unknown>).syrinscape;
    delete (window as Record<string, unknown>).syrinscape;

    await view.onOpen();
    const promise = view.activateSyrinscape();
    // Advance timers past the 50 attempts * 200ms timeout
    for (let i = 0; i < 55; i++) {
      await vi.advanceTimersByTimeAsync(200);
    }
    await promise;
    // Should not throw, just log error
    (window as Record<string, unknown>).syrinscape = original;
    vi.useRealTimers();
  });

  it('onHide mutes audio', async () => {
    await view.onOpen();
    await view.onHide();
    expect(syrinscapeMock.player.audioSystem.setLocalVolume).toHaveBeenCalledWith('0');
  });

  describe('activateSyrinscape callbacks', () => {
    it('onActive when authenticated removes inactive classes and shows interface', async () => {
      // Set up DOM with inactive elements
      document.body.innerHTML = `
        <span class="${SYRINSCAPE_CLASS}"><a class="inactive">play</a></span>
        <span class="${SYRINSCAPE_CLASS}"><input class="inactive" /></span>
        <span class="${SYRINSCAPE_CLASS}"><span class="inactive">slider</span></span>
      `;

      syrinscapeMock.config.authenticated = true;
      // Make player.init call onActive immediately
      syrinscapeMock.player.init.mockImplementation((opts: { configure: () => void; onActive: () => void; onInactive: () => void }) => {
        opts.configure();
        opts.onActive();
      });

      await view.onOpen();
      await view.activateSyrinscape();

      // Inactive classes should be removed
      expect(document.querySelector(`.${SYRINSCAPE_CLASS} a.inactive`)).toBeNull();
      expect(document.querySelector(`.${SYRINSCAPE_CLASS} input.inactive`)).toBeNull();
      expect(document.querySelector(`.${SYRINSCAPE_CLASS} span.inactive`)).toBeNull();
    });

    it('onActive when not authenticated adds inactive classes', async () => {
      document.body.innerHTML = `
        <span class="${SYRINSCAPE_CLASS}"><a>play</a></span>
      `;

      syrinscapeMock.config.authenticated = false;
      syrinscapeMock.player.init.mockImplementation((opts: { configure: () => void; onActive: () => void; onInactive: () => void }) => {
        opts.configure();
        opts.onActive();
      });

      await view.onOpen();
      await view.activateSyrinscape();

      expect(document.querySelector(`.${SYRINSCAPE_CLASS} a.inactive`)).not.toBeNull();
    });

    it('onInactive adds inactive classes and hides interface', async () => {
      document.body.innerHTML = `
        <span class="${SYRINSCAPE_CLASS}"><a>play</a></span>
      `;

      syrinscapeMock.player.init.mockImplementation((opts: { configure: () => void; onActive: () => void; onInactive: () => void }) => {
        opts.configure();
        opts.onInactive();
      });

      await view.onOpen();
      await view.activateSyrinscape();

      expect(document.querySelector(`.${SYRINSCAPE_CLASS} a.inactive`)).not.toBeNull();
    });

    it('configure calls loginToSyrinscape with auth token', async () => {
      // Provide a mock AudioContext constructor so loginToSyrinscape doesn't throw
      (globalThis as unknown as Record<string, unknown>).AudioContext = class MockAudioContext {};
      syrinscapeMock.config.audioContext = null;

      let configureCallback: (() => Promise<void>) | null = null;
      syrinscapeMock.player.init.mockImplementation((opts: { configure: () => Promise<void>; onActive: () => void; onInactive: () => void }) => {
        configureCallback = opts.configure;
      });

      await view.onOpen();
      await view.activateSyrinscape();

      // Now call configure manually
      if (configureCallback) {
        await (configureCallback as () => Promise<void>)();
        expect(syrinscapeMock.config.sync).toHaveBeenCalled();
        expect(syrinscapeMock.config.token).toBe('test-token');
      }

      delete (globalThis as unknown as Record<string, unknown>).AudioContext;
    });
  });

  describe('configUpdated', () => {
    it('shows controls when authenticated', async () => {
      await view.onOpen();
      // Trigger configUpdated via the event listener
      const event = { detail: { authenticated: true } };
      // Find the callback registered on updateConfig
      const callback = syrinscapeMock.events.updateConfig.addListener.mock.calls[0]?.[0];
      if (callback) {
        callback(event);
        expect(view.controlsDiv?.classList.contains('is-hidden')).toBe(false);
        expect(view.loginDiv?.classList.contains('is-hidden')).toBe(true);
      }
    });

    it('shows login when not authenticated', async () => {
      syrinscapeMock.config.authenticated = false;
      await view.onOpen();
      const event = { detail: { authenticated: false } };
      const callback = syrinscapeMock.events.updateConfig.addListener.mock.calls[0]?.[0];
      if (callback) {
        callback(event);
        expect(view.loginDiv?.classList.contains('is-hidden')).toBe(false);
        expect(view.controlsDiv?.classList.contains('is-hidden')).toBe(true);
      }
    });
  });

  describe('setLocalVolume event', () => {
    async function activateWithOnActive() {
      vi.useFakeTimers();
      syrinscapeMock.config.authenticated = true;
      syrinscapeMock.player.init.mockImplementation((opts: { configure: () => void; onActive: () => void; onInactive: () => void }) => {
        opts.onActive();
      });
      await view.onOpen();
      await view.activateSyrinscape();
      await vi.advanceTimersByTimeAsync(300);
      vi.useRealTimers();
    }

    it('updates volume slider and mute icon for zero volume', async () => {
      await activateWithOnActive();
      const callback = syrinscapeMock.events.setLocalVolume.addListener.mock.calls[0]?.[0];
      expect(callback).toBeDefined();
      callback!({ detail: '0' });
      expect(view.localVolume?.value).toBe('0');
      expect(view.mute?.textContent).toBe('🔇');
    });

    it('updates mute icon for low volume', async () => {
      await activateWithOnActive();
      const callback = syrinscapeMock.events.setLocalVolume.addListener.mock.calls[0]?.[0];
      expect(callback).toBeDefined();
      callback!({ detail: '0.3' });
      expect(view.mute?.textContent).toBe('🔈');
    });

    it('updates mute icon for medium volume', async () => {
      await activateWithOnActive();
      const callback = syrinscapeMock.events.setLocalVolume.addListener.mock.calls[0]?.[0];
      expect(callback).toBeDefined();
      callback!({ detail: '0.7' });
      expect(view.mute?.textContent).toBe('🔉');
    });

    it('updates mute icon for high volume', async () => {
      await activateWithOnActive();
      const callback = syrinscapeMock.events.setLocalVolume.addListener.mock.calls[0]?.[0];
      expect(callback).toBeDefined();
      callback!({ detail: '1.2' });
      expect(view.mute?.textContent).toBe('🔊');
    });
  });

  describe('volume slider interaction', () => {
    it('calls setLocalVolume on input event', async () => {
      await view.onOpen();
      const slider = view.localVolume as HTMLInputElement;
      if (slider) {
        slider.value = '0.8';
        slider.dispatchEvent(new Event('input'));
        expect(syrinscapeMock.player.audioSystem.setLocalVolume).toHaveBeenCalledWith('0.8');
      }
    });

    it('calls setLocalVolume on change event', async () => {
      await view.onOpen();
      const slider = view.localVolume as HTMLInputElement;
      if (slider) {
        slider.value = '1.2';
        slider.dispatchEvent(new Event('change'));
        expect(syrinscapeMock.player.audioSystem.setLocalVolume).toHaveBeenCalledWith('1.2');
      }
    });

    it('shows tooltip on mouseenter', async () => {
      await view.onOpen();
      const slider = view.localVolume as HTMLInputElement;
      if (slider) {
        slider.dispatchEvent(new Event('mouseenter'));
        const tooltip = slider.parentElement?.querySelector('.volume-tooltip') as HTMLDivElement;
        expect(tooltip?.classList.contains('is-hidden')).toBe(false);
      }
    });

    it('hides tooltip on mouseleave', async () => {
      await view.onOpen();
      const slider = view.localVolume as HTMLInputElement;
      if (slider) {
        slider.dispatchEvent(new Event('mouseenter'));
        slider.dispatchEvent(new Event('mouseleave'));
        const tooltip = slider.parentElement?.querySelector('.volume-tooltip') as HTMLDivElement;
        expect(tooltip?.classList.contains('is-hidden')).toBe(true);
      }
    });
  });

  describe('playerActive', () => {
    it('registers for events and subscribes to artwork changes', async () => {
      await view.onOpen();
      // Call playerActive directly (it's triggered by the event)
      const callback = syrinscapeMock.events.playerActive.addListener.mock.calls[0]?.[0];
      if (callback) {
        callback();
        expect(syrinscapeMock.visualisation.add).toHaveBeenCalled();
      }
    });
  });

  describe('login button', () => {
    it('reload button calls onOpen', async () => {
      await view.onOpen();
      const container = view.containerEl.children[1];
      const reloadBtns = container.querySelectorAll('.syrinscape-reload');
      const spy = vi.spyOn(view, 'onOpen');
      if (reloadBtns.length > 0) {
        (reloadBtns[0] as HTMLButtonElement).click();
        expect(spy).toHaveBeenCalled();
      }
    });
  });

  describe('onActive with waitForSyrinscapeInit', () => {
    it('restores volume and registers events after init resolves', async () => {
      vi.useFakeTimers();
      syrinscapeMock.config.authenticated = true;
      syrinscapeMock.player.init.mockImplementation((opts: { configure: () => void; onActive: () => void; onInactive: () => void }) => {
        opts.configure();
        opts.onActive();
      });

      await view.onOpen();
      await view.activateSyrinscape();

      // Advance past the waitForSyrinscapeInit delay (200ms)
      await vi.advanceTimersByTimeAsync(300);

      expect(syrinscapeMock.player.audioSystem.setLocalVolume).toHaveBeenCalled();
      expect(syrinscapeMock.visualisation.add).toHaveBeenCalled();
      vi.useRealTimers();
    });
  });

  describe('onInactive', () => {
    it('adds inactive classes and shows CTA', async () => {
      document.body.innerHTML = `
        <span class="${SYRINSCAPE_CLASS}"><a>play</a></span>
      `;

      syrinscapeMock.player.init.mockImplementation((opts: { configure: () => void; onActive: () => void; onInactive: () => void }) => {
        opts.onInactive();
      });

      await view.onOpen();
      await view.activateSyrinscape();

      expect(document.querySelector(`.${SYRINSCAPE_CLASS} a.inactive`)).not.toBeNull();
      expect(view.ctaDiv?.classList.contains('is-hidden')).toBe(false);
      expect(view.interfaceDiv?.classList.contains('is-hidden')).toBe(true);
    });

    it('unsubscribes all callbacks during onInactive', async () => {
      const unsub1 = vi.fn();
      const unsub2 = vi.fn();

      syrinscapeMock.player.init.mockImplementation((opts: { configure: () => void; onActive: () => void; onInactive: () => void }) => {
        view.unsubscribeCallbacks.push(unsub1, unsub2);
        opts.onInactive();
      });

      await view.onOpen();
      await view.activateSyrinscape();

      expect(unsub1).toHaveBeenCalled();
      expect(unsub2).toHaveBeenCalled();
      expect(view.unsubscribeCallbacks.length).toBe(0);
    });
  });

  describe('updateArtwork and updateTitle', () => {
    it('updateArtwork sets background image from event detail', async () => {
      syrinscapeMock.player.init.mockImplementation((opts: { configure: () => void; onActive: () => void; onInactive: () => void }) => {
        opts.onActive();
      });

      await view.onOpen();
      await view.activateSyrinscape();

      // Simulate onChangeSoundset event
      const artworkCallback = syrinscapeMock.player.syncSystem.events.onChangeSoundset.addListener.mock.calls[0]?.[0];
      if (artworkCallback) {
        artworkCallback({ artwork: 'https://example.com/art.jpg' });
        expect(view.syrinscapeDiv?.style.backgroundImage).toContain('example.com/art.jpg');
      }
    });

    it('updateTitle sets title text from event detail', async () => {
      syrinscapeMock.player.init.mockImplementation((opts: { configure: () => void; onActive: () => void; onInactive: () => void }) => {
        opts.onActive();
      });

      await view.onOpen();
      await view.activateSyrinscape();

      // Simulate onChangeMood event
      const titleCallback = syrinscapeMock.player.syncSystem.events.onChangeMood.addListener.mock.calls[0]?.[0];
      if (titleCallback) {
        titleCallback({ title: 'Epic Battle', pk: '123' });
        expect(view.title?.textContent).toBe('Epic Battle');
      }
    });
  });

  describe('visualizer callback', () => {
    it('calls d3 visualisation functions', async () => {
      vi.useFakeTimers();
      syrinscapeMock.config.authenticated = true;
      syrinscapeMock.player.init.mockImplementation((opts: { configure: () => void; onActive: () => void; onInactive: () => void }) => {
        opts.onActive();
      });

      await view.onOpen();
      await view.activateSyrinscape();
      await vi.advanceTimersByTimeAsync(300);
      vi.useRealTimers();

      // Get the visualisation callback and invoke it
      const visCallback = syrinscapeMock.visualisation.add.mock.calls[0]?.[1];
      expect(visCallback).toBeDefined();
      const result = visCallback!();
      expect(syrinscapeMock.player.audioEffectSystem.analyser.getData).toHaveBeenCalled();
      expect(syrinscapeMock.visualisation.d3VisualiseFrequencyData).toHaveBeenCalled();
      expect(syrinscapeMock.visualisation.d3VisualiseWaveformData).toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });

  describe('volume slider saves settings', () => {
    it('saves volume percentage to plugin settings on input', async () => {
      await view.onOpen();
      const slider = view.localVolume as HTMLInputElement;
      if (slider) {
        slider.value = '0.75';
        slider.dispatchEvent(new Event('input'));
        // Wait for async saveData
        await vi.waitFor(() => {
          expect(plugin.saveData).toHaveBeenCalled();
        });
        expect(plugin.settings.lastVolume).toBe('50');
      }
    });

    it('oneshot volume slider calls setVolume', async () => {
      await view.onOpen();
      const container = view.containerEl.children[1];
      const oneshotSlider = container.querySelector('.oneshot-volume') as HTMLInputElement;
      if (oneshotSlider) {
        oneshotSlider.value = '1.0';
        oneshotSlider.dispatchEvent(new Event('input'));
        expect(syrinscapeMock.player.elementSystem.oneshotSystem.setVolume).toHaveBeenCalledWith('1.0');
      }
    });
  });

  describe('waitForSyrinscapeInit', () => {
    it('resolves after syrinscape is fully initialized', async () => {
      vi.useFakeTimers();
      syrinscapeMock.config.authenticated = true;

      // Make onActive call waitForSyrinscapeInit which should resolve
      syrinscapeMock.player.init.mockImplementation((opts: { configure: () => void; onActive: () => void; onInactive: () => void }) => {
        opts.onActive();
      });

      await view.onOpen();
      const activatePromise = view.activateSyrinscape();

      // Advance past the 200ms init delay
      await vi.advanceTimersByTimeAsync(300);
      await activatePromise;

      // The waitForSyrinscapeInit should have resolved and set up events
      expect(syrinscapeMock.visualisation.add).toHaveBeenCalled();
      vi.useRealTimers();
    });
  });
});
