import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // server: { // Optional: specify port if needed, default is 5173
  //   port: 3000, // Example: run on http://localhost:3000
  // }
});
