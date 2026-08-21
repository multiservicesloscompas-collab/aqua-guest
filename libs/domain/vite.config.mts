/// <reference types='vitest' />
import { defineConfig } from 'vite';
import { fileURLToPath } from 'url';

export default defineConfig({
  root: import.meta.dirname,
  resolve: {
    alias: {
      '@aqua-guest/domain': fileURLToPath(
        new URL('./src/index.ts', import.meta.url)
      ),
    },
  },
  test: {
    name: '@aqua-guest/domain',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/__tests__/**/*.spec.ts'],
    reporters: ['default'],
  },
});
