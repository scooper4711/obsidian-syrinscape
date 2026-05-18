import { vi } from 'vitest';

function createEventEmitter() {
  return {
    listeners: [] as ((event: unknown) => void)[],
    _listeners: [] as ((event: unknown) => void)[],
    addListener: vi.fn(function (this: { listeners: ((event: unknown) => void)[] }, cb: (event: unknown) => void) {
      this.listeners.push(cb);
      return () => {
        const idx = this.listeners.indexOf(cb);
        if (idx >= 0) this.listeners.splice(idx, 1);
      };
    }),
    removeListener: vi.fn(function (this: { listeners: ((event: unknown) => void)[] }, cb: (event: unknown) => void) {
      const idx = this.listeners.indexOf(cb);
      if (idx >= 0) this.listeners.splice(idx, 1);
    }),
  };
}

export const syrinscapeMock = {
  visualisation: {
    add: vi.fn((_label: string, _cb: () => boolean) => {}),
    d3VisualiseFrequencyData: vi.fn(),
    d3VisualiseWaveformData: vi.fn(),
  },
  events: {
    playerActive: createEventEmitter(),
    stopElement: createEventEmitter(),
    startElement: createEventEmitter(),
    stopSample: createEventEmitter(),
    startSample: createEventEmitter(),
    startVisualisation: createEventEmitter(),
    setLocalVolume: createEventEmitter(),
    updateConfig: createEventEmitter(),
  },
  player: {
    elementSystem: {
      oneshotSystem: {
        setVolume: vi.fn(),
      },
    },
    syncSystem: {
      events: {
        onChangeMood: {
          ...createEventEmitter(),
          _listeners: [] as ((event: unknown) => void)[],
        },
        onChangeSoundset: {
          ...createEventEmitter(),
          _listeners: [] as ((event: unknown) => void)[],
          addListenerOneshot: vi.fn(),
        },
      },
    },
    init: vi.fn(),
    controlSystem: {
      stopElements: vi.fn(),
      startElements: vi.fn(),
      stopMood: vi.fn(),
      startMood: vi.fn(),
      stopAll: vi.fn(),
    },
    audioSystem: {
      setLocalVolume: vi.fn(),
      toggleMute: vi.fn(),
    },
    audioEffectSystem: {
      analyser: {
        isActive: true,
        getData: vi.fn(() => ({ frequency: [0], waveform: [0] })),
      },
    },
  },
  volume: 1,
  config: {
    init: vi.fn().mockResolvedValue(undefined),
    audioContext: null as AudioContext | null,
    authenticated: true,
    token: '',
    sync: vi.fn(),
    sessionId: 'test-session',
    lastLocalVolume: '1',
    addListener: vi.fn(),
  },
  integration: {
    events: {},
    requestAuthToken: vi.fn(),
    launchAsGameMaster: vi.fn(),
  },
};

export function resetSyrinscapeMock() {
  syrinscapeMock.config.authenticated = true;
  syrinscapeMock.config.token = '';
  syrinscapeMock.events.playerActive.listeners = [];
  syrinscapeMock.events.stopElement.listeners = [];
  syrinscapeMock.events.startElement.listeners = [];
  syrinscapeMock.events.setLocalVolume.listeners = [];
  syrinscapeMock.events.updateConfig.listeners = [];
  syrinscapeMock.player.syncSystem.events.onChangeMood._listeners = [];
  syrinscapeMock.player.syncSystem.events.onChangeSoundset._listeners = [];
  vi.clearAllMocks();
}
