import { BarChart, type Bar } from './BarChart'
import { jstParts, useCountUp, useNow, useSokuhoData, type SokuhoData } from './data'

const FREEZE_FALLBACK = '2026-11-24T12:00:00+09:00'

export default function App() {
  const { data, failed } = useSokuhoData()
  const now = useNow()
  const freezeAt = Date.parse(data?.freezeAt ?? FREEZE_FALLBACK)
  const frozen = now >= freezeAt

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col gap-12 px-5 py-10 text-neutral-950 dark:text-white">
      <header className="flex flex-col gap-2">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">46th NUTMEGハッカソン 速報</p>
        <h1 className="text-3xl font-bold">
          <span className="inline-block">追い込み</span>
          <span className="inline-block">半端ないって！！</span>
        </h1>
      </header>

      <Countdown now={now} freezeAt={freezeAt} />

      {data ? <Body data={data} now={now} frozen={frozen} /> : <Loading failed={failed} />}
    </main>
  )
}

function Countdown({ now, freezeAt }: { now: number; freezeAt: number }) {
  const left = Math.max(0, freezeAt - now)
  if (left === 0) {
    return (
      <section className="flex flex-col gap-1 border-y border-neutral-300 py-6 dark:border-neutral-700">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">コードフリーズ</p>
        <p className="text-2xl font-semibold">12:00 になりました。おつかれさま！</p>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">夕方の成果発表会で会いましょう。</p>
      </section>
    )
  }
  const s = Math.floor(left / 1000)
  const hh = Math.floor(s / 3600)
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0')
  const ss = String(s % 60).padStart(2, '0')
  const soon = left <= 10 * 60 * 1000

  return (
    <section className="flex flex-col gap-1 border-y border-neutral-300 py-6 dark:border-neutral-700">
      <p className="text-sm text-neutral-600 dark:text-neutral-400">コードフリーズ（12:00）まで</p>
      {/* 1 秒ごとに数字が変わるので、ここだけ桁幅をそろえてガタつかないようにする */}
      <p className={`text-5xl font-semibold tabular-nums sm:text-6xl ${soon ? 'text-accent' : ''}`} role="timer">
        {hh}:{mm}:{ss}
      </p>
    </section>
  )
}

function Body({ data, now, frozen }: { data: SokuhoData; now: number; frozen: boolean }) {
  const today = useCountUp(data.today)
  const share = data.total ? Math.round((data.today / data.total) * 100) : 0
  const lastDay = data.byDay[data.byDay.length - 1]

  const dayBars: Bar[] = data.byDay.map((d, i) => {
    const [, m, day] = d.date.split('-').map(Number)
    const last = i === data.byDay.length - 1
    return {
      tick: i === 0 || last || day % 5 === 0 ? `${m}/${day}` : '',
      name: `${m}/${day}`,
      n: d.n,
      accent: last,
      showValue: last,
    }
  })

  const hourBars: Bar[] = data.byHour.map((n, h) => ({
    tick: h % 6 === 0 ? `${h}` : '',
    name: `${h} 時台`,
    n,
    accent: h <= 4,
  }))
  const night = data.byHour.slice(0, 5).reduce((a, b) => a + b, 0)
  const nightShare = data.total ? Math.round((night / data.total) * 100) : 0

  const t = jstParts(now)
  const isToday = lastDay && t.month === Number(lastDay.date.slice(5, 7)) && t.day === Number(lastDay.date.slice(8, 10))
  const nowHour = isToday && !frozen ? t.hour : null
  const todayBars: Bar[] = data.todayByHour.map((n, h) => ({
    tick: h % 3 === 0 ? `${h}` : '',
    name: `${h} 時台`,
    n,
    accent: h === nowHour,
  }))

  const updated = jstParts(Date.parse(data.updatedAt))

  return (
    <>
      <section className="flex flex-col gap-1">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">今日（{lastDay?.date.slice(5).replace('-', '/')}）の commit</p>
        <p className="text-6xl font-semibold">{today.toLocaleString()}</p>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          2 週間ぶん {data.total.toLocaleString()} 件のうち <span className="font-semibold text-neutral-950 dark:text-white">{share}%</span> が今日です
        </p>
      </section>

      <BarChart
        title="日ごとの commit"
        bars={dayBars}
        note="11/22 から地面が盛り上がって、今日で崖になりました。"
        nameHeader="日付"
      />

      <BarChart
        title="時間帯ごとの commit（2 週間ぶん）"
        bars={hourBars}
        note={`夜中の 0〜4 時に、全体の ${nightShare}%。`}
        nameHeader="時間帯"
      />

      <BarChart
        title="今日の 1 時間ごと"
        bars={todayBars}
        note={
          nowHour !== null
            ? `いまの ${nowHour} 時台は ${data.todayByHour[nowHour] ?? 0} 件（${updated.hour}:${updated.minute} 時点）。`
            : '0 時から 12 時のフリーズまで。'
        }
        nameHeader="時間帯"
      />

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">ほかにも</h2>
        <ul className="flex list-disc flex-col gap-2 pl-5 leading-relaxed">
          {data.punchlines.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </section>

      <footer className="mt-auto flex flex-col gap-2 border-t border-neutral-300 pt-6 text-sm text-neutral-600 dark:border-neutral-700 dark:text-neutral-400">
        <p className="text-neutral-950 dark:text-white">水分と糖分もコミットしてね。</p>
        <p>
          {updated.month}/{updated.day} {updated.hour}:{updated.minute} 時点の数字です。5 分ごとに読み直しています。
        </p>
        <p>
          各チームの公開リポジトリの commit を、11/10 0:00〜11/24 12:00（日本時間、作者の日時）で数えています。merge commit は数えていません。
        </p>
      </footer>
    </>
  )
}

function Loading({ failed }: { failed: boolean }) {
  return (
    <p className="text-sm text-neutral-600 dark:text-neutral-400">
      {failed ? '数字を読み込めませんでした。少しして開き直してみてください。' : '数字を読み込んでいます…'}
    </p>
  )
}
