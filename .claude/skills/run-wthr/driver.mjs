// Drives the running wthr dev server in headless Chromium.
//
//   node .claude/skills/run-wthr/driver.mjs                # all themes
//   node .claude/skills/run-wthr/driver.mjs --theme brass  # one theme
//   node .claude/skills/run-wthr/driver.mjs --measure      # header geometry
//   node .claude/skills/run-wthr/driver.mjs --width 768 --height 1024
//
// Requires `npm run dev` to already be serving on :5173.
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const THEMES = ['Nightfall', 'Brass', 'Sunny']
const URL = 'http://localhost:5173'
const OUT = 'shots'

const argv = process.argv.slice(2)
const flag = (name, fallback) => {
  const i = argv.indexOf(`--${name}`)
  return i === -1 ? fallback : argv[i + 1]
}
const has = (name) => argv.includes(`--${name}`)

const width = Number(flag('width', 390))
const height = Number(flag('height', 844))
const only = flag('theme', null)
const themes = only
  ? THEMES.filter((t) => t.toLowerCase() === only.toLowerCase())
  : THEMES

if (only && themes.length === 0) {
  console.error(`Unknown theme "${only}". Expected one of: ${THEMES.join(', ')}`)
  process.exit(1)
}

// Fail loudly rather than letting Playwright time out on a dead server.
try {
  const probe = await fetch(URL)
  if (!probe.ok) throw new Error(`HTTP ${probe.status}`)
} catch (err) {
  console.error(`Dev server not reachable at ${URL} (${err.message}).`)
  console.error('Start it first:  npm run dev')
  process.exit(1)
}

mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({ args: ['--no-sandbox'] })
const ctx = await browser.newContext({
  viewport: { width, height },
  deviceScaleFactor: 2,
})
const page = await ctx.newPage()

const errors = []
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))

await page.goto(URL, { waitUntil: 'networkidle' })
await page.waitForSelector('text=Parkview Observatory')
// Google Fonts are remote. Without this the first paint uses fallback faces
// and every text measurement / screenshot is of the wrong layout.
await page.evaluate(() => document.fonts.ready)
await page.waitForTimeout(400)

for (const theme of themes) {
  // Theme choice is not persisted — every load starts on Nightfall.
  await page.click(`button:has-text("${theme}")`)
  await page.waitForTimeout(350)

  const slug = theme.toLowerCase()
  await page.screenshot({ path: `${OUT}/${slug}.png`, fullPage: false })
  await page.screenshot({
    path: `${OUT}/${slug}-header.png`,
    clip: { x: 0, y: 0, width, height: Math.min(300, height) },
  })

  const date = await page
    .locator('text=/^\\w+day, \\w+ \\d+(st|nd|rd|th) \\d{4}$/')
    .first()
    .textContent()
    .catch(() => null)
  // Each theme marks up the temperature differently (Brass/Sunny wrap the
  // fraction in a span), so find it by font-size rather than by text shape.
  const temp = await page.evaluate(() => {
    // Nightfall puts the number in a <span>, Brass/Sunny in a <div>, so match
    // on any element; then climb to the div that holds number + fraction.
    const big = [...document.querySelectorAll('*')].find(
      (e) => parseFloat(getComputedStyle(e).fontSize) > 90,
    )
    return big ? (big.closest('div') ?? big).textContent.trim() : null
  })
  console.log(`${theme.padEnd(10)} temp=${temp ?? '?'}  date=${date ?? 'MISSING'}`)

  if (has('measure')) {
    const geo = await page.evaluate(() => {
      const leaf = (t) =>
        [...document.querySelectorAll('div')].find(
          (e) => e.children.length === 0 && e.textContent.trim().startsWith(t),
        )
      const box = (el) => {
        if (!el) return null
        const r = el.getBoundingClientRect()
        return [Math.round(r.top), Math.round(r.bottom)]
      }
      // A div's box lies when line-height < font-size: the glyphs overflow it.
      // Range over the text node reports where the ink really is.
      const inkBox = (el) => {
        if (!el) return null
        const tn = [...el.childNodes].find((n) => n.nodeType === 3)
        if (!tn) return null
        const rg = document.createRange()
        rg.selectNode(tn)
        const r = rg.getBoundingClientRect()
        return [Math.round(r.top), Math.round(r.bottom)]
      }
      const big = [...document.querySelectorAll('div')].find(
        (e) => parseFloat(getComputedStyle(e).fontSize) > 100,
      )
      return {
        date: box(leaf('Sunday') || leaf('Monday') || leaf('Tuesday') ||
                  leaf('Wednesday') || leaf('Thursday') || leaf('Friday') ||
                  leaf('Saturday')),
        tempDivBox: box(big),
        tempInkBox: inkBox(big),
      }
    })
    console.log('  geometry:', JSON.stringify(geo))
  }
}

// /api/current 502s whenever the signing proxy isn't running. That is the
// designed sample-data fallback, not a failure — separate it from real errors.
const apiNoise = errors.filter((e) => /502|Failed to load resource/.test(e))
const real = errors.filter((e) => !/502|Failed to load resource/.test(e))
console.log(`\napi-fallback noise: ${apiNoise.length} (expected without server/index.js)`)
console.log('real console errors:', real.length ? real : 'none')
console.log(`screenshots -> ${OUT}/`)

await browser.close()
process.exit(real.length ? 1 : 0)
