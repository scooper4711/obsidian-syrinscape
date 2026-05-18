/**
 * Polyfill for Obsidian's String.prototype.contains method
 * which is used in the source code but isn't standard JS.
 */
if (!String.prototype.contains) {
  // eslint-disable-next-line no-extend-native
  String.prototype.contains = function (searchString: string): boolean {
    return this.includes(searchString);
  };
}

declare global {
  interface String {
    contains(searchString: string): boolean;
  }
}
