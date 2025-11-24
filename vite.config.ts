import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [react()],
    // Replace process.env.API_KEY with the value from environment variables during build
    // Priority: system env var (CI) > .env file (VITE_API_KEY) > empty string
    define: {
      'process.env.API_KEY': JSON.stringify(process.env.API_KEY || env.API_KEY || env.VITE_API_KEY || "") 
    },
    // Base path for GitHub Pages
    // This assumes the repo name is the root of the path if not specified otherwise.
    // Ideally, for https://user.github.io/repo/, this should be '/repo/'
    base: './', 
    build: {
      outDir: 'dist',
    }
  };
});