# Contributing to Obsidian Syrinscape Plugin

Thank you for your interest in contributing to the Obsidian Syrinscape Plugin! This document will guide you through the setup and development process.

## Development Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (latest LTS version recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [Git](https://git-scm.com/)
- [Obsidian](https://obsidian.md/) installed on your system

### Initial Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/scooper4711/obsidian-syrinscape.git
   cd obsidian-syrinscape
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Development Workflow

### Building the Plugin
1. For a one-time build:
   ```bash
   npm run build
   ```

2. For development with automatic rebuilding:
   ```bash
   npm run dev
   ```

### Testing with Obsidian

1. Create a symbolic link to your Obsidian test vault:
   ```bash
   # Replace with your vault path
   mkdir -p "/path/to/vault/.obsidian/plugins"
   ln -s "$(pwd)" "/path/to/vault/.obsidian/plugins/syrinscape-player-control"
   ```

2. Enable the plugin in Obsidian:
   - Open Settings → Community Plugins
   - Disable Safe Mode if necessary
   - Enable "Syrinscape Online Player" in the list of installed plugins

3. Test your changes:
   - Make changes to the code
   - Run the build command
   - Reload Obsidian (Command + R on Mac, Ctrl + R on Windows/Linux)
   - Or disable and re-enable the plugin

## Project Structure

- `src/` - TypeScript source files
- `styles.css` - Plugin styles
- `manifest.json` - Plugin manifest
- `versions.json` - Version history
- `main.js` - Compiled plugin output

## Creating a Release

1. Update version numbers:
   ```bash
   npm version patch # or minor or major
   # This will automatically:
   # - Update package.json
   # - Update manifest.json
   # - Update versions.json
   # - Create a git tag
   ```

2. Build the release:
   ```bash
   npm run build
   ```

3. Commit and push changes:
   ```bash
   git push origin main --tags
   ```

4. Create a GitHub release:
   - Go to the repository's Releases page
   - Click "Create a new release"
   - Choose the tag you just created
   - Add release notes
   - Attach the following files:
     - `main.js`
     - `manifest.json`
     - `styles.css`

## Code Style and Standards

- Use TypeScript for all source files
- Follow the existing code formatting style
- Add comments for non-obvious code
- Update documentation when making significant changes

## Testing

The plugin can be tested in a development vault:
1. Create a test vault in Obsidian
2. Create the symbolic link as described above
3. Test different features:
   - Player controls
   - Volume settings
   - Sound triggers
   - Theme compatibility
   - Style Settings integration (if installed)

## Debugging

1. Open Obsidian Developer Tools:
   - Windows/Linux: Ctrl + Shift + I
   - macOS: Cmd + Opt + I

2. Check the console for errors and debug messages
   - Debug messages are enabled in settings
   - Use `debug()` function for development logging

## Common Issues

1. **Plugin not appearing in Obsidian:**
   - Check the symbolic link is correct
   - Verify the plugin is enabled in Obsidian settings
   - Check console for errors

2. **Changes not showing up:**
   - Ensure the build completed successfully
   - Reload Obsidian or disable/enable the plugin
   - Check the console for build errors

3. **Style issues:**
   - Check if Style Settings plugin is installed (optional)
   - Verify CSS variables are properly set
   - Test in both light and dark themes

## Getting Help

- Open an issue on GitHub for bugs or feature requests
- Check existing issues before creating a new one
- Include relevant details:
  - Obsidian version
  - Plugin version
  - Steps to reproduce
  - Expected vs actual behavior
  - Console errors if any

## License

This project is licensed under the MIT License - see the LICENSE file for details.
