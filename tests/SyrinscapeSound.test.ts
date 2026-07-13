import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setDebug } from '../src/SyrinscapeDebug';
import { resetSyrinscapeMock, syrinscapeMock } from './syrinscapeMock';

vi.mock('SyrinscapeUtils', () => ({
  isSyrinscapeAuthenticated: vi.fn(() => true),
  resetArtwork: vi.fn(),
}));

import { isSyrinscapeAuthenticated, resetArtwork } from 'SyrinscapeUtils';
import {
  SyrinscapeSound,
  SYRINSCAPE_CLASS,
  registerForSyrinscapeEvents,
  unregisterForSyrinscapeEvents,
  setAllStopped,
  stopElement,
  startElement,
} from '../src/SyrinscapeSound';

describe('SyrinscapeSound', () => {
  beforeEach(() => {
    setDebug(false);
    resetSyrinscapeMock();
    document.body.innerHTML = '';
    vi.mocked(isSyrinscapeAuthenticated).mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('creates a sound with type mood', () => {
      const sound = new SyrinscapeSound('123', 'mood', 'Battle Music');
      expect(sound.id).toBe('123');
      expect(sound.type).toBe('mood');
      expect(sound.title).toBe('Battle Music');
    });

    it('creates a sound with type sfx', () => {
      const sound = new SyrinscapeSound('456', 'sfx', 'Sword Clash');
      expect(sound.type).toBe('sfx');
    });

    it('creates a sound with type music', () => {
      const sound = new SyrinscapeSound('789', 'music', 'Tavern Song');
      expect(sound.type).toBe('music');
    });

    it('creates a sound with type oneshot', () => {
      const sound = new SyrinscapeSound('101', 'oneshot', 'Thunder');
      expect(sound.type).toBe('oneshot');
    });

    it('converts element type to oneshot', () => {
      const sound = new SyrinscapeSound('202', 'element', 'Lightning');
      expect(sound.type).toBe('oneshot');
    });

    it('throws an error for invalid type', () => {
      expect(() => new SyrinscapeSound('303', 'invalid', 'Bad Sound'))
        .toThrow('Invalid type invalid for SyrinscapeSound.');
    });

    it('throws an error for empty type', () => {
      expect(() => new SyrinscapeSound('404', '', 'No Type'))
        .toThrow('Invalid type  for SyrinscapeSound.');
    });
  });

  describe('renderSpan', () => {
    it('renders a oneshot as an anchor with play emoji', () => {
      const sound = new SyrinscapeSound('100', 'oneshot', 'Thunder');
      const parent = document.createElement('div');
      const span = sound.renderSpan(parent);

      expect(span.classList.contains(SYRINSCAPE_CLASS)).toBe(true);
      const anchor = span.querySelector('a');
      expect(anchor).not.toBeNull();
      expect(anchor!.textContent).toBe('▶️');
      expect(anchor!.title).toBe('Play "Thunder"');
      expect(anchor!.classList.contains('oneshot')).toBe(true);
      expect(anchor!.classList.contains('syrinscape-100')).toBe(true);
    });

    it('renders a oneshot with default title when no title provided', () => {
      const sound = new SyrinscapeSound('100', 'oneshot', '');
      const parent = document.createElement('div');
      const span = sound.renderSpan(parent);
      const anchor = span.querySelector('a');
      expect(anchor!.title).toBe('Play');
    });

    it('renders a mood as a slider toggle', () => {
      const sound = new SyrinscapeSound('200', 'mood', 'Epic Battle');
      const parent = document.createElement('div');
      const span = sound.renderSpan(parent);

      expect(span.classList.contains(SYRINSCAPE_CLASS)).toBe(true);
      const label = span.querySelector('label.switch');
      expect(label).not.toBeNull();
      expect(label!.title).toBe('Play "Epic Battle"');
      const input = span.querySelector('input[type="checkbox"]');
      expect(input).not.toBeNull();
      expect(input!.classList.contains('mood')).toBe(true);
      expect(input!.classList.contains('syrinscape-200')).toBe(true);
      const slider = span.querySelector('span.slider.round.mood');
      expect(slider).not.toBeNull();
    });

    it('renders an sfx as a slider toggle', () => {
      const sound = new SyrinscapeSound('300', 'sfx', 'Rain');
      const parent = document.createElement('div');
      const span = sound.renderSpan(parent);

      const input = span.querySelector('input[type="checkbox"]');
      expect(input!.classList.contains('sfx')).toBe(true);
    });

    it('renders a music as a slider toggle', () => {
      const sound = new SyrinscapeSound('400', 'music', 'Tavern');
      const parent = document.createElement('div');
      const span = sound.renderSpan(parent);

      const input = span.querySelector('input[type="checkbox"]');
      expect(input!.classList.contains('music')).toBe(true);
    });

    it('adds inactive class when not authenticated', () => {
      vi.mocked(isSyrinscapeAuthenticated).mockReturnValue(false);
      const sound = new SyrinscapeSound('200', 'mood', 'Test');
      const parent = document.createElement('div');
      const span = sound.renderSpan(parent);

      const input = span.querySelector('input');
      const slider = span.querySelector('span.slider');
      expect(input!.classList.contains('inactive')).toBe(true);
      expect(slider!.classList.contains('inactive')).toBe(true);
    });

    it('adds inactive class to oneshot when not authenticated', () => {
      vi.mocked(isSyrinscapeAuthenticated).mockReturnValue(false);
      const sound = new SyrinscapeSound('100', 'oneshot', 'Thunder');
      const parent = document.createElement('div');
      const span = sound.renderSpan(parent);

      const anchor = span.querySelector('a');
      expect(anchor!.classList.contains('inactive')).toBe(true);
    });
  });

  describe('slider interaction', () => {
    it('calls startMood when mood checkbox is checked', () => {
      const sound = new SyrinscapeSound('200', 'mood', 'Battle');
      const parent = document.createElement('div');
      document.body.appendChild(parent);
      sound.renderSpan(parent);

      const input = parent.querySelector('input[type="checkbox"]') as HTMLInputElement;
      input.checked = true;
      input.dispatchEvent(new Event('change'));

      expect(syrinscapeMock.player.controlSystem.startMood).toHaveBeenCalledWith('200');
    });

    it('calls stopMood when mood checkbox is unchecked', () => {
      const sound = new SyrinscapeSound('200', 'mood', 'Battle');
      const parent = document.createElement('div');
      document.body.appendChild(parent);
      sound.renderSpan(parent);

      const input = parent.querySelector('input[type="checkbox"]') as HTMLInputElement;
      input.checked = false;
      input.dispatchEvent(new Event('change'));

      expect(syrinscapeMock.player.controlSystem.stopMood).toHaveBeenCalledWith('200');
    });

    it('calls startElements when sfx checkbox is checked', () => {
      const sound = new SyrinscapeSound('300', 'sfx', 'Rain');
      const parent = document.createElement('div');
      document.body.appendChild(parent);
      sound.renderSpan(parent);

      const input = parent.querySelector('input[type="checkbox"]') as HTMLInputElement;
      input.checked = true;
      input.dispatchEvent(new Event('change'));

      expect(syrinscapeMock.player.controlSystem.startElements).toHaveBeenCalledWith(['300']);
    });

    it('calls stopElements when sfx checkbox is unchecked', () => {
      const sound = new SyrinscapeSound('300', 'sfx', 'Rain');
      const parent = document.createElement('div');
      document.body.appendChild(parent);
      sound.renderSpan(parent);

      const input = parent.querySelector('input[type="checkbox"]') as HTMLInputElement;
      input.checked = false;
      input.dispatchEvent(new Event('change'));

      expect(syrinscapeMock.player.controlSystem.stopElements).toHaveBeenCalledWith(['300']);
    });

    it('unchecks other mood checkboxes when a mood is started', () => {
      // Create two mood sounds in the DOM
      const sound1 = new SyrinscapeSound('200', 'mood', 'Battle');
      const sound2 = new SyrinscapeSound('201', 'mood', 'Calm');
      const parent = document.createElement('div');
      document.body.appendChild(parent);
      sound1.renderSpan(parent);
      sound2.renderSpan(parent);

      // Check the first mood
      const inputs = parent.querySelectorAll('input[type="checkbox"]') as NodeListOf<HTMLInputElement>;
      inputs[0].checked = true;
      inputs[0].dispatchEvent(new Event('change'));

      // Now check the second mood
      inputs[1].checked = true;
      inputs[1].dispatchEvent(new Event('change'));

      // First should be unchecked
      expect(inputs[0].checked).toBe(false);
      expect(inputs[1].checked).toBe(true);
    });

    it('clicking span triggers input click', () => {
      const sound = new SyrinscapeSound('200', 'mood', 'Battle');
      const parent = document.createElement('div');
      document.body.appendChild(parent);
      sound.renderSpan(parent);

      const slider = parent.querySelector('span.slider') as HTMLSpanElement;
      const input = parent.querySelector('input[type="checkbox"]') as HTMLInputElement;
      const clickSpy = vi.spyOn(input, 'click');

      slider.dispatchEvent(new Event('click'));
      expect(clickSpy).toHaveBeenCalled();
    });

    it('input click event stops propagation', () => {
      const sound = new SyrinscapeSound('200', 'mood', 'Battle');
      const parent = document.createElement('div');
      document.body.appendChild(parent);
      sound.renderSpan(parent);

      const input = parent.querySelector('input[type="checkbox"]') as HTMLInputElement;
      const event = new Event('click', { bubbles: true });
      const stopSpy = vi.spyOn(event, 'stopPropagation');
      input.dispatchEvent(event);
      expect(stopSpy).toHaveBeenCalled();
    });
  });

  describe('oneshot interaction', () => {
    it('calls startElements when play button is clicked', () => {
      const sound = new SyrinscapeSound('100', 'oneshot', 'Thunder');
      const parent = document.createElement('div');
      document.body.appendChild(parent);
      sound.renderSpan(parent);

      const anchor = parent.querySelector('a') as HTMLAnchorElement;
      anchor.dispatchEvent(new Event('click'));

      expect(syrinscapeMock.player.controlSystem.startElements).toHaveBeenCalledWith(['100']);
    });
  });

  describe('callSyrinscapeApi', () => {
    it('calls startMood for mood play', () => {
      const sound = new SyrinscapeSound('200', 'mood', 'Battle');
      sound.callSyrinscapeApi('play');
      expect(syrinscapeMock.player.controlSystem.startMood).toHaveBeenCalledWith('200');
    });

    it('calls stopMood for mood stop', () => {
      const sound = new SyrinscapeSound('200', 'mood', 'Battle');
      sound.callSyrinscapeApi('stop');
      expect(syrinscapeMock.player.controlSystem.stopMood).toHaveBeenCalledWith('200');
    });

    it('calls startElements for oneshot play', () => {
      const sound = new SyrinscapeSound('100', 'oneshot', 'Thunder');
      sound.callSyrinscapeApi('play');
      expect(syrinscapeMock.player.controlSystem.startElements).toHaveBeenCalledWith(['100']);
    });

    it('calls stopElements for oneshot stop', () => {
      const sound = new SyrinscapeSound('100', 'oneshot', 'Thunder');
      sound.callSyrinscapeApi('stop');
      expect(syrinscapeMock.player.controlSystem.stopElements).toHaveBeenCalledWith(['100']);
    });

    it('calls startElements for sfx play', () => {
      const sound = new SyrinscapeSound('300', 'sfx', 'Rain');
      sound.callSyrinscapeApi('play');
      expect(syrinscapeMock.player.controlSystem.startElements).toHaveBeenCalledWith(['300']);
    });

    it('does nothing when not authenticated', () => {
      vi.mocked(isSyrinscapeAuthenticated).mockReturnValue(false);
      const sound = new SyrinscapeSound('200', 'mood', 'Battle');
      sound.callSyrinscapeApi('play');
      expect(syrinscapeMock.player.controlSystem.startMood).not.toHaveBeenCalled();
    });

    it('shows notice on error', async () => {
      vi.mocked(isSyrinscapeAuthenticated).mockReturnValue(true);
      syrinscapeMock.player.controlSystem.startMood.mockRejectedValueOnce(new Error('Connection failed'));
      const sound = new SyrinscapeSound('200', 'mood', 'Battle');
      await expect(sound.callSyrinscapeApi('play')).resolves.not.toThrow();
    });

    it('shows authorization notice and deactivates slider on 403 error', async () => {
      vi.mocked(isSyrinscapeAuthenticated).mockReturnValue(true);
      syrinscapeMock.player.controlSystem.startMood.mockRejectedValueOnce(new Error('403 Forbidden'));
      const sound = new SyrinscapeSound('200', 'mood', 'Battle');
      const parent = document.createElement('div');
      document.body.appendChild(parent);
      sound.renderSpan(parent);

      const input = parent.querySelector('input[type="checkbox"]') as HTMLInputElement;
      input.checked = true;

      await sound.callSyrinscapeApi('play');

      expect(input.checked).toBe(false);
    });

    it('detects forbidden error message as authorization error', async () => {
      vi.mocked(isSyrinscapeAuthenticated).mockReturnValue(true);
      syrinscapeMock.player.controlSystem.startElements.mockRejectedValueOnce(new Error('User is not authorized'));
      const sound = new SyrinscapeSound('100', 'oneshot', 'Thunder');
      const parent = document.createElement('div');
      document.body.appendChild(parent);
      sound.renderSpan(parent);

      await sound.callSyrinscapeApi('play');
      // Should not throw, handled internally
    });

    it('detects object with status 403 as authorization error', async () => {
      vi.mocked(isSyrinscapeAuthenticated).mockReturnValue(true);
      syrinscapeMock.player.controlSystem.startMood.mockRejectedValueOnce({ status: 403 });
      const sound = new SyrinscapeSound('200', 'mood', 'Battle');
      const parent = document.createElement('div');
      document.body.appendChild(parent);
      sound.renderSpan(parent);

      const input = parent.querySelector('input[type="checkbox"]') as HTMLInputElement;
      input.checked = true;

      await sound.callSyrinscapeApi('play');

      expect(input.checked).toBe(false);
    });

    it('deactivateSlider resets artwork for mood type', async () => {
      vi.mocked(isSyrinscapeAuthenticated).mockReturnValue(true);
      syrinscapeMock.player.controlSystem.startMood.mockRejectedValueOnce(new Error('403'));
      const sound = new SyrinscapeSound('200', 'mood', 'Battle');
      const parent = document.createElement('div');
      document.body.appendChild(parent);
      sound.renderSpan(parent);

      await sound.callSyrinscapeApi('play');

      expect(resetArtwork).toHaveBeenCalled();
    });

    it('deactivateSlider does not reset artwork for non-mood type', async () => {
      vi.mocked(isSyrinscapeAuthenticated).mockReturnValue(true);
      syrinscapeMock.player.controlSystem.startElements.mockRejectedValueOnce(new Error('403'));
      const sound = new SyrinscapeSound('300', 'sfx', 'Rain');
      const parent = document.createElement('div');
      document.body.appendChild(parent);
      sound.renderSpan(parent);

      vi.mocked(resetArtwork).mockClear();
      await sound.callSyrinscapeApi('play');

      expect(resetArtwork).not.toHaveBeenCalled();
    });

    it('treats non-Error non-object as non-authorization error', async () => {
      vi.mocked(isSyrinscapeAuthenticated).mockReturnValue(true);
      syrinscapeMock.player.controlSystem.startMood.mockRejectedValueOnce('string error');
      const sound = new SyrinscapeSound('200', 'mood', 'Battle');

      await expect(sound.callSyrinscapeApi('play')).resolves.not.toThrow();
    });
  });

  describe('registerForSyrinscapeEvents', () => {
    it('registers stop and start element listeners', () => {
      registerForSyrinscapeEvents();
      expect(syrinscapeMock.events.stopElement.addListener).toHaveBeenCalled();
      expect(syrinscapeMock.events.startElement.addListener).toHaveBeenCalled();
    });
  });

  describe('unregisterForSyrinscapeEvents', () => {
    it('calls unsubscribe callbacks and clears listener arrays', () => {
      registerForSyrinscapeEvents();
      syrinscapeMock.player.syncSystem.events.onChangeMood._listeners.push(() => {});
      syrinscapeMock.player.syncSystem.events.onChangeSoundset._listeners.push(() => {});

      unregisterForSyrinscapeEvents();

      expect(syrinscapeMock.player.syncSystem.events.onChangeMood._listeners.length).toBe(0);
      expect(syrinscapeMock.player.syncSystem.events.onChangeSoundset._listeners.length).toBe(0);
    });
  });

  describe('setAllStopped', () => {
    it('removes playing class from all elements', () => {
      document.body.innerHTML = `
        <span class="playing syrinscape-100">test</span>
        <span class="${SYRINSCAPE_CLASS}"><input type="checkbox" checked /></span>
      `;
      setAllStopped();

      expect(document.querySelector('.playing')).toBeNull();
      const input = document.querySelector('input') as HTMLInputElement;
      expect(input.checked).toBe(false);
    });

    it('calls resetArtwork', () => {
      setAllStopped();
      expect(resetArtwork).toHaveBeenCalled();
    });
  });

  describe('stopElement', () => {
    it('removes playing class and unchecks matching elements', () => {
      document.body.innerHTML = `
        <span class="playing syrinscape-42">test</span>
        <input type="checkbox" class="syrinscape-42" checked />
      `;
      const event = { detail: { elementId: 42, playlistEntryId: 1, timeToStop: 0, sampleId: 1 } } as CustomEvent<{ elementId: number; playlistEntryId: number; timeToStop: number; sampleId: number }>;
      stopElement(event);

      expect(document.querySelector('.playing')).toBeNull();
      const input = document.querySelector('input') as HTMLInputElement;
      expect(input.checked).toBe(false);
    });

    it('does not affect elements with different ids', () => {
      document.body.innerHTML = `
        <span class="playing syrinscape-99">test</span>
      `;
      const event = { detail: { elementId: 42, playlistEntryId: 1, timeToStop: 0, sampleId: 1 } } as CustomEvent<{ elementId: number; playlistEntryId: number; timeToStop: number; sampleId: number }>;
      stopElement(event);

      expect(document.querySelector('.playing')).not.toBeNull();
    });
  });

  describe('startElement', () => {
    it('adds playing class to matching oneshot elements', () => {
      vi.useFakeTimers();
      document.body.innerHTML = `
        <a class="oneshot syrinscape-55">▶️</a>
      `;
      const event = { detail: { elementId: 55, timeToFirstSample: '0' } } as CustomEvent<{ elementId: number; timeToFirstSample: string }>;
      startElement(event);

      expect(document.querySelector('.playing')).not.toBeNull();

      // After 3 seconds, playing class should be removed
      vi.advanceTimersByTime(3000);
      expect(document.querySelector('.playing')).toBeNull();
      vi.useRealTimers();
    });

    it('does not affect non-oneshot elements', () => {
      document.body.innerHTML = `
        <input class="mood syrinscape-55" />
      `;
      const event = { detail: { elementId: 55, timeToFirstSample: '0' } } as CustomEvent<{ elementId: number; timeToFirstSample: string }>;
      startElement(event);

      expect(document.querySelector('.playing')).toBeNull();
    });
  });
});
