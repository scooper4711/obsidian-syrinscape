// syrinscape.d.ts
declare global {
    var syrinscape: {
        [x: string]: any;
        visualisation: any;
        events: {
            playerActive: any;
            stopElement: any;
            startElement: any;
            stopSample: any;
            startSample: any;
            startVisualisation: any;
            setLocalVolume: any;
            updateConfig: {
                listeners: any;
                addListener: (arg0: (event: CustomEvent) => void) => void;
};
        }
        player: {
            elementSystem: any;
            syncSystem: any;
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
                    isActive: any;
                    isActivate: boolean;
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
            events: any;
            requestAuthToken(sessionId?: string): void;
            launchAsGameMaster(): void;
        };
    };
}

export {syrinscape};
