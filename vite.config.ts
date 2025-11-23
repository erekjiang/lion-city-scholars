import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    // Replace process.env.API_KEY with the value from .env file during build
    define: {
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY)
    },
    // Base path for GitHub Pages
    // If your repo is https://github.com/user/repo, this should be '/repo/'
    // By default we use './' which works for most relative paths
    base: './', 
    build: {
      outDir: 'dist',
    }
  };
});