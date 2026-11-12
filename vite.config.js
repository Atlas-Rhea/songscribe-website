import { defineConfig } from 'vite'
import { copyFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs'
import { join, resolve } from 'node:path'

// Every generated guide page (guide/index.html, guide/<slug>/index.html).
const guideInputs = Object.fromEntries(
    readdirSync(resolve(__dirname, 'guide'), { withFileTypes: true })
        .filter((d) => d.isDirectory() && existsSync(resolve(__dirname, 'guide', d.name, 'index.html')))
        .map((d) => [`guide-${d.name}`, resolve(__dirname, 'guide', d.name, 'index.html')])
)

export default defineConfig({
    server: {
        port: 5174
    },
    build: {
        outDir: 'dist',
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                about: resolve(__dirname, 'about.html'),
                changelog: resolve(__dirname, 'changelog.html'),
                features: resolve(__dirname, 'features/index.html'),
                terms: resolve(__dirname, 'terms.html'),
                privacy: resolve(__dirname, 'privacy.html'),
                tunerIndex: resolve(__dirname, 'tuner/index.html'),
                tunerPrivacy: resolve(__dirname, 'tuner/privacy.html'),
                tunerTerms: resolve(__dirname, 'tuner/terms.html'),
                tunerSupport: resolve(__dirname, 'tuner/support.html'),
                go: resolve(__dirname, 'go/index.html'),
                guide: resolve(__dirname, 'guide/index.html'),
                ...guideInputs,
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
