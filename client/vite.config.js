import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // js-aruco2 is a legacy UMD script that exposes itself as window.AR.
  // Vite's bundler rewrites `this` in production so the global never lands
  // on window.  Excluding it from bundling and loading it as a plain <script>
  // in index.html is the correct approach.
  optimizeDeps: {
    exclude: ['js-aruco2'],
  },
  build: {
    rollupOptions: {
      external: ['js-aruco2'],
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
