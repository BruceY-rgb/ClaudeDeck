import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { copyFileSync, mkdirSync, readdirSync } from 'fs'
import type { Plugin } from 'vite'

// Plugin to copy mock-data JSON files to the output directory
function copyMockDataPlugin(): Plugin {
  return {
    name: 'copy-mock-data',
    writeBundle(options) {
      const outDir = options.dir || resolve('out/main')
      const mockSrc = resolve('src/main/mock-data')
      const mockDest = resolve(outDir, 'mock-data')
      try {
        mkdirSync(mockDest, { recursive: true })
        const files = readdirSync(mockSrc).filter(f => f.endsWith('.json'))
        for (const file of files) {
          copyFileSync(resolve(mockSrc, file), resolve(mockDest, file))
        }
        console.log(`[mock-data] Copied ${files.length} JSON files to ${mockDest}`)
      } catch (e) {
        console.warn('[mock-data] Failed to copy mock data:', e)
      }
    }
  }
}

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin({ exclude: ['execa'] }), copyMockDataPlugin()],
    build: {
      rollupOptions: {
        input: {
          index: resolve('src/main/index.ts')
        }
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer'),
        '@shared': resolve('src/shared')
      }
    },
    plugins: [react(), tailwindcss()]
  }
})
