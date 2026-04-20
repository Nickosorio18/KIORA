/**
 * Genera public/assets/images/og-cover.png a partir de public/og-cover.html
 * Requiere: npm install -D puppeteer
 * Uso:      npm run export:og
 */

import puppeteer from 'puppeteer'
import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const SOURCE = path.join(ROOT, 'public', 'og-cover.html')
const OUT_DIR = path.join(ROOT, 'public', 'assets', 'images')
const OUT_FILE = path.join(OUT_DIR, 'og-cover.png')

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true })

const browser = await puppeteer.launch({ headless: 'new' })
const page = await browser.newPage()

await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 2 })
await page.goto(`file://${SOURCE}`, { waitUntil: 'networkidle0' })
await page.evaluateHandle('document.fonts.ready')

await page.screenshot({
  path: OUT_FILE,
  type: 'png',
  clip: { x: 0, y: 0, width: 1200, height: 630 },
})

await browser.close()
console.log(`✓ OG cover exportado → ${OUT_FILE}`)
