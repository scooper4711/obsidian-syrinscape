import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      'obsidian': path.resolve(__dirname, 'tests/__mocks__/obsidian.ts'),
      'main': path.resolve(__dirname, 'src/main.ts'),
      'SyrinscapeDebug': path.resolve(__dirname, 'src/SyrinscapeDebug.ts'),
      'SyrinscapeSound': path.resolve(__dirname, 'src/SyrinscapeSound.ts'),
      'SyrinscapeSuggest': path.resolve(__dirname, 'src/SyrinscapeSuggest.ts'),
      'SyrinscapePlayerView': path.resolve(__dirname, 'src/SyrinscapePlayerView.ts'),
      'SyrinscapeRenderChild': path.resolve(__dirname, 'src/SyrinscapeRenderChild.ts'),
      'SyrinscapePlayerWidget': path.resolve(__dirname, 'src/SyrinscapePlayerWidget.ts'),
      'SyrinscapeSettingsTab': path.resolve(__dirname, 'src/SyrinscapeSettingsTab.ts'),
    }
  },
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      reportsDirectory: 'coverage',
      include: ['src/**/*.ts'],
      exclude: ['src/syrinscape.d.ts']
    }
  }
});
