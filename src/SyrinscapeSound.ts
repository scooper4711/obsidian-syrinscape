export const SYRINSCAPE_CLASS = 'syrinscape-markdown';
import { Notice } from "obsidian";
import { debug } from "./SyrinscapeDebug";
import { isSyrinscapeAuthenticated, resetArtwork } from "SyrinscapePlayerView";

const unsubscribeCallbacks: (() => void)[] = [];

export class SyrinscapeSound {
    constructor(
        readonly id: string,
        // type has to be one of 'mood', 'sfx', 'music' or 'oneshot' (or 'element' for backwards compatibility)
        readonly type: string,
        readonly title: string,
    ) {
        if ([ 'mood', 'sfx', 'music', 'oneshot', 'element' ].indexOf(type) === -1) {
            new Notice(`Please use one of 'mood', 'sfx', 'music' or 'oneshot' for sound type.`);
            throw new Error(`Invalid type ${type} for SyrinscapeSound.`);
        }
        if (type === 'element') {
            this.type = 'oneshot'
        }
    }

    /**
     * Render the span for the sound element and the controls.
     * @param element - The element to render the span in.
     * @returns The span element.
     */
    public renderSpan(element: HTMLElement) {
        const syrinscapeDiv = element.createEl("span", { cls: SYRINSCAPE_CLASS });
        if (this.type === 'oneshot') {
            this.renderOneshotPlay(syrinscapeDiv);
        } else {
            this.renderSlider(syrinscapeDiv);
        }
        return syrinscapeDiv;
    }

    /**
     * Render the controls for a mood or sfx sound.
     * @param syrinscapeDiv - The div to render the checkbox in.
     */
    private renderSlider(syrinscapeDiv: HTMLSpanElement) {
        const label = syrinscapeDiv.createEl("label", { cls: 'switch' });
        const input = label.createEl("input", { type: 'checkbox', cls: `${this.type} syrinscape-${this.id}` });
        const span = label.createEl("span", { cls: `slider round ${this.type}` });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        input.addEventListener('change', (e) => {
            if (input.checked) {
                if (this.type === 'mood') {
                    document.querySelectorAll('.mood').forEach((element) => {
                        const inputElement = element as HTMLInputElement;
                        if (inputElement.classList.contains('syrinscape-' + this.id)) {
                            inputElement.checked = true;
                        } else {
                            inputElement.checked = false;
                        }
                    });
                } else {
                    document.querySelectorAll(`.${this.type}.syrinscape-${this.id}`).forEach((element) => {
                        const inputElement = element as HTMLInputElement;
                        inputElement.checked = true;
                    });
                }
                this.callSyrinscapeApi("play");
            } else {
                this.callSyrinscapeApi("stop");
                if (this.type === 'mood') {
                    document.querySelectorAll(`.${this.type}.syrinscape-${this.id}`).forEach((element) => {
                        const inputElement = element as HTMLInputElement;
                        inputElement.checked = false;
                        resetArtwork();
                    });
                } else {
                    document.querySelectorAll(`.${this.type}.syrinscape-${this.id}`).forEach((element) => {
                        const inputElement = element as HTMLInputElement;
                        inputElement.checked = false;
                    });
                }
            }
        });
        input.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        span.addEventListener('click', (e) => {
            e.preventDefault();
            input.click();
        });
        if (!isSyrinscapeAuthenticated()) {
            debug('Not authenticated, disabling mood/sfx switch.');
            input.addClass('inactive');
            span.addClass('inactive');
        }

    }

    /**
     * Render the play button for a oneshot sound.
     * @param syrinscapeDiv - The div to render the play button in.
     */
    private renderOneshotPlay(syrinscapeDiv: HTMLSpanElement) {
        // make an anchor with the class play, the text ▶️ and hovertext of "Play ${soundTitle}" if it's set, or just "Play"
        const play = syrinscapeDiv.createEl("a", { cls: `${this.type} syrinscape-${this.id}`, text: '▶️', title: this.title ? `Play "${this.title}"` : "Play" });
        if (!isSyrinscapeAuthenticated()) {
            debug('Not authenticated, disabling play button.');
            play.addClass('inactive');
        }
        play.addEventListener("click", (e) => {
            e.preventDefault();
            this.callSyrinscapeApi("play");
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
                    } else {
                        syrinscape.player.controlSystem.stopMood(this.id);
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
    unsubscribeCallbacks.push(syrinscape.events.stopElement.addListener(stopElement));
    unsubscribeCallbacks.push(syrinscape.events.startElement.addListener(startElement));
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
 * Visually update all elements to show they're stopped.
 */
export function setAllStopped() {
    debug('setAllStopped');
    document.querySelectorAll('.playing').forEach((element) => {
        element.classList.remove('playing');
    });
    resetArtwork();
    document.querySelectorAll(`.${SYRINSCAPE_CLASS} input`).forEach((element) => {
        const inputElement = element as HTMLInputElement;
        inputElement.checked = false;
    });
}


/**
 * Visually update all elements representing a given sound element to indicate they're stopped.
 * @param event the event from Syrinscape indicating a sound element has stopped playing.
 */
export function stopElement(event: CustomEvent<{ elementId: number, playlistEntryId: number, timeToStop: number, sampleId: number }>) {
    debug('stopElement:', event.detail.elementId);
    const elementsToStop = document.querySelectorAll(`.syrinscape-${event.detail.elementId}`);
    debug('stopElement:', elementsToStop);
    elementsToStop.forEach((element) => {
        element.classList.remove('playing');
        if (element instanceof HTMLInputElement) {
            element.checked = false;
        }
    });
}

/**
 * Visually update all elements representing a given sound element to indicate they're playing.
 * @param event the event from Syrinscape indicating a sound element has started playing.
 */
export function startElement(event: CustomEvent<{ elementId: number; timeToFirstSample: string; }>) {
    debug('startElement:', event.detail.elementId);
    document.querySelectorAll(`.oneshot.syrinscape-${event.detail.elementId}`).forEach((element) => {
        const inputElement = element as HTMLInputElement;
        inputElement.classList.add('playing');
        // remove the playing class after 3 seconds
        setTimeout(() => {
            inputElement.classList.remove('playing');
        }, 3000);
    });
}
