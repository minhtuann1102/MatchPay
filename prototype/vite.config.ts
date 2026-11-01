import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' lets the built dist/ run from any static host (HashRouter needs no rewrite rule).
export default defineConfig({
  base: './',
  plugins: [react()],
});
