import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // 构建优化
  build: {
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'zustand'],
          'ai-vendor': ['openai', '@anthropic-ai/sdk', '@google/generative-ai'],
          'ui-vendor': ['lucide-react', 'react-markdown', 'rehype-highlight']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    // 确保 lucide-react 不被过度 tree-shake
    commonjsOptions: {
      include: [/lucide-react/, /node_modules/]
    }
  },

  // 环境变量前缀
  envPrefix: 'VITE_',

  // 优化依赖预构建
  optimizeDeps: {
    include: ['react', 'react-dom', 'zustand', 'lucide-react']
  }
})
