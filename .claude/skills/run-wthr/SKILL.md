---
name: run-wthr
description: Build, run, screenshot, and visually verify the wthr weather app. Use when asked to run, start, launch, or screenshot wthr, check a theme's layout or spacing, or confirm a UI change renders in the real app.
---

# Running wthr

Vite + React single-page weather display with three full-screen themes
(Nightfall, Brass, Sunny). Driven headlessly by
`.claude/skills/run-wthr/driver.mjs`, which clicks through all three
themes and screenshots each.

All paths are relative to the repo root. Verified on Windows 11 /
PowerShell + Git Bash; no xvfb needed (Chromium runs headless).

## Setup

```bash
npm install
npx playwright install chromium   # browser binary, cached per-user
```

## Run (agent path)

The dev server must be serving before the driver starts. Start it in the
background, then poll — do not `sleep`:

```bash
npm run dev &
timeout 60 bash -c 'until curl -sf http://localhost:5173 >/dev/null 2>&1; do sleep 1; done'
```

Then drive it:

```bash
node .claude/skills/run-wthr/driver.mjs                  # all 3 themes
node .claude/skills/run-wthr/driver.mjs --theme brass    # one theme
node .claude/skills/run-wthr/driver.mjs --theme sunny --measure
node .claude/skills/run-wthr/driver.mjs --width 768 --height 1024
```

Output (`shots/` is gitignored):

```
Nightfall  temp=63.7°  date=Tuesday, June 23rd 2026
Brass      temp=63.7°  date=Tuesday, June 23rd 2026
Sunny      temp=63.7°  date=Tuesday, June 23rd 2026

api-fallback noise: 2 (expected without server/index.js)
real console errors: none
screenshots -> shots/
```

Per theme it writes `shots/<theme>.png` (full viewport) and
`shots/<theme>-header.png` (top 300px, for header/spacing work).
**Open the PNGs** — the summary line proves text exists, not that the
layout is right. Exit code is 1 only on real console errors.

Stop the server (Windows has no `lsof`):

```bash
netstat -ano | grep ':5173.*LISTENING' | awk '{print $5}' | sort -u \
  | while read pid; do taskkill //PID $pid //F; done
```

## Run (human path)

`npm run dev` → open http://localhost:5173. For live station data you
also need `node --env-file=.env server/index.js` on :8787 (Vite proxies
`/api` to it); without it the page shows sample data.

## Checks

```bash
npm run lint    # ESLint flat config, covers src/ + server/ + netlify/
npm run build   # vite build
```

No test runner is configured.

## Gotchas

- **`/api/current` 502s are expected.** Without `.env` + the signing
  proxy the fetch fails and `App.jsx` silently falls back to
  `sampleResponse.js`. The driver counts these separately as
  "api-fallback noise" — only `real console errors` matters.
- **Sample data is frozen at Tue Jun 23 2026 23:35**, so screenshots are
  deterministic: temp always 63.7°, greeting always "Good evening!", date
  always "Tuesday, June 23rd 2026". A changed value means you changed
  rendering logic, not that data moved.
- **Theme choice is not persisted.** Every load starts on Nightfall; the
  driver clicks the switcher to reach the others.
- **Google Fonts load from the network.** Screenshot or measure before
  `document.fonts.ready` and you capture fallback-font layout with wrong
  metrics. The driver awaits it.
- **Element boxes lie in Sunny/Brass.** The temperature uses
  `line-height: .82`, so glyphs overflow their own box *upward* —
  `getBoundingClientRect()` reports top 168 while ink starts ~142.
  `--measure` prints both (`tempDivBox` vs `tempInkBox`, via a Range over
  the text node). Use the ink box when checking clearance; the Sunny
  drifting cloud at `top: 150` threads a corridor only ~37px tall.
- **Themes mark up the temperature differently** — Nightfall uses a
  `<span>`, Brass/Sunny a `<div>`. Query by computed font-size across all
  elements, not by tag or text shape.
- **Don't set `VITE_BASE` from Git Bash.** MSYS path conversion rewrites
  `VITE_BASE=/wthr/ npm run build` into `/Program Files/Git/wthr/`, and the
  build silently succeeds with wrong asset paths. Use PowerShell
  (`$env:VITE_BASE='/wthr/'`) or prefix `MSYS_NO_PATHCONV=1`.
- **`--width` above 440 does not give a desktop layout.** `.app-shell` is
  `max-width: 440px; margin: 0 auto`, so a 768px viewport just centers the
  same mobile column on empty background. Use it to check that framing,
  not to test reflow — there is none.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `Dev server not reachable at http://localhost:5173` | Start `npm run dev` and wait for the poll above. |
| Driver hangs on `waitForSelector` | Server is serving but the app threw — check `shots/` and the background task's output file. |
| Screenshots show blocky fallback fonts | Network blocked Google Fonts; layout metrics will be off. |
| `EADDRINUSE` on `npm run dev` | Previous server still listening — run the `taskkill` above. |
