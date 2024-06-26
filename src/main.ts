import { SyrinscapeSettingsTab } from 'SyrinscapeSettingsTab';
import SyrinscapeSuggest from 'SyrinscapeSuggest';
import { MarkdownPostProcessorContext, MarkdownRenderChild, Notice, Plugin, requestUrl, MetadataCache} from 'obsidian';

export const SYRINSCAPE_CLASS = 'syrinscape';

interface SyrinscapeSettings {
  authToken: string;
  triggerWord: string;
  csvContent: string;
  lastUpdated: Date|null;
  maxCacheAge: number;
};

export const DEFAULT_SETTINGS: SyrinscapeSettings = {
  authToken: '',
  triggerWord: 'syrinscape',
  csvContent: '',
  lastUpdated: null,
  maxCacheAge: 7
};

export default class SyrinscapePlugin extends Plugin {
  settings: SyrinscapeSettings;

  private editorSuggest: SyrinscapeSuggest | null;

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new SyrinscapeSettingsTab(this.app, this));

    this.registerMarkdownPostProcessor(this.markdownPostProcessor.bind(this));
    await this.checkForExpiredData()
    this.app.workspace.onLayoutReady(() => {
      this.editorSuggest = new SyrinscapeSuggest(this.app, this);
      this.registerEditorSuggest(this.editorSuggest);
      this.fetchRemoteLinks();
      console.log("Syrinscape loaded");
    });
  }

  // download the remote links from syrinscape
  async fetchRemoteLinks() {
    await this.editorSuggest?.fetchRemoteLinks();
  }

  // clear the cache
  clearCache() {
    this.settings.csvContent = '';
    this.settings.lastUpdated = null;
    this.saveSettings();
  }

  // if the lastUpdated is more than 1 day ago, fetch the remote links
  async checkForExpiredData() {
    console.debug('Syrinscape - lastUpdated:', this.settings.lastUpdated);
    if (this.settings.lastUpdated) {
      const now = new Date();
      const diff = now.getTime() - this.settings.lastUpdated.getTime();
      const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));
      if (diffDays > this.settings.maxCacheAge) {
        console.log(`Syrinscape - Last updated ${diffDays} day(s) ago, more than ${this.settings.maxCacheAge}. Clearing cache`);
        this.clearCache();
      } else {
        console.log(`Syrinscape - Last updated ${diffDays} day(s) ago. Cache is still valid`);
      }
    }
  }


  async markdownPostProcessor(element: HTMLElement, context: MarkdownPostProcessorContext): Promise<any> {
    let codes = element.querySelectorAll('code');

    // No code found
    if (!codes.length) {
      return
    }
    console.debug('codes:', codes);
    const triggerRegEx = new RegExp(`${this.settings.triggerWord}:(mood|element|sfx|music|oneshot):([0-9]+)(:(.+))?`, 'ig')
    codes.forEach(codeBlock => {
      console.debug('codeBlock:', codeBlock.innerText);
      let matchArray: RegExpExecArray | null;
      while (matchArray = triggerRegEx.exec(codeBlock.innerText)) {
        context.addChild(new SyrinscapeRenderChild(this.settings, codeBlock, matchArray[1], matchArray[2], matchArray[4]))
      }
    })

  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    this.settings.lastUpdated = this.settings.lastUpdated ? new Date(this.settings.lastUpdated) : null;
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

}
class SyrinscapeRenderChild extends MarkdownRenderChild {

  constructor(
    private settings: SyrinscapeSettings,
    private element: HTMLElement,
    private type: string,
    private soundid: string,
    private soundTitle: string) {
    super(element);
  }

  onload(): void {
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
  async callSyrinscapeApi(cmd: string) {

    const apiUrl = `https://syrinscape.com/online/frontend-api/${this.type=='mood'?'mood':'element'}s/${this.soundid}/${cmd}/`;

    try {
      const response = await requestUrl({
        url: apiUrl,
        method: 'GET',
        contentType: 'application',
        headers: {
          'Content-Type': 'application',
          'Authorization': `Token ${this.settings.authToken}`
        }
      });
      const data = response.json;
      console.debug('Syrinscape - API response:', data);
      // if the return code isn't 200, display a notice with the detail
      if (data.detail) {
        new Notice(data.detail)
      }
    } catch (error) {
      console.error('Syrinscape - Error fetching data:', error);
      new Notice('Failed to fetch data from Syrinscape API');
    }
  }

}


