import { Collapsible } from '@base-ui/react/collapsible'
import { useState } from 'react'

export type Bar = {
  /** 軸に出す短いラベル（空なら出さない） */
  tick: string
  /** タップしたときに出す名前（例：11/24、3 時台） */
  name: string
  n: number
  accent?: boolean
  /** 棒の上に数字を出す */
  showValue?: boolean
}

type Props = {
  title: string
  bars: Bar[]
  /** 何もタップしていないときの一言 */
  note: string
  /** 表の見出し */
  nameHeader: string
}

export function BarChart({ title, bars, note, nameHeader }: Props) {
  const [active, setActive] = useState<number | null>(null)
  const max = Math.max(1, ...bars.map((b) => b.n))
  const current = active === null ? null : bars[active]

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-base font-semibold">{title}</h2>

      <p className="min-h-5 text-sm text-neutral-600 dark:text-neutral-400" aria-live="polite">
        {current ? (
          <>
            <span className="font-semibold text-neutral-950 dark:text-white">{current.name}</span>：{current.n} 件
          </>
        ) : (
          note
        )}
      </p>

      <div
        className="flex h-44 items-end gap-[2px] border-b border-neutral-300 dark:border-neutral-700"
        onMouseLeave={() => setActive(null)}
      >
        {bars.map((b, i) => (
          <button
            key={b.name}
            type="button"
            aria-label={`${b.name}：${b.n} 件`}
            className="group relative flex h-full min-w-0 flex-1 flex-col items-center justify-end outline-none"
            onMouseEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
            onClick={() => setActive(active === i ? null : i)}
          >
            {b.showValue && (
              <span className="mb-1 text-xs font-semibold tabular-nums text-neutral-950 dark:text-white">{b.n}</span>
            )}
            <span
              className={`bar-grow block w-full max-w-6 rounded-t-[4px] ${
                b.accent ? 'bg-accent' : 'bg-bar'
              } ${active === i ? 'opacity-70' : ''} group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-neutral-950 dark:group-focus-visible:outline-white`}
              style={{
                height: b.n === 0 ? 0 : `max(2px, ${(b.n / max) * 100}%)`,
                animationDelay: `${i * 25}ms`,
              }}
            />
          </button>
        ))}
      </div>

      <div className="-mt-1 flex gap-[2px] text-xs text-neutral-500 tabular-nums" aria-hidden>
        {bars.map((b) => (
          <span key={b.name} className="min-w-0 flex-1 overflow-visible text-center whitespace-nowrap">
            {b.tick}
          </span>
        ))}
      </div>

      <Collapsible.Root>
        <Collapsible.Trigger className="group flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-950 focus-visible:outline-2 focus-visible:outline-neutral-950 dark:text-neutral-400 dark:hover:text-white dark:focus-visible:outline-white">
          <CaretRightIcon className="transition-transform duration-100 group-data-panel-open:rotate-90" />
          数字で見る
        </Collapsible.Trigger>
        <Collapsible.Panel className="h-[var(--collapsible-panel-height)] overflow-hidden transition-[height] duration-150 ease-out data-ending-style:h-0 data-starting-style:h-0 [&[hidden]:not([hidden='until-found'])]:hidden">
          <table className="mt-2 w-full text-sm tabular-nums">
            <thead>
              <tr className="border-b border-neutral-300 text-left text-neutral-600 dark:border-neutral-700 dark:text-neutral-400">
                <th className="py-1 font-normal">{nameHeader}</th>
                <th className="py-1 text-right font-normal">commit</th>
              </tr>
            </thead>
            <tbody>
              {bars.map((b) => (
                <tr key={b.name} className="border-b border-neutral-200 dark:border-neutral-800">
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
