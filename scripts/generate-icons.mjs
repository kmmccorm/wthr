// Regenerates the home-screen icons in public/icons/.
// Run: node scripts/generate-icons.mjs
//
// The artwork mirrors the Nightfall theme, which is what every launch shows
// (theme choice is not persisted), so the icon matches the first paint.
// Rendered with Playwright, which is already a devDependency for the run skill.
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const OUT = 'public/icons'
// 180 = apple-touch-icon; 192/512 = manifest icons; 512 maskable = Android.
const SIZES = [180, 192, 512]

// `pad` insets the artwork so a maskable icon survives being cropped to a
// circle — Android may clip anything outside the middle ~80%.
const svg = (pad = 1) => {
  const moonR = 150 * pad
  const cx = 256
  const cy = 256
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <radialGradient id="bg" cx="50%" cy="-10%" r="120%">
      <stop offset="0%" stop-color="#243352"/>
      <stop offset="42%" stop-color="#161f38"/>
      <stop offset="100%" stop-color="#0b1020"/>
    </radialGradient>
    <radialGradient id="glow">
      <stop offset="0%" stop-color="#cee0ff" stop-opacity=".45"/>
      <stop offset="100%" stop-color="#cee0ff" stop-opacity="0"/>
    </radialGradient>
    <mask id="crescent">
      <circle cx="${cx}" cy="${cy}" r="${moonR}" fill="white"/>
      <circle cx="${cx + 74 * pad}" cy="${cy - 60 * pad}" r="${140 * pad}" fill="black"/>
    </mask>
  </defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  <circle cx="${cx}" cy="${cy}" r="${moonR * 1.6}" fill="url(#glow)"/>
  <circle cx="${cx}" cy="${cy}" r="${moonR}" fill="#e9eefc" mask="url(#crescent)"/>
  <circle cx="${cx - 150 * pad}" cy="${cy - 150 * pad}" r="7" fill="#ffffff"/>
  <circle cx="${cx + 150 * pad}" cy="${cy + 140 * pad}" r="6" fill="#cfe0ff"/>
  <circle cx="${cx - 175 * pad}" cy="${cy + 95 * pad}" r="5" fill="#bcd0ff"/>
  <circle cx="${cx + 120 * pad}" cy="${cy - 175 * pad}" r="4" fill="#ffffff"/>
</svg>`
}

mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({ args: ['--no-sandbox'] })
const page = await browser.newPage()

const write = async (size, path, pad) => {
  await page.setViewportSize({ width: size, height: size })
  await page.setContent(
    `<body style="margin:0;width:${size}px;height:${size}px">${svg(pad)}</body>`,
  )
  await page.screenshot({ path, omitBackground: false })
  console.log(`wrote ${path} (${size}x${size})`)
}

for (const size of SIZES) await write(size, `${OUT}/icon-${size}.png`, 1)
// Maskable: same art, pulled into the safe zone so a circular crop keeps it.
await write(512, `${OUT}/icon-512-maskable.png`, 0.72)

await browser.close()
