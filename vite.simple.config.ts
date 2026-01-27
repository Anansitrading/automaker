import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [
      TanStackRouterVite({
        target: 'react',
        autoCodeSplitting: true,
        routesDirectory: './src/routes',
        generatedRouteTree: './src/routeTree.gen.ts',
      }),
      tailwindcss(),
      react(),
    ],
    root: 'apps/ui',
    server: {
      host: '0.0.0.0',
      port: 8080,
      proxy: {
        '/api': {
          target: 'http://localhost:3008',
          changeOrigin: true,
        },
        '/socket.io': {
          target: 'ws://localhost:3008',
          ws: true,
        },
        '/api/events': {
          target: 'ws://localhost:3008',
          ws: true,
        },
      },
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'apps/ui/src'),
      },
    },
    define: {
      'process.env.VITE_SKIP_ELECTRON': 'true',
      __APP_VERSION__: '0.12.0',
    },
  };
});
// force-fix
