import { defineConfig } from 'vite'
import { copyFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

export default defineConfig({
    server: {
        port: 5174
    },
    build: {
        outDir: 'dist',
        rollupOptions: {
            output: {
                // Ensure consistent asset paths
                assetFileNames: 'assets/[name].[ext]'
            }
        }
    },
    publicDir: 'public',
    plugins: [
        {
            name: 'copy-cloudflare-files',
            closeBundle() {
                // Copy _redirects to dist
                try {
                    copyFileSync('_redirects', join('dist', '_redirects'))
                } catch (err) {
                    console.warn('Could not copy _redirects:', err.message)
                }
                
                // Copy functions/_headers to dist/functions/_headers
                try {
                    mkdirSync(join('dist', 'functions'), { recursive: true })
                    copyFileSync('functions/_headers', join('dist', 'functions', '_headers'))
                } catch (err) {
                    console.warn('Could not copy functions/_headers:', err.message)
                }
            }
        }
    ]
})
