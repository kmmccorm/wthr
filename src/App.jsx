import { useEffect, useMemo, useState } from 'react'
import { SAMPLE_RESPONSE } from './sampleResponse.js'
import { extractMetrics } from './weather.js'
import './App.css'

const REFRESH_MS = 60_000
const THEMES = ['nightfall', 'brass', 'sunny']

// Drives <meta name="theme-color">, which tints the status bar once the app is
// installed to the home screen. Each value is the top-of-page color of that
// theme's background so the status bar blends into the page rather than
// banding against it.
const THEME_COLORS = {
  nightfall: '#161f38',
  brass: '#f7f1e4',
  sunny: '#bfe3ff',
}

function num(n, d = 0) {
  return n == null || Number.isNaN(n) ? '--' : n.toFixed(d)
}

// 1 -> "1st", 2 -> "2nd", 11 -> "11th", 22 -> "22nd".
function ordinal(n) {
  const suffixes = ['th', 'st', 'nd', 'rd']
  const mod = n % 100
  return n + (suffixes[(mod - 20) % 10] || suffixes[mod] || suffixes[0])
}

// Derives every display value the three screens need from the metrics.
// Mirrors the Parkview Weather design's DCLogic.renderVals().
function computeValues(metrics, source) {
  const m = metrics || {}

  const t1 = num(m.temperature, 1)
  let tempBig = '--'
  let tempFrac = ''
  if (t1 !== '--') {
    const [whole, frac] = t1.split('.')
    tempBig = whole
    tempFrac = '.' + frac + '°'
  }

  const temp = m.temperature
  let condWord = 'Mild'
  if (temp != null && !Number.isNaN(temp)) {
    if (temp < 33) condWord = 'Freezing'
    else if (temp < 50) condWord = 'Chilly'
    else if (temp < 66) condWord = 'Mild'
    else if (temp < 80) condWord = 'Warm'
    else condWord = 'Hot'
  }

  const wind = m.wind || {}
  const ws = wind.speed
  const windSpeed = num(ws, 1)
  const compass = wind.compass || '--'
  const calm = ws != null && ws < 3

  const hi = m.heatIndex
  const feels = hi == null || Number.isNaN(hi) ? '--' : hi.toFixed(1) + '°'

  const bar = m.barometer || {}
  const presLabel = bar.label || '--'
  const presVal = num(bar.value, 2)
  const tr = bar.trend
  const presTrend =
    tr == null || Number.isNaN(tr)
      ? '--'
      : (tr >= 0 ? '+' : '') + tr.toFixed(2) + ' / 3h'

  const at = m.observedAt || new Date()
  const obs = m.observedAt
    ? m.observedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : '--'
  const h = at.getHours()
  const greeting =
    h < 12 ? 'Good morning!' : h < 18 ? 'Good afternoon!' : 'Good evening!'

  // "Friday, August 14th 2026" — from the observation time, like the greeting.
  const dateLine =
    at.toLocaleDateString([], { weekday: 'long' }) +
    ', ' +
    at.toLocaleDateString([], { month: 'long' }) +
    ' ' +
    ordinal(at.getDate()) +
    ' ' +
    at.getFullYear()

  const dir = wind.direction
  const needleDeg = dir == null || Number.isNaN(dir) ? 0 : dir

  return {
    obs,
    obsUpper: obs === '--' ? '--' : obs.toUpperCase(),
    srcLabel: source === 'live' ? 'live' : 'sample data',
    tempBig,
    tempFrac,
    condWord,
    condDark: condWord + (calm ? ' & calm' : ' & breezy'),
    condPlayful: condWord + (calm ? ' & breezy-free' : ' & breezy'),
    feels,
    heatIdxLine: 'heat index ' + feels,
    windSpeed,
    windCompass: compass,
    windLineDark: windSpeed + ' mph from ' + compass,
    windLinePlayful: 'A gentle ' + windSpeed + ' mph from the ' + compass,
    needleDeg,
    gust: num(m.gust && m.gust.speed, 1),
    hum: num(m.humidity, 0),
    humPct: num(m.humidity, 0) + '%',
    presLabel,
    presVal,
    presValInHg: presVal + ' inHg',
    presTrend,
    greeting,
    dateLine,
  }
}

/* ============ A · NIGHTFALL ============ */
function Nightfall({ v }) {
  const star = (top, left, size, color, dur, delay) => ({
    position: 'absolute',
    top,
    left,
    width: size,
    height: size,
    borderRadius: '50%',
    background: color,
    animation: `twinkle ${dur} ease-in-out infinite ${delay}`,
  })
  const tile = {
    borderRadius: 20,
    padding: 16,
    background: 'rgba(255,255,255,.05)',
    border: '1px solid rgba(255,255,255,.08)',
  }
  const tileLabel = {
    fontSize: 12,
    letterSpacing: '.1em',
    textTransform: 'uppercase',
    color: '#7e8db0',
  }
  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100dvh',
        background:
          'radial-gradient(120% 80% at 50% -10%, #243352 0%, #161f38 42%, #0b1020 100%)',
        color: '#eef2fb',
        fontFamily: "-apple-system,'SF Pro Display',system-ui",
        overflow: 'hidden',
        paddingBottom: 120,
      }}
    >
      <div style={star(120, 44, 3, '#fff', '3.5s', '0s')} />
      <div style={star(96, 120, 2, '#cfe0ff', '2.8s', '.6s')} />
      <div style={star(160, 300, 3, '#fff', '4.2s', '1.2s')} />
      <div style={star(210, 64, 2, '#bcd0ff', '3.1s', '.3s')} />
      <div style={star(140, 230, 2, '#fff', '3.8s', '.9s')} />
      <div style={star(260, 340, 2, '#cfe0ff', '2.6s', '1.6s')} />
      <div
        style={{
          position: 'absolute',
          top: 104,
          right: 34,
          width: 54,
          height: 54,
          borderRadius: '50%',
          background: '#e9eefc',
          boxShadow: '0 0 28px rgba(206,224,255,.45)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -6,
            right: -8,
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: '#1a2740',
          }}
        />
      </div>

      <div style={{ padding: '78px 30px 0' }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: '.14em',
            textTransform: 'uppercase',
            color: '#7e8db0',
          }}
        >
          Parkview Observatory
        </div>
        <div style={{ fontSize: 16, color: '#aebbd8', marginTop: 8 }}>{v.dateLine}</div>
        <div style={{ fontSize: 13, color: '#5f6f93', marginTop: 4 }}>
          as of {v.obs} · {v.srcLabel}
        </div>
      </div>

      <div style={{ padding: '46px 30px 0', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', lineHeight: 0.86 }}>
          <span style={{ fontSize: 148, fontWeight: 300, letterSpacing: '-.05em' }}>
            {v.tempBig}
          </span>
          <span style={{ fontSize: 60, fontWeight: 300, marginTop: 6 }}>
            {v.tempFrac}
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            gap: 10,
            alignItems: 'center',
            marginTop: 14,
          }}
        >
          <span style={{ fontSize: 19, fontWeight: 600, color: '#dfe7f8' }}>
            {v.condDark}
          </span>
          <span
            style={{ width: 4, height: 4, borderRadius: '50%', background: '#4a5878' }}
          />
          <span style={{ fontSize: 17, color: '#8595b8' }}>Feels like {v.feels}</span>
        </div>
      </div>

      <div
        style={{
          margin: '36px 30px 0',
          position: 'relative',
          height: 46,
          borderRadius: 16,
          overflow: 'hidden',
          background: 'rgba(255,255,255,.04)',
          border: '1px solid rgba(255,255,255,.07)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 14,
            left: 0,
            width: 50,
            height: 2,
            borderRadius: 2,
            background: 'linear-gradient(90deg,transparent,#7fd4ff)',
            animation: 'streak 3.2s linear infinite',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 26,
            left: 0,
            width: 40,
            height: 2,
            borderRadius: 2,
            background: 'linear-gradient(90deg,transparent,#9fb4ff)',
            animation: 'streak 3.2s linear infinite 1.1s',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            justifyContent: 'space-between',
          }}
        >
          <span
            style={{
              fontSize: 13,
              letterSpacing: '.1em',
              textTransform: 'uppercase',
              color: '#8090b4',
            }}
          >
            Wind
          </span>
          <span style={{ fontSize: 14, color: '#cdd9f3' }}>{v.windLineDark}</span>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          padding: '14px 30px 0',
        }}
      >
        <div style={tile}>
          <div style={tileLabel}>Gust</div>
          <div style={{ marginTop: 18, fontSize: 30, fontWeight: 500 }}>
            {v.gust}
            <span style={{ fontSize: 15, color: '#8595b8', fontWeight: 400 }}> mph</span>
          </div>
          <div style={{ fontSize: 12, color: '#6b7aa0', marginTop: 4 }}>
            peak last 2 min
          </div>
        </div>
        <div style={tile}>
          <div style={tileLabel}>Humidity</div>
          <div style={{ marginTop: 18, fontSize: 30, fontWeight: 500 }}>
            {v.hum}
            <span style={{ fontSize: 15, color: '#8595b8', fontWeight: 400 }}> %</span>
          </div>
          <div style={{ fontSize: 12, color: '#6b7aa0', marginTop: 4 }}>
            a touch damp
          </div>
        </div>
        <div
          style={{
            ...tile,
            gridColumn: '1 / -1',
            padding: '16px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={tileLabel}>Pressure</div>
            <div style={{ marginTop: 8, fontSize: 26, fontWeight: 500 }}>
              {v.presLabel}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 22, fontWeight: 400, color: '#cdd9f3' }}>
              {v.presVal}
              <span style={{ fontSize: 13, color: '#8595b8' }}> inHg</span>
            </div>
            <div style={{ fontSize: 12, color: '#6b7aa0', marginTop: 4 }}>
              {v.presTrend}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ============ B · BRASS & GLASS ============ */
function Brass({ v }) {
  const tick = (top) => ({
    position: 'absolute',
    left: 20,
    top,
    font: "400 10px/1 'Oswald'",
    color: '#9a8e72',
  })
  const compassLetter = (extra) => ({
    position: 'absolute',
    font: "600 13px 'Oswald'",
    color: '#9a8e72',
    ...extra,
  })
  const stat = {
    font: "600 30px/1 'Playfair Display',serif",
    color: '#2c2519',
  }
  const statLabel = {
    font: "400 11px/1.4 'Oswald'",
    letterSpacing: '.12em',
    textTransform: 'uppercase',
    color: '#9a7c4a',
    marginTop: 6,
  }
  const needle = `rotate(${v.needleDeg}deg)`
  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100dvh',
        background:
          'radial-gradient(130% 90% at 50% 0%, #f7f1e4 0%, #efe6d3 60%, #e6dcc4 100%)',
        color: '#2c2519',
        overflow: 'hidden',
        paddingBottom: 120,
      }}
    >
      <div style={{ padding: '74px 28px 0', textAlign: 'center' }}>
        <div
          style={{
            font: "500 12px/1 'Oswald',sans-serif",
            letterSpacing: '.34em',
            textTransform: 'uppercase',
            color: '#9a7c4a',
          }}
        >
          Parkview Observatory
        </div>
        <div
          style={{ margin: '12px auto 0', width: 64, height: 1, background: '#c2a878' }}
        />
        <div
          style={{
            font: "italic 500 17px/1 'Playfair Display',serif",
            color: '#6b5f44',
            marginTop: 14,
          }}
        >
          {v.dateLine}
        </div>
        <div
          style={{
            font: "500 13px/1 'Oswald',sans-serif",
            letterSpacing: '.12em',
            color: '#8a8068',
            marginTop: 10,
          }}
        >
          RECORDED {v.obsUpper}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 22,
          padding: '30px 28px 0',
        }}
      >
        <div style={{ position: 'relative', width: 26, height: 200 }}>
          <div
            style={{
              position: 'absolute',
              left: 9,
              top: 0,
              width: 8,
              height: 178,
              borderRadius: 6,
              background: '#e7ddca',
              border: '1px solid #c2a878',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 9,
              bottom: 18,
              width: 8,
              height: 118,
              borderRadius: 6,
              background: 'linear-gradient(#c0392b,#9c2a1f)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 1,
              bottom: 0,
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: '#c0392b',
              border: '1px solid #9c2a1f',
            }}
          />
          <div style={tick(24)}>80°</div>
          <div style={tick(84)}>60°</div>
          <div style={tick(144)}>40°</div>
        </div>
        <div style={{ textAlign: 'left' }}>
          <div style={{ font: "500 96px/.8 'Playfair Display',serif", color: '#2c2519' }}>
            {v.tempBig}
            <span style={{ fontSize: 44 }}>{v.tempFrac}</span>
          </div>
          <div
            style={{
              font: "400 16px/1 'Oswald'",
              letterSpacing: '.06em',
              color: '#7a6f55',
              marginTop: 14,
              textTransform: 'uppercase',
            }}
          >
            Fahrenheit · {v.condWord}
          </div>
          <div
            style={{
              font: "italic 500 16px/1.3 'Playfair Display',serif",
              color: '#9a7c4a',
              marginTop: 8,
            }}
          >
            {v.heatIdxLine}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', padding: '26px 0 0' }}>
        <div
          style={{
            position: 'relative',
            width: 208,
            height: 208,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 38% 32%, #fbf7ee, #ece0c8)',
            border: '6px solid #c2a878',
            boxShadow:
              'inset 0 2px 10px rgba(120,90,40,.18), 0 6px 16px rgba(120,90,40,.15)',
          }}
        >
          <div
            style={compassLetter({
              top: 8,
              left: '50%',
              transform: 'translateX(-50%)',
              color: '#6b5f44',
            })}
          >
            N
          </div>
          <div
            style={compassLetter({
              bottom: 8,
              left: '50%',
              transform: 'translateX(-50%)',
            })}
          >
            S
          </div>
          <div
            style={compassLetter({ left: 10, top: '50%', transform: 'translateY(-50%)' })}
          >
            W
          </div>
          <div
            style={compassLetter({ right: 10, top: '50%', transform: 'translateY(-50%)' })}
          >
            E
          </div>
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: 4,
              height: 84,
              transform: `translate(-50%,-100%) ${needle}`,
              transformOrigin: 'bottom center',
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                background: 'linear-gradient(#b03a2e,#8c2d23)',
                borderRadius: 3,
              }}
            />
          </div>
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: 4,
              height: 36,
              transform: `translate(-50%,0) ${needle}`,
              transformOrigin: 'top center',
              background: '#7a6f55',
              borderRadius: 3,
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%,-50%)',
              width: 78,
              height: 78,
              borderRadius: '50%',
              background: '#fbf7ee',
              border: '2px solid #c2a878',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'inset 0 1px 4px rgba(120,90,40,.2)',
            }}
          >
            <span style={{ font: "600 26px/1 'Oswald'", color: '#2c2519' }}>
              {v.windSpeed}
            </span>
            <span
              style={{
                font: "400 10px/1 'Oswald'",
                letterSpacing: '.1em',
                color: '#9a7c4a',
                marginTop: 2,
              }}
            >
              MPH {v.windCompass}
            </span>
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 48,
          padding: '24px 28px 0',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={stat}>{v.gust}</div>
          <div style={statLabel}>Gust mph</div>
        </div>
        <div style={{ width: 1, background: '#cdbb98' }} />
        <div style={{ textAlign: 'center' }}>
          <div style={stat}>
            {v.hum}
            <span style={{ fontSize: 16 }}>%</span>
          </div>
          <div style={statLabel}>Humidity</div>
        </div>
        <div style={{ width: 1, background: '#cdbb98' }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ font: "italic 600 26px/1 'Playfair Display',serif", color: '#2c2519' }}>
            {v.presLabel}
          </div>
          <div style={statLabel}>{v.presValInHg}</div>
        </div>
      </div>
    </div>
  )
}

/* ============ C · SUNNY SIDE ============ */
function Sunny({ v }) {
  const eye = (left) => ({
    position: 'absolute',
    top: 38,
    left,
    width: 9,
    height: 11,
    borderRadius: '50%',
    background: '#7a5320',
    animation: 'blink 5s infinite',
  })
  const cheek = (left) => ({
    position: 'absolute',
    top: 50,
    left,
    width: 11,
    height: 7,
    borderRadius: '50%',
    background: 'rgba(255,120,80,.4)',
  })
  const pinwheel = (pos) => ({
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: '50%',
    ...pos,
  })
  const statTile = (bg) => ({
    borderRadius: 22,
    padding: '16px 12px',
    textAlign: 'center',
    background: bg,
  })
  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100dvh',
        background:
          'linear-gradient(180deg, #bfe3ff 0%, #e8f4ff 38%, #fff8ec 100%)',
        color: '#34465c',
        fontFamily: "'Nunito',system-ui",
        overflow: 'hidden',
        paddingBottom: 120,
      }}
    >
      <div
        style={{
          position: 'absolute',
          // Threads the gap between the header block (ends ~144px) and the
          // temperature, whose line-height:.82 pulls its glyphs up to ~181px.
          top: 150,
          left: 30,
          width: 70,
          height: 22,
          borderRadius: 20,
          background: 'rgba(255,255,255,.85)',
          animation: 'drift 9s ease-in-out infinite alternate',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 230,
          right: 34,
          width: 54,
          height: 18,
          borderRadius: 20,
          background: 'rgba(255,255,255,.7)',
          animation: 'drift 11s ease-in-out infinite alternate',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 96,
          right: 30,
          width: 88,
          height: 88,
          animation: 'float 5s ease-in-out infinite',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 38% 34%, #ffe27a, #ffc23d)',
            boxShadow: '0 8px 22px rgba(255,180,40,.45)',
            animation: 'sunpulse 4s ease-in-out infinite',
          }}
        />
        <div style={eye(26)} />
        <div style={eye(52)} />
        <div
          style={{
            position: 'absolute',
            top: 54,
            left: 34,
            width: 20,
            height: 10,
            borderBottom: '3px solid #7a5320',
            borderRadius: '0 0 12px 12px',
          }}
        />
        <div style={cheek(22)} />
        <div style={cheek(56)} />
      </div>

      <div style={{ padding: '80px 28px 0' }}>
        <div style={{ font: "700 22px/1.1 'Fredoka',sans-serif", color: '#2f4660' }}>
          {v.greeting}
        </div>
        <div style={{ font: "600 14px/1 'Nunito'", color: '#7d93ab', marginTop: 6 }}>
          Parkview Observatory · {v.obs}
        </div>
        <div style={{ font: "600 14px/1 'Nunito'", color: '#7d93ab', marginTop: 6 }}>
          {v.dateLine}
        </div>
      </div>

      <div style={{ padding: '24px 28px 0' }}>
        <div
          style={{
            font: "700 132px/.82 'Fredoka',sans-serif",
            color: '#2f4660',
            letterSpacing: '-.03em',
          }}
        >
          {v.tempBig}
          <span style={{ fontSize: 56 }}>{v.tempFrac}</span>
        </div>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            marginTop: 18,
            padding: '8px 16px',
            borderRadius: 30,
            background: '#ffe9a8',
          }}
        >
          <span style={{ font: "700 16px/1 'Fredoka',sans-serif", color: '#b07d12' }}>
            {v.condPlayful}
          </span>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          margin: '30px 28px 0',
          padding: '16px 18px',
          borderRadius: 26,
          background: '#ffffff',
          boxShadow: '0 8px 22px rgba(120,160,200,.18)',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: 54,
            height: 54,
            flexShrink: 0,
            animation: 'spin 6s linear infinite',
          }}
        >
          <div style={pinwheel({ top: 0, left: 21, background: '#ff8a5c' })} />
          <div style={pinwheel({ bottom: 0, left: 21, background: '#5cc8ff' })} />
          <div style={pinwheel({ left: 0, top: 21, background: '#7ed957' })} />
          <div style={pinwheel({ right: 0, top: 21, background: '#ffd23d' })} />
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%,-50%)',
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: '#2f4660',
            }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ font: "700 14px/1 'Fredoka',sans-serif", color: '#2f4660' }}>
            Wind
          </div>
          <div style={{ font: "600 13px/1.3 'Nunito'", color: '#7d93ab', marginTop: 3 }}>
            {v.windLinePlayful}
          </div>
        </div>
        <div style={{ font: "700 26px/1 'Fredoka',sans-serif", color: '#ff8a5c' }}>
          {v.windSpeed}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 12,
          padding: '14px 28px 0',
        }}
      >
        <div style={statTile('#ffe4d6')}>
          <div style={{ font: "700 26px/1 'Fredoka',sans-serif", color: '#e2682f' }}>
            {v.gust}
          </div>
          <div
            style={{
              font: "700 11px/1.3 'Nunito'",
              color: '#c4774f',
              marginTop: 6,
              textTransform: 'uppercase',
              letterSpacing: '.04em',
            }}
          >
            Gust
          </div>
        </div>
        <div style={statTile('#d6ecff')}>
          <div style={{ font: "700 26px/1 'Fredoka',sans-serif", color: '#2f86d6' }}>
            {v.humPct}
          </div>
          <div
            style={{
              font: "700 11px/1.3 'Nunito'",
              color: '#4f80b0',
              marginTop: 6,
              textTransform: 'uppercase',
              letterSpacing: '.04em',
            }}
          >
            Humidity
          </div>
        </div>
        <div style={statTile('#dcf3df')}>
          <div style={{ font: "700 22px/1 'Fredoka',sans-serif", color: '#2f9e54' }}>
            {v.presLabel}
          </div>
          <div
            style={{
              font: "700 11px/1.3 'Nunito'",
              color: '#4f9468',
              marginTop: 6,
              textTransform: 'uppercase',
              letterSpacing: '.04em',
            }}
          >
            {v.presValInHg}
          </div>
        </div>
      </div>

      <div
        style={{
          textAlign: 'center',
          padding: '22px 28px 0',
          font: "600 13px/1.4 'Nunito'",
          color: '#9bb0c6',
        }}
      >
        Feels like {v.feels} · a lovely day to be outside
      </div>
    </div>
  )
}

/* ============ THEME SWITCHER ============ */
function Switcher({ design, onPick }) {
  const labels = { nightfall: 'Nightfall', brass: 'Brass', sunny: 'Sunny' }
  return (
    <div
      style={{
        position: 'fixed',
        left: '50%',
        bottom: 'max(env(safe-area-inset-bottom), 32px)',
        transform: 'translateX(-50%)',
        zIndex: 80,
        display: 'flex',
        gap: 4,
        padding: 5,
        borderRadius: 30,
        background: 'rgba(18,22,32,.66)',
        WebkitBackdropFilter: 'blur(14px) saturate(160%)',
        backdropFilter: 'blur(14px) saturate(160%)',
        boxShadow: '0 10px 30px rgba(0,0,0,.28)',
        border: '1px solid rgba(255,255,255,.12)',
      }}
    >
      {THEMES.map((key) => {
        const active = design === key
        return (
          <button
            key={key}
            onClick={() => onPick(key)}
            style={{
              border: 'none',
              cursor: 'pointer',
              padding: '9px 17px',
              borderRadius: 24,
              font: "600 13px/1 'Nunito',system-ui",
              transition: 'all .18s ease',
              background: active ? '#ffffff' : 'transparent',
              color: active ? '#16203a' : 'rgba(255,255,255,.62)',
            }}
          >
            {labels[key]}
          </button>
        )
      })}
    </div>
  )
}

export default function App() {
  const [metrics, setMetrics] = useState(() => extractMetrics(SAMPLE_RESPONSE))
  const [source, setSource] = useState('sample')
  const [design, setDesign] = useState('nightfall')

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch('/api/current')
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        const next = extractMetrics(data)
        if (next && !cancelled) {
          setMetrics(next)
          setSource('live')
        }
      } catch {
        // Keep showing the last good (or sample) data on failure.
        if (!cancelled) setSource((s) => (s === 'live' ? 'live' : 'sample'))
      }
    }

    load()
    const id = setInterval(load, REFRESH_MS)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', THEME_COLORS[design])
  }, [design])

  const v = useMemo(() => computeValues(metrics, source), [metrics, source])

  if (!metrics) {
    return (
      <main className="app-shell">
        <p className="empty">No station data available.</p>
      </main>
    )
  }

  return (
    <div className="app-shell">
      {design === 'nightfall' && <Nightfall v={v} />}
      {design === 'brass' && <Brass v={v} />}
      {design === 'sunny' && <Sunny v={v} />}
      <Switcher design={design} onPick={setDesign} />
    </div>
  )
}
