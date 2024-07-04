## Module Summary

This is the Syrinscape Player plugin for Obsidian!

This module is designed for people using Obsidian as their TTRPG management tool and integrates Syrinscape Web Player with Obsidian. Syrinscape is a powerful tool for creating and playing custom soundtracks, sound effects, and ambient sounds for tabletop role-playing games.

This plugin features a full Syrinscape player, so you don't need to open a separate program or have a separate web page open when using Syrinscape.

You can add moods to your notes for locations, so you don't forget to start the sounds for your busy market or to start the mood for your epic battle.
![Location mood](doc/mood.png)

You can add Sound Effect (sfx) or music loops to a currently playing mood to slowly add elements to build the mood.

You can make a Soundboard and bookmark it or drag it to the left-hand ribbon to always have easy access to it.

The embedded player lets you see what is currently playing, adjust the volume, quick access to mute and unmute, and the ability to stop all sounds. And for the times where you need to disc jockey to get things just right, you can click the syrinscape logo and launch the web browser version of the Syrinscape browser.

Please note that this plugin requires that you have a [Syrinscape account](https://syrinscape.com/dashboard/) (but not a subscription). The player is integrted in the plugin, so you no further downloads are required.

## How to Use

1. Install the Syrinscape module for Obsidian using the Community Plugin Manager in Obsidian.

2. Once installed, open the settings and copy your Auth token from https://syrinscape.com/online/cp/. Paste that into the setting for Auth Token.

3. Use the following markdown syntax to embed a Syrinscape mood, music or sound effect loop - both the play and stop button will be displayed:

    ```
    `syrinscape:mood:soundId:optional mouseover text`
    ```

    ```
    `syrinscape:music:soundId:optional mouseover text`
    ```
    ```
    `syrinscape:sfx:soundId:optional mouseover text`
    ```
4. Use the following markdown syntax to embed a Syrinscape oneshot - only the play button will be displayed, since oneshots will automatically stop.

    ```
    `syrinscape:oneshot:soundId:optional mouseover text`
    ```

    :attention: Note that to preserve compatability, you can also use "element" to not display the stop button, but oneshot is the preferred syntax.

4. The plugin has downloaded a list of all the sounds you have access to, and so the auto-complete feature will make entering the codes easy for you.
    ![Autocompletion](doc/autocomplete.png "Autocompletion feature")
    
5. Save your note and switch to View Mode to have a play and stop button which will start/stop the selected sound.

## Screenshots

### Put a link to the mood for every scene at the top of the page for the scene, and never forget to start the Syrinscape mood for that room again!

Note that **Moods** get a play and a stop button.

![Scene mood](doc/location_mood.png "Setting the mood for a scene")

--- 

### The plugin works very well inside of [Fantasy Statblocks](https://github.com/javalent/fantasy-statblocks)

Note that **Oneshots** only get a play button.

![Fantasy Statblocks integration](doc/fantasy_statblock.png "Integration with Fantasy Statblocks")

---

### And it also works when with [Initiative Tracker](https://github.com/javalent/initiative-tracker) so you have easy access for spell or melee oneshots during combat.

Edit the spell descriptions to include a link to the corresponding one-shot and now anytime a creature has access to that spell, you have easy access to the sound effect during battle!

![Initiative Tracker integration](doc/initiative_tracker.png "Integration with Initiative Tracker")

--- 

## Soundboard

With Obsidian and Syrinscape, you now have complete control over your soundboard. Make a note, e.g. `Soundboard.md` that contains any syrinscape sounds you want. Use any formatting and grouping you want. Once you have that in place, you can drag the note up to the Ribbon - the same location as e.g. the default `Files`, `Search`, and `Bookmarks`. Once there, you have one-click access to your soundboard.

![Soundboard](doc/Soundboard.png "Illustration of how to create a one-click soundboard")

## Settings

This plugin will only download your remote links once a week. If you are e.g. creating your own soundsets and want the plugin to get a fresh set of links, you can open the settings and press the button labeled "Clear Remote Links".

![Settings](doc/Settings.png "Settings screenshot")
