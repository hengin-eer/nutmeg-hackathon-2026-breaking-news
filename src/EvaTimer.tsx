import { useEffect, useState } from 'react'

// 7 セグメントの数字。点いていない線も薄く描いて、表示器っぽく見せる
const H = (y: number) => `8,${y} 14,${y - 6} 46,${y - 6} 52,${y} 46,${y + 6} 14,${y + 6}`
const V = (x: number, y1: number, y2: number) =>
  `${x},${y1} ${x + 6},${y1 + 6} ${x + 6},${y2 - 6} ${x},${y2} ${x - 6},${y2 - 6} ${x - 6},${y1 + 6}`
const SEG: Record<string, string> = {
  a: H(8),
  b: V(54, 10, 48),
  c: V(54, 52, 90),
  d: H(92),
  e: V(6, 52, 90),
  f: V(6, 10, 48),
  g: H(50),
}
const ON: Record<string, string> = {
  '0': 'abcdef',
  '1': 'bc',
  '2': 'abged',
  '3': 'abgcd',
  '4': 'fgbc',
  '5': 'afgcd',
  '6': 'afgedc',
  '7': 'abc',
  '8': 'abcdefg',
  '9': 'abcdfg',
}

function Digit({ d, className }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 80 100" className={className} aria-hidden>
      {/* skewX で下側が左にずれるぶん、右へ寄せて切れないようにする */}
      <g transform="translate(18 0) skewX(-8)">
        {Object.entries(SEG).map(([k, pts]) => (
          <polygon key={k} points={pts} fill="currentColor" opacity={ON[d]?.includes(k) ? 1 : 0.05} />
        ))}
      </g>
    </svg>
  )
}

function Colon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 100" className={className} aria-hidden>
      <rect x="4" y="28" width="9" height="9" fill="currentColor" />
      <rect x="2" y="64" width="9" height="9" fill="currentColor" />
    </svg>
  )
}

/** 1/100 秒まで動かすため、このタイマーだけ requestAnimationFrame で描き直す */
function useFastNow() {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      const id = setInterval(() => setNow(Date.now()), 1000)
      return () => clearInterval(id)
    }
    let raf = 0
    const step = () => {
      setNow(Date.now())
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [])
  return now
}

const pad = (n: number) => String(n).padStart(2, '0')

export function EvaTimer({ freezeAt }: { freezeAt: number }) {
  const now = useFastNow()
  const left = Math.max(0, freezeAt - now)
  const over = left === 0
  const alert = left <= 10 * 60 * 1000

  const hh = Math.floor(left / 3_600_000)
  const mm = Math.floor((left % 3_600_000) / 60_000)
  const ss = Math.floor((left % 60_000) / 1000)
  const cc = Math.floor((left % 1000) / 10)
  const big = `${pad(hh)}${pad(mm)}${pad(ss)}`
  const small = pad(cc)

  const color = alert ? 'text-eva-alert' : 'text-eva'
  const border = alert ? 'border-eva-alert' : 'border-eva'
  const digit = 'h-12 w-auto sm:h-20'
  const digitSmall = 'h-8 w-auto sm:h-12'

  return (
    <section
      className={`overflow-hidden border-2 ${border} bg-black`}
      role="timer"
      aria-label={over ? 'コードフリーズしました' : `コードフリーズまで ${hh} 時間 ${mm} 分 ${ss} 秒`}
    >
      <div className="hazard h-3" />
      <div className="flex flex-col gap-3 px-4 py-4">
        <div className={`flex items-end justify-between gap-3 ${color}`}>
          <div className="flex flex-col leading-none">
            <span className="text-xs font-bold tracking-[0.3em]">CODE FREEZE 12:00</span>
            <span className={`mt-1 text-3xl font-black tracking-wider sm:text-4xl ${alert ? 'eva-blink' : ''}`}>
              {over ? '活動限界' : '活動限界まで'}
            </span>
          </div>
          <span className="border px-2 py-0.5 text-xs font-bold tracking-widest">
            {over ? '停止' : alert ? '警告' : '追い込み中'}
          </span>
        </div>

        <div className={`eva-glow flex items-end ${color} ${over ? 'eva-blink' : ''}`}>
          <Digit d={big[0]} className={digit} />
          <Digit d={big[1]} className={digit} />
          <Colon className={digit} />
          <Digit d={big[2]} className={digit} />
          <Digit d={big[3]} className={digit} />
          <Colon className={digit} />
          <Digit d={big[4]} className={digit} />
          <Digit d={big[5]} className={digit} />
          <Colon className={digitSmall} />
          <Digit d={small[0]} className={digitSmall} />
          <Digit d={small[1]} className={digitSmall} />
        </div>

        {over && (
          <p className="text-lg font-bold text-neutral-100">
            コードフリーズしました。おつかれさま！夕方の成果発表会で会いましょう。
          </p>
        )}
      </div>
      <div className="hazard h-3" />
    </section>
  )
}
