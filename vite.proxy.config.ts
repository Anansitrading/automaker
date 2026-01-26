
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  // Load env file based on mode in the current directory -> process.cwd() = automaker/
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    // Explicitly set envDir to where the .env file is (root)
    envDir: '.', 
    server: {
      host: '0.0.0.0',
      port: 8080,
      proxy: {
        '/api': {
          target: 'http://localhost:3008',
          changeOrigin: true,
          secure: false,
        },
        '/socket.io': {
            target: 'ws://localhost:3008',
            ws: true,
        },
        '/api/events': {
            target: 'ws://localhost:3008',
            ws: true,
        },
        '/api/telemetry/ws': {
            target: 'ws://localhost:3008',
            ws: true,
        },
        '/api/terminal/ws': {
            target: 'ws://localhost:3008',
            ws: true,
        }
      }
    },
    root: 'apps/ui',
    resolve: {
      alias: {
        '@': resolve(__dirname, 'apps/ui/src'),
        'src': resolve(__dirname, 'apps/ui/src')
      }
    },
    // Expose env vars to client
    define: {
      'process.env': env
    }
  };
});

