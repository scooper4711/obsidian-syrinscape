// syrinscape.d.ts
declare global {
    const syrinscape: {
        [x: string]: unknown;
        visualisation: {
            add(arg0: string, arg1: () => boolean): unknown;
            d3VisualiseFrequencyData(data: { frequency: number[]; waveform: number[]; }, label: string): void;
            d3VisualiseWaveformData(data: { frequency: number[]; waveform: number[]; }, label: string): void;
        };
        events: {
            playerActive: {
                listeners: ((arg0: (event: CustomEvent) => void)=>void)[];
                addListener: (arg0: (event: CustomEvent) => void) => () => void;
            };
            stopElement: {
                listeners: ((arg0: (event: CustomEvent) => void)=>void)[];
                addListener: (arg0: (event: CustomEvent) => void) => () => void;
            };
            startElement: {
                listeners: ((arg0: (event: CustomEvent) => void)=>void)[];
                addListener: (arg0: (event: CustomEvent) => void) => () => void;
            };
            stopSample: {
                listeners: ((arg0: (event: CustomEvent) => void)=>void)[];
                addListener: (arg0: (event: CustomEvent) => void) => () => void;
            };
            startSample: unknown;
            startVisualisation: unknown;
            setLocalVolume: {
                listeners: ((arg0: (event: CustomEvent) => void)=>void)[];
                addListener: (arg0: (event: CustomEvent) => void) => () => void;                
            };
            updateConfig: {
                listeners: ((arg0: (event: CustomEvent) => void)=>void)[];
                addListener: (arg0: (event: CustomEvent) => void) => () => void;
};
        }
        player: {
            elementSystem: {oneshotSystem: {setVolume(volume: string): void;};};
            syncSystem: {
                events: {
                    onChangeMood: {
                        addListener: (arg0: (event: CustomEvent) => void) => () => void;
                        removeListener: (arg0: (event: CustomEvent) => void) => void;
                    }
                    onChangeSoundset: {
                        addListenerOneshot(event: CustomEvent<{artwork: string, pk: number, title: string}>): () => void;
                        addListener: (arg0: (event: CustomEvent) => void) => () => void;
                        removeListener: (arg0: (event: CustomEvent) => void) => void;
                    }
                };
            };
            init: (arg0: { configure(): Promise<void>; onActive(): void; onInactive(): void; }) => void;
            controlSystem: {
                stopElements(soundid: string[]): unknown;
                startElements(soundid: string[]): unknown;
                stopMood(soundid: string): unknown;
                startMood(soundid: string): unknown;
                stopAll(): void;
            }
            audioSystem: {
                setLocalVolume(volume: string): void;
                toggleMute(): void;
            }
            audioEffectSystem: {
                analyser: {
                    isActive: boolean;
                    getData(): {
                        frequency: number[];
                        waveform: number[];
                    };
                };
            };
        };
        volume: number;
        config: {
            init(): unknown;
            audioContext: AudioContext;
            authenticated: boolean;
            token: string;
            sync(): void;
            sessionId: string;
            lastLocalVolume: string;
            addListener(callback: () => void): void;
        };
        integration: {
            events: unknown;
            requestAuthToken(sessionId?: string): void;
            launchAsGameMaster(): void;
        };
    };
}

export {syrinscape};
