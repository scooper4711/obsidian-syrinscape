import { SyrinscapeSettingsTab } from 'SyrinscapeSettingsTab';
import SyrinscapeSuggest from 'SyrinscapeSuggest';
import { MarkdownPostProcessorContext, Plugin, WorkspaceLeaf} from 'obsidian';
import { SyrinscapePlayerView, VIEW_TYPE } from "./SyrinscapePlayerView";
import { SyrinscapeRenderChild } from 'SyrinscapeRenderChild';
import { inlinePlugin } from 'SyrinscapePlayerWidget';
import { registerForSyrinscapeEvents, SyrinscapeSound } from 'SyrinscapeSound';

export interface SyrinscapeSettings {
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

  editorSuggest: SyrinscapeSuggest | null;

  /**
   * Load the plugin and register the settings, markdown post processor, and view.
   */
  async onload() {
    await this.loadSettings();
    await this.loadSyrinscapeScripts();

    this.addSettingTab(new SyrinscapeSettingsTab(this.app, this));

    this.registerMarkdownPostProcessor(this.markdownPostProcessor.bind(this));
    await this.checkForExpiredData()

    this.registerView(
      VIEW_TYPE,
      (leaf) => new SyrinscapePlayerView(leaf, this)
    );
    
    this.addRibbonIcon("speaker", "Open Syrinscape Player", () => {
      this.activateView();
    });

    this.registerEditorExtension([inlinePlugin(this)]);

    this.app.workspace.onLayoutReady(() => {
      this.editorSuggest = new SyrinscapeSuggest(this.app, this);
      this.registerEditorSuggest(this.editorSuggest);
      this.editorSuggest.fetchRemoteLinks();      
      console.log("Syrinscape loaded");
    });
  }

  /**
   * Create or activate the Syrinscape Player view.
   */
  async activateView() {
    const { workspace } = this.app;

    let leaf: WorkspaceLeaf | null = null;
    const leaves = workspace.getLeavesOfType(VIEW_TYPE);

    if (leaves.length > 0) {
      // A leaf with our view already exists, use that
      leaf = leaves[0];
    } else {
      // Our view could not be found in the workspace, create a new leaf
      // in the right sidebar for it
      leaf = workspace.getRightLeaf(false);
      if (leaf) {
        await leaf.setViewState({ type: VIEW_TYPE, active: true });

        // "Reveal" the leaf in case it is in a collapsed sidebar
        workspace.revealLeaf(leaf);
    }
  }
}

  /**
   * Clear the cache of the Syrinscape data.
   */
  clearCache() {
    this.settings.csvContent = '';
    this.settings.lastUpdated = null;
    this.saveSettings();
  }

  /**
   * if the lastUpdated is more than settings.maxCacheAge days ago, fetch the remote links
   */
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
        console.debug(`Syrinscape - Last updated ${diffDays} day(s) ago. Cache is still valid`);
      }
    }
  }


  /**
   * Finds all code blocks that match `syrinscape:type:id:title` and creates a SyrinscapeRenderChild to render the buttons.
   * @param element the element to process
   * @param context the editor context
   * @returns 
   */
  async markdownPostProcessor(element: HTMLElement, context: MarkdownPostProcessorContext): Promise<any> {
    let codes = element.querySelectorAll('code');
    // console.debug('Syrinscape - markdownPostProcessor - codes:', codes.length, 'element:', element, 'context:', context);
    // No code found
    if (!codes.length) {
      return
    }
    codes.forEach(codeBlock => {
      if (!codeBlock.textContent) {
        return;
      }
      let sound = this.parseSoundString(codeBlock.textContent);
      if (!sound) {
        return;
      }
      context.addChild(new SyrinscapeRenderChild(this.settings, codeBlock, sound));
    })

  }

  /**
   * Try to parse a sound string in the format `syrinscape:type:id:title` and return a SyrinscapeSound object if successful.
   * @param soundString the string to parse
   * @returns a SyrinscapeSound object if the string is in the correct format, otherwise null
   */
  public parseSoundString(soundString: string): SyrinscapeSound | null {
    const triggerRegEx = new RegExp(`^${this.settings.triggerWord}:(mood|element|sfx|music|oneshot):([0-9]+)(:(.+))?$`, 'ig')
    const matchArray = triggerRegEx.exec(soundString);
    if (!matchArray) {
      return null;
    }
    const type = matchArray[1];
    const id = matchArray[2];
    const title = matchArray[4];
    return new SyrinscapeSound(id, type, title);
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    this.settings.lastUpdated = this.settings.lastUpdated ? new Date(this.settings.lastUpdated) : null;
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
  /**
   * Load the Syrinscape scripts that construct the player.
   */
  private async loadSyrinscapeScripts() {
    this.loadExternalScript("https://syrinscape.com/integration.js")
      .then(() => console.debug("Script loaded successfully."))
      .catch(error => console.error("Error loading script:", error));

    this.loadExternalScript("https://syrinscape.com/player.js")
      .then(() => console.debug("Script loaded successfully."))
      .catch(error => console.error("Error loading script:", error));

    this.loadExternalScript("https://syrinscape.com/visualisation.js")
      .then(() => {
        console.debug("Script loaded successfully."); 
        console.log('Syrinscape - Activating Syrinscape player.');
        syrinscape.events.playerActive.listeners = [];
        syrinscape.events.playerActive.addListener(() => {
          registerForSyrinscapeEvents();
        });
        syrinscape.config.init();
      })
      .catch(error => console.error("Error loading script:", error));
  }


  /**
   * Load an external script.
   * @param scriptUrl the URL of the script to load
   * @returns a promise that resolves when the script is loaded
   */
  private loadExternalScript(scriptUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Create script element
      const script = document.createElement('script');
      script.src = scriptUrl;

      // Resolve promise once script loads
      script.onload = () => resolve();

      // Reject promise if there's an error loading the script
      script.onerror = () => reject(new Error(`Failed to load script: ${scriptUrl}`));

      // Append script to document head
      document.head.appendChild(script);
    });
  }

}

