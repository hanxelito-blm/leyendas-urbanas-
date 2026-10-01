import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { createApiPlugin } from './server/api.js'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '')

  return {
    plugins: [react(), createApiPlugin(env)],
    root: __dirname,
    publicDir: path.resolve(__dirname, 'public'),
    server: {
      port: 3000,
      open: true,
    },
    build: {
      outDir: path.resolve(__dirname, 'dist'),
      emptyOutDir: true,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    }
  }
})