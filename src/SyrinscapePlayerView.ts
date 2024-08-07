import { ItemView, Notice, WorkspaceLeaf } from "obsidian";
import SyrinscapePlugin from "./main";
import { debug } from "./SyrinscapeDebug";
import { registerForSyrinscapeEvents, unregisterForSyrinscapeEvents, setAllStopped, SYRINSCAPE_CLASS } from "SyrinscapeSound";
export const VIEW_TYPE = "syrinscape-player";

export class SyrinscapePlayerView extends ItemView {
    plugin: SyrinscapePlugin;
    ctaDiv: HTMLDivElement|null; 
    interfaceDiv: HTMLDivElement|null;
    syrinscapeDiv: HTMLDivElement|null;
    visualisationsDiv: HTMLDivElement|null;
    controlsDiv: HTMLDivElement|null;
    loginDiv: HTMLDivElement|null;
    title: HTMLHeadingElement | null;
    localVolume: HTMLInputElement | null;
    mute: HTMLButtonElement | null;
    unsubscribeCallbacks: (() => void)[] = [];

    constructor(leaf: WorkspaceLeaf, plugin: SyrinscapePlugin) {
        super(leaf);
        this.plugin = plugin;
        this.icon = 'music';
    }

    getViewType() {
        return VIEW_TYPE;
    }

    getDisplayText() {
        return "Syrinscape player";
    }

    /**
     * Build the Syrinscape player view.
     */
    async onOpen() {
        const container = this.containerEl.children[1];
        container.empty();
        try {
            this.syrinscapeDiv = container.createDiv({ cls: 'syrinscape' });
            this.ctaDiv = this.syrinscapeDiv.createDiv({ cls: 'cta alert' });
            this.interfaceDiv = this.syrinscapeDiv.createDiv({ cls: 'interface' });
            const visualisationsContainerDiv = this.interfaceDiv.createDiv({ cls: 'visualisations-container' });
            this.visualisationsDiv = visualisationsContainerDiv.createDiv({ cls: 'visualisations' });
            this.buildVisualizer(this.visualisationsDiv);
            this.buildActivateButton(this.ctaDiv);
            this.buildLaunchButton(this.interfaceDiv);
            this.controlsDiv = this.interfaceDiv.createDiv({ cls: 'controls' });
            this.buildStopButton(this.controlsDiv);
            // create a button with the image of the syrinscape logo
            // Set local volume when the slider changes
            this.buildVolumeControls(this.controlsDiv);
            this.title = this.interfaceDiv.createDiv({ cls: 'title' }).createEl('h2', { text: 'Syrinscape Player' });
            this.controlsDiv.style.display = 'none';
            this.loginDiv = this.interfaceDiv.createDiv({ cls: 'syrinscape-alert' });
            this.buildLoginButton(this.loginDiv);
        } catch (error) {
            console.error('Syrinscape - Error building view:', error);
            new Notice('Failed to build Syrinscape player view');
            const container = this.containerEl.children[1];
            container.empty();
            this.buildErrorScreen(container);
        }
        this.app.workspace.onLayoutReady(this.activateSyrinscape.bind(this));
    }

    /**
     * Build an error screen with a reload button that reloads the view.
     * @param container the container to append the error screen to
     */
    private buildErrorScreen(container: Element) {
        const errorDiv = container.createDiv({ cls: 'alert' });
        errorDiv.createEl('h3', { text: 'Failed to build Syrinscape player view' });
        errorDiv.createEl('p', { text: 'Please check the console for more information.' });
        errorDiv.createEl('button', { text: 'Reload', cls: 'syrinscape-reload' }).addEventListener('click', () => {
            this.onOpen();
        });
    }

    /**
     * Build a h3 element saying "Authorization required"
     * and explanatory text below it using a flex box.
     * @param parentDiv the div to append the login button to.
     * @returns the login button element
     */
    private buildLoginButton(parentDiv: HTMLDivElement) {
        const alertDiv = parentDiv.createDiv({ cls: 'alert' });
        alertDiv.createEl('h3', { text: 'Authorization required' });
        alertDiv.createEl('p', { text: 'Please enter your authentication token in preferences.' });
        alertDiv.createEl('button', { text: 'Reload', cls: 'syrinscape-reload' }).addEventListener('click', () => {
            this.onOpen();
        });
    }

    /**
     * Build the button to activate the syrinscape player - this is where the websocket is established.
     * Assumes that the syrinscape scripts have been loaded and the global syrinscape object is available.
     * @param ctaDiv the div to append the button to
     * @param interfaceDiv the div to show when the player is activated
     * @returns the activate button element
     */
    private buildActivateButton(ctaDiv: HTMLDivElement) {
        const activateButton = ctaDiv.createEl('button', { text: 'Activate' });
        activateButton.addEventListener('click', this.activateSyrinscape.bind(this));
        activateButton.setAttribute('aria-label', 'Activate Syrinscape player');
        return activateButton;
    }

    /**
     * Create the launch button that opens the syrinscape player in an external browser.
     * @param controlsDiv the div to append the button to
     * @returns the launch button element
     */
    private buildLaunchButton(controlsDiv: HTMLDivElement) {
        const launch = controlsDiv.createEl('input', { cls: 'launch', type: 'image' });
        launch.setAttribute('src', 'https://app.syrinscape.com/static/basic-player/logo.png');
        launch.setAttribute('width', '100%');
        launch.setAttribute('aria-label', 'Launch Syrinscape player in an external browser');
        launch.addEventListener('click', () => {
            syrinscape.integration.launchAsGameMaster();
        });
        return launch;
    }

    /**
     * Create the button that stops all sounds.
     * @param controlsDiv the div to append the button to
     * @returns the stop button element
     */
    private buildStopButton(controlsDiv: HTMLDivElement) {
        const stopAll = controlsDiv.createEl('button', { cls: 'stopAll', text: '⏹️' });
        stopAll.addEventListener('click', () => {
            syrinscape.player.controlSystem.stopAll();
            setAllStopped();
        });
        stopAll.setAttribute('aria-label', 'Stop all sounds');
        return stopAll;
    }

    /**
     * Build the volume controls for the player - a slider and a mute button.
     * @param parentDiv the div to append the volume controls to
     * @returns an object containing the volume slider and mute button elements
     */
    private buildVolumeControls(parentDiv: HTMLDivElement) {
        const volumeStack = parentDiv.createDiv({ cls: 'volume-stack' });

        this.localVolume = this.createVolumeSlider(volumeStack, 'local-volume', (value) => {
            syrinscape.player.audioSystem.setLocalVolume(value);
            syrinscape.config.lastLocalVolume = value;
        }, 'Local');
        
        this.createVolumeSlider(volumeStack, 'oneshot-volume', (value) => {
            syrinscape.player.elementSystem.oneshotSystem.setVolume(value);
        }, 'One-shot');
        this.mute = parentDiv.createEl('button', { cls: 'mute', text: '🔈' });
        this.mute.addEventListener('click', () => {
            syrinscape.player.audioSystem.toggleMute();
        });
        this.mute.setAttribute('aria-label', 'Mute');
    }

    private createVolumeSlider(parentDiv: HTMLDivElement, sliderClass: string, setVolumeFunction: (e:string) => void, volumeType: string) {
        const volumeSlider = parentDiv.createEl('input', { cls: sliderClass, type: 'range' });
        volumeSlider.min = '0';
        volumeSlider.max = '1.5';
        volumeSlider.step = '0.01';
        volumeSlider.value = '1';
    
        // Create a tooltip element
        const volumeTooltip = parentDiv.createDiv({ cls: 'volume-tooltip' });
        volumeTooltip.style.position = 'absolute';
        volumeTooltip.style.display = 'none'; // Initially hidden
    
        const updateTooltip = () => {
            const volumePercentage = Math.round(Number(volumeSlider.value) * 100);
            volumeTooltip.textContent = `${volumeType} Volume: ${volumePercentage}%`;
        
            // Calculate the left edge of the tooltip as ofset from the volume div
            const tooltipLeft = volumeSlider.offsetLeft + 30;
        
            // Adjust the tooltip position
            volumeTooltip.style.left = `${tooltipLeft}px`;
            volumeTooltip.style.top = `${volumeSlider.offsetTop - 40}px`; // Adjust as needed
            volumeTooltip.style.display = 'block';
        };    
        volumeSlider.addEventListener('input', () => {
            setVolumeFunction(volumeSlider.value);
            updateTooltip();
        });
    
        volumeSlider.addEventListener('change', () => {
            setVolumeFunction(volumeSlider.value);
            updateTooltip();
        });
    
        // Optionally, hide the tooltip when not interacting
        volumeSlider.addEventListener('mouseenter', () => {updateTooltip()});
        volumeSlider.addEventListener('mouseleave', () => volumeTooltip.style.display = 'none');
    
        return volumeSlider;
    }

    /**
     * Build the visualiser for the player.
     * @param visualisationsDiv the div to append the visualisations to
     * @returns an object containing the frequency and waveform visualiser elements
     */
    private buildVisualizer(visualisationsDiv: HTMLDivElement) {
        const frequency = visualisationsDiv.createSvg('svg', { cls: 'd3-frequency' });
        const waveform = visualisationsDiv.createSvg('svg', { cls: 'd3-waveform' });

        return { 'frequency': frequency, 'waveform': waveform }
    }

    /**
     * Activate the Syrinscape player - establishing a websocket to syrinscape and
     * setting up event listeners for the player.
     * Must be called only once per view and only after the syrinscape object is available
     * and after onOpen has been called.
     */
    public async activateSyrinscape() {
        // Get the global variable syrinscape from the document. If it's not available, log an error and return.
        if (!isSyrinscapeDefined()) {
            console.error('Syrinscape - Syrinscape player not loaded.');
            new Notice('Failed to load Syrinscape player. Please check the console for more information.');
            return;
        }
        await syrinscape.config.init();
        // syrinscape.events.playerActive.listeners.remove(this.listeners['syrinscape.playerActive']);
        this.unsubscribeCallbacks.push(syrinscape.events.playerActive.addListener(this.playerActive.bind(this)));
        
        const authToken = this.plugin.settings.authToken;
        const ctaDiv = this.ctaDiv;
        const interfaceDiv = this.interfaceDiv;
        this.subscribeToConfigUpdates();
        debug('Logging in to Syrinscape player.');
        syrinscape.player.init({
            async configure() {
                loginToSyrinscape(authToken);
            },

            onActive() {
                if (isSyrinscapeAuthenticated()) {
                    console.log("Syrinscape - successfully logged in to app.syrinscape.com.")
                    // remove inactive from all syrinscape elements
                    document.querySelectorAll(`.${SYRINSCAPE_CLASS} a.inactive`).forEach((element) => {
                        element.classList.remove('inactive');
                    });                    
                    document.querySelectorAll(`.${SYRINSCAPE_CLASS} input.inactive`).forEach((element) => {
                        element.classList.remove('inactive');
                    });                    
                    document.querySelectorAll(`.${SYRINSCAPE_CLASS} span.inactive`).forEach((element) => {
                        element.classList.remove('inactive');
                    });                    

                } else {
                    console.log("Syrinscape - failed to log in. Please check your authentication token.")
                    // add inactive from all syrinscape elements
                    document.querySelectorAll(`.${SYRINSCAPE_CLASS} a`).forEach((element) => {
                        element.classList.add('inactive');
                    });
                    
                    new Notice('Failed to log in to Syrinscape player. Please check your authentication token in preferences.');
                }
                if (ctaDiv) ctaDiv.style.display = 'none';
                if (interfaceDiv) interfaceDiv.style.display = 'block';
            },

            onInactive() {
                debug("logged out/deactivated.")
                // add inactive from all syrinscape elements
                document.querySelectorAll(`.${SYRINSCAPE_CLASS} a`).forEach((element) => {
                    element.classList.add('inactive');
                });
                if (ctaDiv) ctaDiv.style.display = 'block';
                if (interfaceDiv) interfaceDiv.style.display = 'none';
            },
        });
        
    }

    private playerActive() {
        debug('Player active.');
        registerForSyrinscapeEvents();
        if (this.localVolume) this.localVolume.value = syrinscape.config.lastLocalVolume || '1';

        this.subscribeToArtworkChanges();
        this.subscribeToVolumeEvents();
        this.subscribeToVisualizerUpdates();
    }
    /**
     * Subscribe to undocumented APIs to allow for updating the player view background image and title.
     */
    private subscribeToArtworkChanges() {
        const events = syrinscape.player.syncSystem.events;
        // Set the title to the current song title
        events.onChangeMood.addListener(this.updateTitle.bind(this));
        // Set the backround image of the syrinscape div to the current soundset image
        events.onChangeSoundset.addListener(this.updateArtwork.bind(this));
    }

    private updateTitle(event: {title: string, pk: string}) {
        if (this.title) this.title.textContent = event.title;
    }

    private updateArtwork(event: {artwork: string}) {
        if (this.syrinscapeDiv) this.syrinscapeDiv.style.backgroundImage = `url(${event.artwork})`;
    }

    /**
     * Subscribe to the visualiser updates to update the frequency and waveform visualisations.
     */
    private subscribeToVisualizerUpdates() {
        syrinscape.visualisation.add('global', () => {
            // Get combined frequency and waveform data.
            const data = syrinscape.player.audioEffectSystem.analyser.getData();

            // Visualise frequency and waveform data.
            // You can replace this section to visualise the data any way you like.
            syrinscape.visualisation.d3VisualiseFrequencyData(data, '.d3-frequency');
            syrinscape.visualisation.d3VisualiseWaveformData(data, '.d3-waveform')
            // If analyser is still active, report that visualiser is still active.
            // If no visualisers are active, visualisation loop will be paused.
            return syrinscape.player.audioEffectSystem.analyser.isActive;
        });
    }

    /**
     * Subscribe to config updates to show/hide the login div and show/hide the player interface.
     */
    private subscribeToConfigUpdates() {
        this.unsubscribeCallbacks.push(syrinscape.events.updateConfig.addListener(this.configUpdated.bind(this)));
    }

    private configUpdated(event: { detail: { authenticated: boolean; }; }) {
        if (!this.loginDiv || !this.title || !this.controlsDiv || !this.visualisationsDiv) return;
        debug('updateConfig: ', event);
        if (event.detail.authenticated || syrinscape.config?.authenticated) {
            this.loginDiv.style.display = 'none';
            this.title.style.display = 'block';
            this.controlsDiv.style.display = 'flex';
            this.visualisationsDiv.style.display = 'block';
        } else {
            this.loginDiv.style.display = 'flex';
            this.title.style.display = 'none';
            this.controlsDiv.style.display = 'none';
            this.visualisationsDiv.style.display = 'none';
        }
    }
    /**
     * Subscribe to volume events to update the local volume slider and mute button.
     */
    private subscribeToVolumeEvents() {
        this.unsubscribeCallbacks.push(syrinscape.events.setLocalVolume.addListener(this.setLocalVolume.bind(this)));
    }

    /**
     * Update the local volume slider and mute button based on slider movement.
     * @param event the event containing the volume value
     * @returns void
     */
    private setLocalVolume(event: { detail: string; }): void {
        if (!this.localVolume || !this.mute) return;
        this.localVolume.value = event.detail;
        const volume = Number(event.detail);
        if (volume === 0) {
            this.mute.textContent = '🔇';
        } else {
            if (volume < 0.5) {
                this.mute.textContent = '🔈';
            } else if (volume < 1) {
                this.mute.textContent = '🔉';
            } else {
                this.mute.textContent = '🔊';
            }
        }
    }
    /**
     * Called when the view is closed.
     */
    async onClose(): Promise<void> {
        debug('Closing view.');
        setAllStopped();
        if (syrinscape.config) {
            syrinscape.player.controlSystem.stopAll();
        }
    }
    onunload(): void {
        debug('Unloading view');
        unregisterForSyrinscapeEvents()
        syrinscape.visualisation.add('global', () => {return false});
        while (this.unsubscribeCallbacks.length > 0) {
            const unsubscribe = this.unsubscribeCallbacks.pop();
            // confirm that unsubscribe is a function before calling it
            if (unsubscribe && typeof unsubscribe === 'function') {
                unsubscribe();
            }
        }
        debug('Unsubscribed from all events.');
    }

}

function loginToSyrinscape(authToken: string) {
    try {
        if (!syrinscape.config.audioContext)
            syrinscape.config.audioContext = new AudioContext();
        // Auth token.
        syrinscape.config.token = authToken;
        // Wait until async token change is finished, because `sessionId` might change.
        syrinscape.config.sync();
    } catch (error) {
        console.error('Syrinscape - Error configuring player:', error);
        new Notice('Failed to configure Syrinscape player. Please check the console for more information.');
    }
}

/**
 * 
 * @returns true if the syrinscape object is defined in the window, false otherwise
 */
export function isSyrinscapeDefined() {
    return 'syrinscape' in window;

}
/**
 * 
 * @returns true if the syrinscape object is defined in the window and has the necessary properties, false otherwise
 */
export function isSyrinscapeLoaded() {
    try {
        return isSyrinscapeDefined() && syrinscape.config && syrinscape.player && syrinscape.player.syncSystem && syrinscape.player.syncSystem.events;
    } catch (error) {
        return false;
    }
    
}

/**
 * 
 * @returns true if the syrinscape object is defined in the window and is authenticated, false otherwise
 */
export function isSyrinscapeAuthenticated() {
    try {
        return isSyrinscapeLoaded() && syrinscape.config.authenticated;
    } catch (error) {
        return false;
    }
}

export function resetArtwork() {
    // get the syrinscape player div and set the background image to the default image
    document.querySelectorAll('.syrinscape').forEach((element) => {
        const syrinscapeDiv = element as HTMLDivElement;
        syrinscapeDiv.style.backgroundImage = 'url("https://syrinscape.com/static/img/BG-Base.jpg")';
    });
    // reset the title to "Syrinscape Player"
    document.querySelectorAll('.title h2').forEach((element) => {
        const title = element as HTMLHeadingElement;
        title.textContent = 'Syrinscape Player';
    });
}

