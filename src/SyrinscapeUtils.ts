import { Notice } from "obsidian";
import { SYRINSCAPE_BG_IMAGE } from "./assets";

/**
 * @returns true if the syrinscape object is defined in the window, false otherwise
 */
export function isSyrinscapeDefined() {
    return 'syrinscape' in window;
}

/**
 * @returns true if the syrinscape object is defined in the window and has the necessary properties, false otherwise
 */
export function isSyrinscapeLoaded() {
    try {
        return isSyrinscapeDefined() && syrinscape.config && syrinscape.player?.syncSystem?.events;
    } catch (_error) {
        return false;
    }
}

/**
 * @returns true if the syrinscape object is defined in the window and is authenticated, false otherwise
 */
export function isSyrinscapeAuthenticated() {
    try {
        return isSyrinscapeLoaded() && syrinscape.config.authenticated;
    } catch (_error) {
        return false;
    }
}

export function resetArtwork() {
    // get the syrinscape player div and set the background image to the default image
    activeDocument.querySelectorAll('.syrinscape').forEach((element) => {
        const syrinscapeDiv = element as HTMLDivElement;
        syrinscapeDiv.style.backgroundImage = `url("${SYRINSCAPE_BG_IMAGE}")`;
    });
    // reset the title to "Syrinscape Player"
    activeDocument.querySelectorAll('.title h2').forEach((element) => {
        const title = element as HTMLHeadingElement;
        title.textContent = 'Syrinscape Player';
    });
}

export function loginToSyrinscape(authToken: string) {
    try {
        if (!syrinscape.config.audioContext)
            syrinscape.config.audioContext = new AudioContext();
        // Auth token.
        syrinscape.config.token = authToken;
        // Wait until async token change is finished, because `sessionId` might change.
        syrinscape.config.sync();
    } catch (error) {
        console.error('Syrinscape - Error configuring player:', error);
        new Notice('Failed to configure Syrinscape player. Please check the console for more information.');
    }
}
