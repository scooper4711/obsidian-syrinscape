import { App, Editor, MarkdownPostProcessorContext, MarkdownRenderChild, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

export const SYRINSCAPE_CLASS = 'syrinscape';

interface SyrinscapeSettings {
  authToken: string;
  triggerWord: string;
};

const DEFAULT_SETTINGS: SyrinscapeSettings = {
  authToken: 'insert-your-auth-token-here',
  triggerWord: 'syrinscape'
}

export default class SyrinscapePlugin extends Plugin {
  settings: SyrinscapeSettings;

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new SyrinscapeSettingsTab(this.app, this));

    this.registerMarkdownPostProcessor(this.markdownPostProcessor.bind(this));

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
      console.debug('type:', type);
      console.debug('soundid:', soundid);
      console.debug('soundTitle:', soundTitle);
  }

  onload(): void {
    const syrinscapeDiv = this.element.createEl("span", { cls: SYRINSCAPE_CLASS });
    // make an anchor with the class play, the text ▶️ and hovertext of "Play ${soundTitle}" if it's set, or just "Play"

    const play = syrinscapeDiv.createEl("a", { cls: "play", text: "▶️", title: this.soundTitle? `Play "${this.soundTitle}"`:"Play" });
    play.addEventListener("click", (e) => {
      e.preventDefault();
      this.callSyrinscapeApi("play");
    });
    const stop = syrinscapeDiv.createEl("a", { cls: "stop", text: "⏹️", title: this.soundTitle? `Stop "${this.soundTitle}"`:"Stop" });
    stop.addEventListener("click", (e) => {
      e.preventDefault();
      this.callSyrinscapeApi("stop");
    });
    this.element.replaceWith(syrinscapeDiv);
  }
  async callSyrinscapeApi(cmd: string) {

    const apiUrl = `https://syrinscape.com/online/frontend-api/${this.type}s/${this.soundid}/${cmd}/?auth_token=${this.settings.authToken}`;

    try {
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      console.debug('API response:', data);
      // Handle the API response here
    } catch (error) {
      console.error('Error fetching data:', error);
      new Notice('Failed to fetch data from Syrinscape API');
    }
  }

}

class SyrinscapeSettingsTab extends PluginSettingTab {
  plugin: SyrinscapePlugin;

  constructor(app: App, plugin: SyrinscapePlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;

    containerEl.empty();

    containerEl.createEl('h2', { text: 'Syrinscape Plugin Settings' });

    new Setting(containerEl)
      .setName('Auth Token')
      .setDesc('Enter your Syrinscape Auth token. You can find it in your Syrinscape control panel.')
      .addText(text => text
        .setPlaceholder('Paste your Syrinscape Auth token here')
        .setValue(this.plugin.settings.authToken)
        .onChange(async (value) => {
          this.plugin.settings.authToken = value;
          await this.plugin.saveData(this.plugin.settings);
        }));

    new Setting(containerEl)
      .setName('Trigger Word')
      .setDesc('Enter the word that the Syrinscape player plugin will look for. Default is "syrinscape"')
      .addText(text => text
        .setPlaceholder('syrinscape')
        .setValue(this.plugin.settings.triggerWord)
        .onChange(async (value) => {
          this.plugin.settings.triggerWord = value;
          await this.plugin.saveData(this.plugin.settings);
        }));
  }
}
