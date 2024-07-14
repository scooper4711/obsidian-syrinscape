export const SYRINSCAPE_CLASS = 'syrinscape-markdown';
import { Notice } from "obsidian";
import { debug } from "./SyrinscapeDebug";
import { isSyrinscapeAuthenticated } from "SyrinscapePlayerView";

const listeners = {
    'syrinscape.startMood': startMood.bind(this), 
    'syrinscape.oneShotChanged': oneshotChanged.bind(this), 
    'syrinscape.startElement': startElement.bind(this), 
    'syrinscape.stopElement': stopElement.bind(this), 
    'syrinscape.stopSample': stopSample.bind(this)}
const unsubscribeCallbacks: (() => void)[] = [];

export class SyrinscapeSound {
    constructor(
        readonly id: string,
        readonly type: string,
        readonly title: string,
    ) {
        if (type === 'element') {
            this.type = 'oneshot'
        }
    }

    public renderSpan(element: HTMLElement) {
        const syrinscapeDiv = element.createEl("span", { cls: SYRINSCAPE_CLASS });
        if (this.type === 'oneshot') {
            this.renderPlayStop(syrinscapeDiv);
        } else {
            this.renderCheckbox(syrinscapeDiv);
        }
        return syrinscapeDiv;
    }

    private renderCheckbox(syrinscapeDiv: HTMLSpanElement) {
        const label = syrinscapeDiv.createEl("label", { cls: 'switch' });
        const input = label.createEl("input", { type: 'checkbox', cls: `syrinscape-${this.type}-${this.id}` });
        const span = label.createEl("span", { cls: 'slider round' });
        input.addEventListener('change', (e) => {
            if (input.checked) {
                this.callSyrinscapeApi("play");
            } else {
                this.callSyrinscapeApi("stop");
            }
        });
    }

    private renderPlayStop(syrinscapeDiv: HTMLSpanElement) {
        const playText = '▶️';
        const stopText = '⏹️';
        // make an anchor with the class play, the text ▶️ and hovertext of "Play ${soundTitle}" if it's set, or just "Play"
        const play = syrinscapeDiv.createEl("a", { cls: `play ${this.type} syrinscape-play-${this.id}`, text: playText, title: this.title ? `Play "${this.title}"` : "Play" });
        if (!isSyrinscapeAuthenticated()) {
            debug('Not authenticated, disabling play button.');
            play.addClass('inactive');
        }
        play.addEventListener("click", (e) => {
            e.preventDefault();
            this.callSyrinscapeApi("play");
        });
        const stop = syrinscapeDiv.createEl("a", { cls: `stop ${this.type} syrinscape-stop-${this.id}`, text: stopText, title: this.title ? `Stop "${this.title}"` : "Stop" });
        if (!isSyrinscapeAuthenticated()) {
            debug('Not authenticated, disabling stop button.');
            stop.addClass('inactive');
        }
        stop.addEventListener("click", (e) => {
            e.preventDefault();
            this.callSyrinscapeApi("stop");
        });
    }

    /**
    * Uses the local Syrinscape player to control the sound.
    * @param cmd - The command to send to the local player - either play or stop.
    */
    public callSyrinscapeApi(cmd: string) {
        debug(cmd," ", this.title,"-",this.id,"-",this.type);
        try {
            if (isSyrinscapeAuthenticated()) {
                if (this.type === 'mood') {
                    if (cmd === 'play') {
                        syrinscape.player.controlSystem.startMood(this.id);
                        document.querySelectorAll(`.syrinscape-play-${this.id}`).forEach((element) => {
                            element.classList.add('playing');
                          });
                          document.querySelectorAll(`.syrinscape-stop-${this.id}`).forEach((element) => {
                            element.classList.add('playing');
                          });
                    } else {
                        syrinscape.player.controlSystem.stopMood(this.id);
                        document.querySelectorAll(`.syrinscape-play-${this.id}`).forEach((element) => {
                            element.classList.remove('playing');
                          });
                          document.querySelectorAll(`.syrinscape-stop-${this.id}`).forEach((element) => {
                            element.classList.remove('playing');
                          });
                    }
                } else {
                    if (cmd === 'play') {
                        syrinscape.player.controlSystem.startElements([this.id]);
                    } else {
                        syrinscape.player.controlSystem.stopElements([this.id]);
                    }
                }
            }

        } catch (error) {
            new Notice(`Failed to ${cmd} ${this.title} in Syrinscape: ${error}`);
        }
    }

}

/**
 * Register for Syrinscape events to enable/disable the play/stop buttons.
 */
export function registerForSyrinscapeEvents() {
    // register for syrinscape.startSample event
    debug('Registering for syrinscape start/stop event.');
    syrinscape.player.syncSystem.events.onChangeMood.addListener(listeners['syrinscape.startMood']);
    syrinscape.player.syncSystem.events.onChangeSoundset.addListenerOneshot(listeners['syrinscape.oneShotChanged']);

    unsubscribeCallbacks.push(syrinscape.events.startElement.addListener(listeners['syrinscape.startElement']));
    unsubscribeCallbacks.push(syrinscape.events.stopElement.addListener(listeners['syrinscape.stopElement']));
    // intentionally not subscribing to startSample. one-shots will emit a startElement event, but not a stopElement event.
    // syrinscape.events.startSample.addListener(startSample.bind(this));
    // subscribing to stopSample in order to stop one-shots
    unsubscribeCallbacks.push(syrinscape.events.stopSample.addListener(listeners['syrinscape.stopSample']));
    debug('successfully registered for all events.');
}

/**
 * remove listeners for Syrinscape events for the play/stop buttons.
 */
export function unregisterForSyrinscapeEvents() {
    while (unsubscribeCallbacks.length > 0) {
        const unsubscribe = unsubscribeCallbacks.pop();
        if (typeof unsubscribe === 'function') {
            unsubscribe();
        }
    }
    while (syrinscape.player.syncSystem.events.onChangeMood._listeners.length > 0) {
        syrinscape.player.syncSystem.events.onChangeMood._listeners.pop();
    }
    while (syrinscape.player.syncSystem.events.onChangeSoundset._listeners.length > 0) {
        syrinscape.player.syncSystem.events.onChangeSoundset._listeners.pop();
    }
    debug('removed all SyrinscapeSound event listeners.');
}

/**
 * Adds playing class to the element.
 * @param elementId the element to add the playing class to
 * @param type set to 'mood' to remove the playing class from all other elements
 */
export function setPlaying(elementId: number, type?: string) {
    if (type === 'mood') {
        setAllStopped();
    }
    document.querySelectorAll(`.syrinscape-play-${elementId}`).forEach((element) => {
        element.classList.add('playing');
      });
      document.querySelectorAll(`.syrinscape-stop-${elementId}`).forEach((element) => {
        element.classList.add('playing');
      });
}

/**
 * Remove the playing class from the element.
 * @param elementId the element to remove the playing class from
 * @param type set to 'sample' to remove the playing class from one-shots
 */
export function setStopped(elementId: number, type?: string) {
    document.querySelectorAll(`.syrinscape-play-${elementId}`).forEach((element) => {
        if (type === 'sample' && element.classList.contains('oneshot')) {
            element.classList.remove('playing');
        } else if (type !== 'sample')
            element.classList.remove('playing');
      });
      document.querySelectorAll(`.syrinscape-stop-${elementId}`).forEach((element) => {
        if (type === 'sample' && element.classList.contains('oneshot')) {
            element.classList.remove('playing');
        } else if (type !== 'sample')
            element.classList.remove('playing');
      });
}

/**
 * Remove the playing class from all elements.
 */
export function setAllStopped() {
    document.querySelectorAll(`.playing`).forEach((element) => {
        element.classList.remove('playing');
    });
    document.querySelectorAll(`.playing`).forEach((element) => {
        element.classList.remove('playing');
    });
}

/**
 * Set the playing class on the element representing the started mood.
 * @param event the event representing a started mood
 */
export function startMood(event: { title: string, pk: number }) {
    debug('startMood:', event);
    setPlaying(event.pk, "mood");
}

/**
 * Not used.
 * @param event the event representing a changed oneshot
 */
export function oneshotChanged(event: CustomEvent<unknown>) {
    debug("Syrinscape - oneshotChanged: ", event);
}
/**
 * Respond to the syrinscape.startElement event by adding the playing class to the element.
 */
export function startElement(event: CustomEvent<{ elementId: number, playlistEntryId: number, timeToStop: number, timeToStopOrNextSample: number }>) {
    debug('startElement:', event.detail.elementId);
    setPlaying(event.detail.elementId);
}
/**
 * Respond to the syrinscape.startSample event by adding the playing class to the element.
 */
export function startSample(event: CustomEvent<{ elementId: number, playlistEntryId: number, timeToStop: number, timeToStopOrNextSample: number }>) {
    debug('startSample:', event.detail.elementId);
    setPlaying(event.detail.elementId);
}

/**
 * Respond to the syrinscape.startSample event by removing the playing class from the element.
 */
export function stopSample(event: CustomEvent<{ elementId: number, playlistEntryId: number, timeToStop: number, sampleId: number }>) {
    debug('stopSample:', event.detail.elementId);
    setStopped(event.detail.elementId, 'sample');
}
/**
 * Respond to the syrinscape.stopElement event by removing the playing class from the element.
 */
export function stopElement(event: CustomEvent<{ elementId: number, playlistEntryId: number, timeToStop: number, sampleId: number }>) {
    debug('stopElement:', event.detail.elementId);
    setStopped(event.detail.elementId);
}

