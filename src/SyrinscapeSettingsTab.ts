import { App, PluginSettingTab, Setting } from 'obsidian';
import SyrinscapePlugin from 'main';

export class SyrinscapeSettingsTab extends PluginSettingTab {
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
