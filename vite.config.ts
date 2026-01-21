
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Garante que process.env.API_KEY esteja disponível no lado do cliente
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ''),
    'process.env': {}
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Removido 'minify: terser' para evitar erro de módulo ausente
    minify: 'esbuild', 
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'recharts', 'lucide-react'],
        },
      },
    },
  },
});
