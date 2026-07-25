import { defineConfig } from 'vite'
import path from 'path'
import react from '@vitejs/plugin-react'
import { mcpPlugin } from '@lovable.dev/mcp-js/stacks/supabase/vite'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Try to import plugins only in development mode
  let componentTaggerPlugin = null;
  
  // Only try to load the tagger in development mode
  if (mode === 'development') {
    try {
      const { componentTagger } = require("lovable-tagger");
      componentTaggerPlugin = componentTagger();
    } catch (e) {
      console.warn("Could not load lovable-tagger, continuing without it");
    }
  }

  return {
    plugins: [
      react(),
      mcpPlugin(),
      mode === 'development' && componentTaggerPlugin,
    ].filter(Boolean),
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host: "::",
      port: 8080
    },
    // Add build optimization settings
    build: {
      // Improve chunking strategy
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            ui: [
              '@radix-ui/react-accordion',
              '@radix-ui/react-dialog',
              '@radix-ui/react-dropdown-menu',
              // Other UI libraries
            ],
          }
        }
      },
      // Reduce build timeouts
      chunkSizeWarningLimit: 1000,
    }
  }
})
