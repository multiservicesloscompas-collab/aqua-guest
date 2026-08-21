/// <reference types='vitest' />
import { defineConfig } from 'vite';
import { fileURLToPath } from 'url';

export default defineConfig({
  root: import.meta.dirname,
  resolve: {
    alias: {
      '@aqua-guest/domain': fileURLToPath(
        new URL('../domain/src/index.ts', import.meta.url)
      ),
      '@aqua-guest/domain/': fileURLToPath(
        new URL('../domain/src/', import.meta.url)
      ),
    },
  },
  test: {
    name: '@aqua-guest/product-domain/frontend',
    watch: false,
    globals: true,
    environment: 'node',
    include: [
      'shared/**/*.test.ts',
      'core/**/*.test.ts',
      'modules/**/*.test.ts',
    ],
    reporters: ['default'],
  },
});
