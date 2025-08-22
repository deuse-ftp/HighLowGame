import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: '.',  // Raiz do projeto
  build: {
    outDir: 'dist',  // Pasta de saída do build
  },
});