import { defineConfig } from 'vite'
import { copyFileSync, mkdirSync } from 'node:fs'
import { join, resolve } from 'node:path'

export default defineConfig({
    server: {
        port: 5174
    },
    build: {
        outDir: 'dist',
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                terms: resolve(__dirname, 'terms.html'),
                privacy: resolve(__dirname, 'privacy.html'),
                tunerIndex: resolve(__dirname, 'tuner/index.html'),
                tunerPrivacy: resolve(__dirname, 'tuner/privacy.html'),
                tunerTerms: resolve(__dirname, 'tuner/terms.html'),
                tunerSupport: resolve(__dirname, 'tuner/support.html'),
            },
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
