## Module Summary

This module is designed for people using Obsidian as their TTRPG management tool to integrate Syrinscape with Obsidian. Syrinscape is a powerful tool for creating and playing custom soundtracks, sound effects, and ambient sounds for tabletop role-playing games.

Embed controls to start and stop moods and elements on your pages that describe locations, spells or events.

## How to Use

1. Install the Syrinscape module for Obsidian using the [BRAT (Beta-Review Auto-update Tool) plugin for Obsidian](https://github.com/TfTHacker/obsidian42-brat).

2. Once installed, open the settings and copy your Auth token from https://syrinscape.com/online/cp/. Paste that into the setting for Auth Token.

3. Use the following markdown syntax to embed a Syrinscape soundscape:

    ```
    `syrinscape:mood:soundId:optional mouseover text`
    ```

    ```
    `syrinscape:element:soundId:optional mouseover text`
    ```

4. While you can edit this yourself, the code completion feature is how you will generally interact with Syrinscape when editing.
    ![Code completion](doc/code_completion.png "Code completion feature")
    
5. Save your note and switch to View Mode to have a play and stop button which will start/stop the selected sound.

## Screenshots

### Put a link to the mood for every scene at the top of the page for the scene, and never forget to start the Syrinscape mood for that room again!

![Scene mood](doc/scene_mood.png "Setting the mood for a scene")

### The plugin works very well inside of [Fantasy Statblocks](https://github.com/javalent/fantasy-statblocks)

![Fantasy Statblocks integration](doc/fantasy_statblock.png "Integration with Fantasy Statblocks")

### And it also works when with [Initiative Tracker](https://github.com/javalent/initiative-tracker) so you have easy access for spell or melee oneshots during combat.

![Initiative Tracker integration](doc/initiative_tracker.png "Integration with Initiative Tracker")