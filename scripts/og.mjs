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
const BG = '#0a0a0a'
const TEXT = '#fafafa'
const MUTED = '#a3a3a3'
const BAR = '#404040'
const RAINBOW = ['#ff3b3b', '#ff9f1a', '#ffe11a', '#3bff6a', '#1ad1ff', '#5b6bff', '#c03bff']
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

// 横向きの虹（文字の塗り）。x1〜x2 の範囲で一周させる
const rainbowH = (id, x1, x2) =>
  `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${x1}" y1="0" x2="${x2}" y2="0">${RAINBOW.map(
    (c, i) => `<stop offset="${i / (RAINBOW.length - 1)}" stop-color="${c}"/>`,
  ).join('')}</linearGradient>`

// グラフの領域
const cx = 80
const cw = W - 160
const cy = 262
const ch = 246
const gap = 6
const bw = (cw - gap * 23) / 24
const max = Math.max(...hours)
const r = 4

// 深夜 0〜4 時の棒は、ページと同じく左から順に虹の色（下が濃く、上が明るい）
const nightDefs = [0, 1, 2, 3, 4]
  .map((h) => {
    const hue = (h / 4) * 280
    return `<linearGradient id="n${h}" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="hsl(${hue} 100% 50%)"/><stop offset="1" stop-color="hsl(${hue + 35} 100% 65%)"/></linearGradient>`
  })
  .join('')

const barPath = (h, n) => {
  const x = cx + h * (bw + gap)
  const bh = n === 0 ? 0 : Math.max(3, (n / max) * ch)
  if (!bh) return ''
  const y = cy + ch - bh
  const rr = Math.min(r, bh)
  // 上だけ角を丸め、下は基線に揃える
  return `M${x},${cy + ch} V${y + rr} Q${x},${y} ${x + rr},${y} H${x + bw - rr} Q${x + bw},${y} ${x + bw},${y + rr} V${cy + ch} Z`
}

const grayBars = hours
  .map((n, h) => (h <= 4 ? '' : `<path d="${barPath(h, n)}" fill="${BAR}"/>`))
  .join('')
const nightBars = hours
  .slice(0, 5)
  .map((n, h) => `<path d="${barPath(h, n)}" fill="url(#n${h})"/>`)
  .join('')

const ticks = [0, 3, 6, 9, 12, 15, 18, 21]
  .map((h) => {
    const x = cx + h * (bw + gap) + bw / 2
    return `<text x="${x}" y="${cy + ch + 38}" text-anchor="middle" font-size="26" fill="${MUTED}">${h}時</text>`
  })
  .join('')

const peakX = cx + peak * (bw + gap) + bw / 2
const peakY = cy + ch - (hours[peak] / max) * ch
const peakLabel = `<text x="${peakX}" y="${peakY - 14}" text-anchor="middle" font-size="30" font-weight="900" fill="${TEXT}">${hours[peak]}</text>`

// 昼の低い棒の上の空いたところに、斜めのひとこと
const stickerX = 840
const stickerY = 350

const html = `<!doctype html>
<html lang="ja"><head><meta charset="utf-8"><style>
  html, body { margin: 0; background: ${BG}; }
  svg { display: block; font-family: ${FONT}; }
</style></head><body>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    ${rainbowH('strip', 0, W)}
    ${rainbowH('title', cx, cx + 1000)}
    ${rainbowH('sticker', stickerX - 280, stickerX + 280)}
    ${nightDefs}
    <filter id="glow" x="-50%" y="-20%" width="200%" height="140%">
      <feGaussianBlur stdDeviation="9" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <pattern id="hazard" width="28" height="28" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="14" height="28" fill="#f5c400"/><rect x="14" width="14" height="28" fill="#111"/>
    </pattern>
  </defs>
  <rect width="${W}" height="${H}" fill="${BG}"/>
  <rect width="${W}" height="10" fill="url(#strip)"/>
  <text x="${cx}" y="72" font-size="26" font-weight="700" fill="${MUTED}" letter-spacing="2">46th NUTMEGハッカソン 速報：追い込み半端ないって！！</text>
  <text x="${cx}" y="150" font-size="66" font-weight="900" fill="url(#title)">夜中の 0〜4 時に、commit の ${share}%</text>
  <text x="${cx}" y="200" font-size="26" fill="${MUTED}">時間帯ごとの commit（2 週間ぶん ${total.toLocaleString()} 件）</text>
  ${grayBars}
  <g filter="url(#glow)">${nightBars}</g>
  <line x1="${cx}" x2="${cx + cw}" y1="${cy + ch + 1}" y2="${cy + ch + 1}" stroke="#404040" stroke-width="2"/>
  ${peakLabel}
  ${ticks}
  <text x="${stickerX}" y="${stickerY}" transform="rotate(-4 ${stickerX} ${stickerY})" text-anchor="middle" font-size="40" font-weight="900" fill="url(#sticker)" filter="url(#glow)">限界開発気持ちぇぇ～～～！！！</text>
  <text x="${cx + cw}" y="592" text-anchor="end" font-size="22" fill="${MUTED}">${updated} 時点</text>
  <rect y="${H - 18}" width="${W}" height="18" fill="url(#hazard)"/>
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
