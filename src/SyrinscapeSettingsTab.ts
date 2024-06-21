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

    // create an anchor link to the Syrinscape control panel
    const desc:DocumentFragment=new DocumentFragment();
    desc.appendText("Enter your Syrinscape Auth token here. You can find it in your ")
    desc.append(desc.createEl('a', {"href": "https://syrinscape.com/online/cp/", text: "Syrinscape control panel."}))

    new Setting(containerEl)
      .setName('Auth Token')
      .setDesc(desc)
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
