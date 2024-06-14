// Assuming your test file is named `main.test.js`

const { SyrinscapePlugin, SyrinscapeSettingsTab } = require('./main');

// Mocking Obsidian's PluginSettingTab and Setting classes
jest.mock('obsidian', () => {
  return {
    PluginSettingTab: jest.fn().mockImplementation(function () {
      this.containerEl = { empty: jest.fn() };
      this.display = jest.fn();
    }),
    Setting: jest.fn().mockImplementation(function (containerEl) {
      this.setName = jest.fn().mockReturnValue(this);
      this.setDesc = jest.fn().mockReturnValue(this);
      this.addText = jest.fn().mockImplementation((callback) => {
        const textComponent = {
          setPlaceholder: jest.fn().mockReturnValue(textComponent),
          setValue: jest.fn().mockReturnValue(textComponent),
          onChange: jest.fn().mockImplementation((onChangeCallback) => {
            onChangeCallback('new-api-key'); // Simulate user input
          })
        };
        callback(textComponent);
        return this;
      });
      return this;
    })
  };
});

describe('SyrinscapeSettingsTab', () => {
  let pluginMock;
  let settingsTab;

  beforeEach(() => {
    // Setup plugin mock
    pluginMock = {
      settings: { apiKey: 'initial-api-key' },
      saveData: jest.fn()
    };

    // Initialize SyrinscapeSettingsTab with the mock
    settingsTab = new SyrinscapeSettingsTab(null, pluginMock);
  });

  test('initializes with provided plugin instance', () => {
    expect(settingsTab.plugin).toBe(pluginMock);
  });

  test('updates API key setting and saves data', () => {
    settingsTab.display();
    expect(pluginMock.saveData).toHaveBeenCalledWith({ apiKey: 'new-api-key' });
  });
});