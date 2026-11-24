// public/data.json から OGP 画像（public/og.png, 1200×630）を作る。
// 使い方: node scripts/og.mjs
// ヘッドレスの Chrome を使う。場所は OG_CHROME で指定できる（なければ Playwright の headless shell を探す）。
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const data = JSON.parse(readFileSync(join(root, 'public/data.json'), 'utf8'))

const W = 1200
const H = 630
const BG = '#171717'
const TEXT = '#fafafa'
const MUTED = '#a3a3a3'
const BAR = '#737373'
const ACCENT = '#d95926'
const FONT = "'Harano Aji Gothic', 'Noto Sans CJK JP', 'Hiragino Sans', sans-serif"

const hours = data.byHour
const total = data.total
const night = hours.slice(0, 5).reduce((a, b) => a + b, 0)
const share = Math.round((night / total) * 100)
const peak = hours.indexOf(Math.max(...hours))

const jst = new Intl.DateTimeFormat('ja-JP', {
  timeZone: 'Asia/Tokyo',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hourCycle: 'h23',
}).formatToParts(new Date(data.updatedAt))
const p = Object.fromEntries(jst.map((x) => [x.type, x.value]))
const updated = `${p.month}/${p.day} ${p.hour}:${p.minute}`

// グラフの領域
const cx = 80
const cw = W - 160
const cy = 270
const ch = 250
const gap = 6
const bw = (cw - gap * 23) / 24
const max = Math.max(...hours)
const r = 4

const bars = hours
  .map((n, h) => {
    const x = cx + h * (bw + gap)
    const bh = n === 0 ? 0 : Math.max(3, (n / max) * ch)
    const y = cy + ch - bh
    const fill = h <= 4 ? ACCENT : BAR
    const rr = Math.min(r, bh)
    // 上だけ角を丸め、下は基線に揃える
    const d = `M${x},${cy + ch} V${y + rr} Q${x},${y} ${x + rr},${y} H${x + bw - rr} Q${x + bw},${y} ${x + bw},${y + rr} V${cy + ch} Z`
    return bh ? `<path d="${d}" fill="${fill}"/>` : ''
  })
  .join('')

const ticks = [0, 3, 6, 9, 12, 15, 18, 21]
  .map((h) => {
    const x = cx + h * (bw + gap) + bw / 2
    return `<text x="${x}" y="${cy + ch + 40}" text-anchor="middle" font-size="26" fill="${MUTED}">${h}時</text>`
  })
  .join('')

const peakX = cx + peak * (bw + gap) + bw / 2
const peakY = cy + ch - (hours[peak] / max) * ch
const peakLabel = `<text x="${peakX}" y="${peakY - 14}" text-anchor="middle" font-size="28" font-weight="700" fill="${TEXT}">${hours[peak]}</text>`

const html = `<!doctype html>
<html lang="ja"><head><meta charset="utf-8"><style>
  html, body { margin: 0; background: ${BG}; }
  svg { display: block; font-family: ${FONT}; }
</style></head><body>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${BG}"/>
  <text x="${cx}" y="82" font-size="28" fill="${MUTED}">46th NUTMEGハッカソン 速報：追い込み半端ないって！！</text>
  <text x="${cx}" y="160" font-size="64" font-weight="700" fill="${TEXT}">夜中の <tspan fill="${ACCENT}">0〜4 時</tspan>に、commit の ${share}%</text>
  <text x="${cx}" y="214" font-size="28" fill="${MUTED}">時間帯ごとの commit（2 週間ぶん ${total.toLocaleString()} 件）</text>
  ${bars}
  <line x1="${cx}" x2="${cx + cw}" y1="${cy + ch + 1}" y2="${cy + ch + 1}" stroke="#404040" stroke-width="2"/>
  ${peakLabel}
  ${ticks}
  <text x="${cx + cw}" y="${H - 30}" text-anchor="end" font-size="22" fill="${MUTED}">${updated} 時点</text>
</svg></body></html>`

const dir = mkdtempSync(join(tmpdir(), 'og-'))
const page = join(dir, 'og.html')
writeFileSync(page, html)

function findChrome() {
  if (process.env.OG_CHROME) return process.env.OG_CHROME
  const base = join(homedir(), '.cache/ms-playwright')
  if (existsSync(base)) {
    const shells = readdirSync(base)
      .filter((d) => d.startsWith('chromium_headless_shell-'))
      .sort()
      .reverse()
    for (const d of shells) {
      const bin = join(base, d, 'chrome-headless-shell-linux64/chrome-headless-shell')
      if (existsSync(bin)) return bin
    }
  }
  return 'google-chrome'
}

const out = join(root, 'public/og.png')
execFileSync(
  findChrome(),
  ['--headless', '--hide-scrollbars', '--disable-gpu', `--window-size=${W},${H}`, `--screenshot=${out}`, `file://${page}`],
  { stdio: ['ignore', 'ignore', 'ignore'] },
)
console.log(`${out} を作りました（${updated} 時点、夜中 0〜4 時 ${share}%）`)
