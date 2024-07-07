import { SyrinscapeSettings } from 'main';
import { MarkdownRenderChild } from 'obsidian';
import { SyrinscapeSound } from 'SyrinscapeSound';

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
    private sound: SyrinscapeSound) {
    super(element);
  }

  /**
   * Renders the Syrinscape sound as a play or play&stop button.
   */
  onload(): void {
    // console.debug('Syrinscape - RenderChild - element:', this.element, 'type:', this.type, 'soundid:', this.soundid, 'soundTitle:', this.soundTitle);
    const syrinscapeSpan = this.sound.renderSpan(this.element);
    this.element.replaceWith(syrinscapeSpan);
  }

}


