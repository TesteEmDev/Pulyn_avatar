import { defineConfig } from 'tsup';

// Gera ESM (site, Vite) e CJS (backend em Node com require) a partir do mesmo código, com os tipos.
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  target: 'es2020',
  sourcemap: false,
});
