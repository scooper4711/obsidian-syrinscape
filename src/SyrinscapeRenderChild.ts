import { MarkdownRenderChild, Notice, requestUrl } from 'obsidian';
import { SyrinscapeSettings, SYRINSCAPE_CLASS } from 'main';

/**
 * Converts the markdown of `syrinscape:type:id:title` to a rendered play or play&stop button..
 */
export class SyrinscapeRenderChild extends MarkdownRenderChild {

  /**
   * Creates an instance of SyrinscapeRenderChild.
   * @param settings - The Syrinscape settings.
   * @param element - The HTML element to render the Syrinscape sound.
   * @param type - The type of the Syrinscape sound.
   * @param soundid - The ID of the Syrinscape sound.
   * @param soundTitle - The title of the Syrinscape sound.
   */
  constructor(
    private settings: SyrinscapeSettings,
    private element: HTMLElement,
    private type: string,
    private soundid: string,
    private soundTitle: string) {
    super(element);
  }

  /**
   * Renders the Syrinscape sound as a play or play&stop button.
   */
  onload(): void {
    // console.debug('Syrinscape - RenderChild - element:', this.element, 'type:', this.type, 'soundid:', this.soundid, 'soundTitle:', this.soundTitle);
    const syrinscapeDiv = this.element.createEl("span", { cls: SYRINSCAPE_CLASS });
    // make an anchor with the class play, the text ▶️ and hovertext of "Play ${soundTitle}" if it's set, or just "Play"
    const play = syrinscapeDiv.createEl("a", { cls: "play", text: "▶️", title: this.soundTitle ? `Play "${this.soundTitle}"` : "Play" });
    play.addEventListener("click", (e) => {
      e.preventDefault();
      this.callSyrinscapeApi("play");
    });
    // If the type is either oneshot or element, don't display the stop button
    if (this.type !== 'oneshot' && this.type !== 'element') {
      const stop = syrinscapeDiv.createEl("a", { cls: "stop", text: "⏹️", title: this.soundTitle ? `Stop "${this.soundTitle}"` : "Stop" });
      stop.addEventListener("click", (e) => {
        e.preventDefault();
        this.callSyrinscapeApi("stop");
      });
    }
    this.element.replaceWith(syrinscapeDiv);
  }

  /**
   * Uses the local Syrinscape player to control the sound.
   * @param cmd - The command to send to the local player - either play or stop.
   */
  async callSyrinscapeApi(cmd: string) {
    if (syrinscape?.player && syrinscape?.player?.controlSystem) {
      if (this.type === 'mood') {
        if (cmd === 'play') {
          syrinscape.player.controlSystem.startMood(this.soundid);
        } else {
          syrinscape.player.controlSystem.stopMood(this.soundid);
        }
      } else {
        if (cmd === 'play') {
          syrinscape.player.controlSystem.startElements([this.soundid]);
        } else {
          syrinscape.player.controlSystem.stopElements([this.soundid]);
        }
      }
    }
  }

}
