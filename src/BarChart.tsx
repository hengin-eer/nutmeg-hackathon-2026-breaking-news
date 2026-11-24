import { Collapsible } from '@base-ui/react/collapsible'
import { useState, type CSSProperties } from 'react'

export type Bar = {
  /** 軸に出す短いラベル（空なら出さない） */
  tick: string
  /** タップしたときに出す名前（例：11/24、3 時台） */
  name: string
  n: number
  /** 虹色で強調する */
  accent?: boolean
  /** 棒の上に数字を出す */
  showValue?: boolean
  /** ふわっと光らせる（いまの 1 時間） */
  pulse?: boolean
}

type Props = {
  title: string
  bars: Bar[]
  /** 何もタップしていないときの一言 */
  note: string
  /** 表の見出し */
  nameHeader: string
}

const RAINBOW_V = 'linear-gradient(to top, #ff3b3b, #ff9f1a, #ffe11a, #3bff6a, #1ad1ff, #5b6bff, #c03bff)'

/** 強調する棒の色。1 本なら縦に虹、複数なら左から順に虹の色を割り振る */
function accentStyle(order: number, count: number): CSSProperties {
  if (count === 1) {
    return { background: RAINBOW_V, boxShadow: '0 0 18px rgba(255, 159, 26, 0.55)' }
  }
  const hue = (order / Math.max(1, count - 1)) * 280
  return {
    background: `linear-gradient(to top, hsl(${hue} 100% 50%), hsl(${hue + 35} 100% 65%))`,
    boxShadow: `0 0 16px hsl(${hue} 100% 55% / 0.6)`,
  }
}

export function BarChart({ title, bars, note, nameHeader }: Props) {
  const [active, setActive] = useState<number | null>(null)
  const max = Math.max(1, ...bars.map((b) => b.n))
  const current = active === null ? null : bars[active]
  const accentIdx = bars.flatMap((b, i) => (b.accent ? [i] : []))

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-bold text-neutral-100">{title}</h2>

      <p className="min-h-5 text-sm text-neutral-400" aria-live="polite">
        {current ? (
          <>
            <span className="font-semibold text-neutral-100">{current.name}</span>：{current.n} 件
          </>
        ) : (
          note
        )}
      </p>

      <div className="flex h-48 items-end gap-[3px] border-b border-neutral-700" onMouseLeave={() => setActive(null)}>
        {bars.map((b, i) => {
          const style: CSSProperties = {
            height: b.n === 0 ? 0 : `max(3px, ${(b.n / max) * 100}%)`,
            animationDelay: `${i * 30}ms`,
            ...(b.accent ? accentStyle(accentIdx.indexOf(i), accentIdx.length) : {}),
          }
          return (
            <button
              key={b.name}
              type="button"
              aria-label={`${b.name}：${b.n} 件`}
              className="group relative flex h-full min-w-0 flex-1 flex-col items-center justify-end outline-none"
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onClick={() => setActive(active === i ? null : i)}
            >
              {b.showValue && <span className="rainbow-text mb-1 text-sm font-black tabular-nums">{b.n}</span>}
              <span
                className={`${b.pulse ? 'bar-pulse' : 'bar-grow'} block w-full max-w-7 rounded-t-[4px] ${
                  b.accent ? '' : 'bg-bar'
                } ${active === i ? 'brightness-150' : ''} group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-white`}
                style={style}
              />
            </button>
          )
        })}
      </div>

      <div className="-mt-1 flex gap-[3px] text-xs text-neutral-500 tabular-nums" aria-hidden>
        {bars.map((b) => (
          <span key={b.name} className="min-w-0 flex-1 overflow-visible text-center whitespace-nowrap">
            {b.tick}
          </span>
        ))}
      </div>

      <Collapsible.Root>
        <Collapsible.Trigger className="group flex items-center gap-1 text-sm text-neutral-400 hover:text-white focus-visible:outline-2 focus-visible:outline-white">
          <CaretRightIcon className="transition-transform duration-100 group-data-panel-open:rotate-90" />
          数字で見る
        </Collapsible.Trigger>
        <Collapsible.Panel className="h-[var(--collapsible-panel-height)] overflow-hidden transition-[height] duration-150 ease-out data-ending-style:h-0 data-starting-style:h-0 [&[hidden]:not([hidden='until-found'])]:hidden">
          <table className="mt-2 w-full text-sm text-neutral-200 tabular-nums">
            <thead>
              <tr className="border-b border-neutral-700 text-left text-neutral-400">
                <th className="py-1 font-normal">{nameHeader}</th>
                <th className="py-1 text-right font-normal">commit</th>
              </tr>
            </thead>
            <tbody>
              {bars.map((b) => (
                <tr key={b.name} className="border-b border-neutral-800">
                  <td className="py-1">{b.name}</td>
                  <td className="py-1 text-right">{b.n}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Collapsible.Panel>
      </Collapsible.Root>
    </section>
  )
}

function CaretRightIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden {...props}>
      <path d="M6 12V4l4.5 4z" />
    </svg>
  )
}
