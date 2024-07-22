import { App, PluginSettingTab, Setting } from 'obsidian';
import SyrinscapePlugin from 'main';
import { DEFAULT_SETTINGS } from 'main';
import { isSyrinscapeDefined, SyrinscapePlayerView, VIEW_TYPE } from 'SyrinscapePlayerView';

export class SyrinscapeSettingsTab extends PluginSettingTab {
  plugin: SyrinscapePlugin;

  constructor(app: App, plugin: SyrinscapePlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;

    containerEl.empty();

    // create an anchor link to the Syrinscape control panel
    const desc:DocumentFragment=new DocumentFragment();
    desc.appendText("Enter your Syrinscape Auth token here. You can find it in your ")
    desc.append(desc.createEl('a', {"href": "https://syrinscape.com/online/cp/", text: "Syrinscape control panel."}));
    desc.append(desc.createEl('br'));
    desc.appendText("This plugin will only control the Syrinscape Web Player or Online Player.");
    desc.append(desc.createEl('br'));
    desc.appendText("This plugin will not control the Syrinscape Fantasy Player or Sci-Fi Player.");

    new Setting(containerEl)
      .setName('Auth token')
      .setDesc(desc)
      .addText(text => text
        .setPlaceholder(DEFAULT_SETTINGS.authToken)
        .setValue(this.plugin.settings.authToken)
        .onChange(async (value) => {
          this.plugin.settings.authToken = value;
          if (isSyrinscapeDefined()) {
            syrinscape.config.token = '';
            syrinscape.config.sync();
            syrinscape.config.token = value;
            for (const leaf of this.plugin.app.workspace.getLeavesOfType(VIEW_TYPE)) {
              const view = leaf.view;
              if (view instanceof SyrinscapePlayerView) {
                view.activateSyrinscape();
              }
            }
          await this.plugin.saveData(this.plugin.settings);
        }}));
    
    // Number setting for the maximum cache age, in days
    new Setting(containerEl)
      .setName('Cache age')
      .setDesc(`Enter the maximum age of the cache in days. Default is ${DEFAULT_SETTINGS.maxCacheAge.toString()} days.`)
      .addText(text => text
        .setPlaceholder(DEFAULT_SETTINGS.maxCacheAge.toString())
        .setValue(this.plugin.settings.maxCacheAge.toString())
        .onChange(async (value) => {
          this.plugin.settings.maxCacheAge = parseInt(value);
          await this.plugin.saveData(this.plugin.settings);
        }));


    // String setting for the trigger word, e.g. `syrinscape` or `sscape`
    new Setting(containerEl)
      .setName('Trigger word')
      .setDesc('Enter the word that the Syrinscape player plugin will look for. Default is "syrinscape"')
      .addText(text => text
        .setPlaceholder(DEFAULT_SETTINGS.triggerWord)
        .setValue(this.plugin.settings.triggerWord)
        .onChange(async (value) => {
          this.plugin.settings.triggerWord = value;
          await this.plugin.saveData(this.plugin.settings);
        }));

    // Create a button which will call the method to clear the CSV content
    const buttonDesc: DocumentFragment = new DocumentFragment();
    buttonDesc.appendText("This plugin will cache remote control links for at most ");
    buttonDesc.createEl("i").appendText("Cache age");
    buttonDesc.appendText(" days.");
    buttonDesc.append(desc.createEl('br'));
    buttonDesc.appendText("You can manually clear the Remote Links that were downloaded from Syrinscape on ");
    const dateText = buttonDesc.createEl('b');
    dateText.appendText(this.plugin.settings.lastUpdated?this.plugin.settings.lastUpdated.toDateString():'never');
    buttonDesc.append(dateText);
    new Setting(containerEl)
      .setName('Clear remote links')
      .setDesc(buttonDesc)
      .addButton(button => button
        .setButtonText('Clear remote links')
        .onClick(async () => {
          this.plugin.clearCache();
          this.plugin.editorSuggest?.fetchRemoteLinks();
      }));
    }      
}
