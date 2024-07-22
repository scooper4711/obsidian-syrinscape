/**
 * Manage global debug logging.
 */

let syrinscapeDebug = false;

/**
 * Enable or disable debug logging.
 * @param enable true to enable, false to disable
 */
export function setDebug(enable: boolean): void {
  syrinscapeDebug = enable;
}

export function debug(...args: unknown[]): void {
    if (syrinscapeDebug) {
        console.debug('Syrinscape - ', ...args);
    }
}
