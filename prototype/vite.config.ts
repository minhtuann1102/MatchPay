import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' lets the built dist/ run from any static host (HashRouter needs no rewrite rule).
// Vendor code is split so the app chunk stays small: React, Ant Design (with its icons), and the data layer.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1300, // the Ant Design vendor chunk is about 1.2 MB minified (about 370 kB gzip) and is cached across routes
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\//.test(id)) return 'react';
          if (/node_modules\/@tanstack\//.test(id)) return 'query';
          if (/node_modules\/(antd|@ant-design|rc-|@rc-component|dayjs|@babel\/runtime)/.test(id)) return 'antd';
          return undefined;
        },
      },
    },
  },
});
