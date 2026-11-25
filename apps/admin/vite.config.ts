import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In dev, proxy the API through Vite so the dashboard is same-origin with it
// (no CORS, and uploaded images load with the dashboard's auth).
const API = process.env.VITE_API_PROXY || 'http://localhost:5000';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': API, '/uploads': API },
  },
});
