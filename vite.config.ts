
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // FIX: Per @google/genai guidelines, the API key must be accessed directly from process.env.API_KEY.
  // This configuration makes the environment variable available in the client-side code.
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  },
  build: {
    chunkSizeWarningLimit: 1000, // Aumenta o limite de aviso para 1000 kB
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Separa as bibliotecas pesadas (vendors) em chunks dedicados
          // para melhorar o carregamento inicial e resolver avisos de tamanho.
          if (id.includes('node_modules')) {
            if (id.includes('recharts')) {
              return 'vendor-recharts';
            }
            if (id.includes('@azure/msal-browser')) {
              return 'vendor-msal';
            }
            if (id.includes('lucide-react')) {
                return 'vendor-lucide';
            }
            // Agrupa o restante das dependências em um chunk 'vendor' genérico.
            return 'vendor'; 
          }
        },
      },
    },
  },
});