import sharp from 'sharp'
import { readFile, writeFile, stat, unlink } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const decorDir = resolve(__dirname, '../public/assets/images/decor')

const quills = ['quill-01.svg', 'quill-02.svg']
const targetWidth = 420 // ~2x max CSS render width of 210

for (const name of quills) {
  const inPath = resolve(decorDir, name)
  const outPath = resolve(decorDir, name.replace(/\.svg$/, '.webp'))
  const svg = await readFile(inPath)

  const { size: inSize } = await stat(inPath)

  await sharp(svg, { density: 300 })
    .resize({ width: targetWidth, withoutEnlargement: false })
    .webp({ quality: 82, alphaQuality: 90, effort: 6 })
    .toFile(outPath)

  const { size: outSize } = await stat(outPath)
  console.log(`${name}: ${(inSize / 1024).toFixed(0)}KB SVG -> ${name.replace(/\.svg$/, '.webp')}: ${(outSize / 1024).toFixed(1)}KB WebP`)

  await unlink(inPath)
  console.log(`  removed original ${name}`)
}
