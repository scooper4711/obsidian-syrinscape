import { SyrinscapeSettingsTab } from 'SyrinscapeSettingsTab';
import SyrinscapeSuggest from 'SyrinscapeSuggest';
import { MarkdownPostProcessorContext, MarkdownRenderChild, Notice, Plugin, requestUrl, MetadataCache} from 'obsidian';

export const SYRINSCAPE_CLASS = 'syrinscape';

interface SyrinscapeSettings {
  authToken: string;
  triggerWord: string;
  csvContent: string;
  lastUpdated: Date|null;
};

const DEFAULT_SETTINGS: SyrinscapeSettings = {
  authToken: 'insert-your-auth-token-here',
  triggerWord: 'syrinscape',
  csvContent: '',
  lastUpdated: null,
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
    console.debug('Syrinscape - now:', new Date());
    if (this.settings.lastUpdated) {
      const now = new Date();
      const diff = now.getTime() - this.settings.lastUpdated.getTime();
      if (diff > 86400000) {
        console.log("Syrinscape - Last updated more than 1 day ago. Clearing cache");
        this.clearCache();
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
    const triggerRegEx = new RegExp(`${this.settings.triggerWord}:(mood|element):([0-9]+)(:(.+))?`, 'ig')
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
    if (this.type === 'mood') {
      const stop = syrinscapeDiv.createEl("a", { cls: "stop", text: "⏹️", title: this.soundTitle ? `Stop "${this.soundTitle}"` : "Stop" });
      stop.addEventListener("click", (e) => {
        e.preventDefault();
        this.callSyrinscapeApi("stop");
      });
    }
    this.element.replaceWith(syrinscapeDiv);
  }
  async callSyrinscapeApi(cmd: string) {

    const apiUrl = `https://syrinscape.com/online/frontend-api/${this.type}s/${this.soundid}/${cmd}/`;

    try {
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application',
          'Authorization': `Token ${this.settings.authToken}`
        }
      });
      const data = await response.json();
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


