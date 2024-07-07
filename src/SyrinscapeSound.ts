export const SYRINSCAPE_CLASS = 'syrinscape-markdown';
import { Notice } from "obsidian";

export class SyrinscapeSound {
    constructor(
        readonly id: string,
        readonly type: string,
        readonly title: string,
    ) {
    }

    public renderSpan(element: HTMLElement) {
        const syrinscapeDiv = element.createEl("span", { cls: SYRINSCAPE_CLASS });
        // make an anchor with the class play, the text ▶️ and hovertext of "Play ${soundTitle}" if it's set, or just "Play"
        const play = syrinscapeDiv.createEl("a", { cls: "play", text: "▶️", title: this.title ? `Play "${this.title}"` : "Play" });
        play.addEventListener("click", (e) => {
            e.preventDefault();
            this.callSyrinscapeApi("play");
        });
        // If the type is either oneshot or element, don't display the stop button
        if (this.type !== 'oneshot' && this.type !== 'element') {
            const stop = syrinscapeDiv.createEl("a", { cls: "stop", text: "⏹️", title: this.title ? `Stop "${this.title}"` : "Stop" });
            stop.addEventListener("click", (e) => {
                e.preventDefault();
                this.callSyrinscapeApi("stop");
            });
        }
        return syrinscapeDiv;
    }

    /**
    * Uses the local Syrinscape player to control the sound.
    * @param cmd - The command to send to the local player - either play or stop.
    */
    private callSyrinscapeApi(cmd: string) {
        console.debug(`Syrinscape - ${cmd} ${this.title}-${this.id}-${this.type}`);
        try {
            if (syrinscape?.player && syrinscape?.player?.controlSystem) {
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
