import { BarChart, type Bar } from './BarChart'
import { EvaTimer } from './EvaTimer'
import { jstParts, useCountUp, useNow, useSokuhoData, type SokuhoData } from './data'

const FREEZE_FALLBACK = '2026-11-24T12:00:00+09:00'

/** プレビュー用：?left=600 で「残り 600 秒」から始める（警告・活動限界の見た目を確かめる） */
const LEFT_OVERRIDE = (() => {
  const v = new URLSearchParams(location.search).get('left')
  return v !== null && Number.isFinite(Number(v)) ? Date.now() + Number(v) * 1000 : null
})()

export default function App() {
  const { data, failed } = useSokuhoData()
  const now = useNow()
  const freezeAt = LEFT_OVERRIDE ?? Date.parse(data?.freezeAt ?? FREEZE_FALLBACK)
  const frozen = now >= freezeAt

  return (
    <>
      <div className="rainbow-strip fixed inset-x-0 top-0 z-10 h-1.5" aria-hidden />
      <main className="mx-auto flex min-h-dvh max-w-xl flex-col gap-12 px-5 py-10 text-neutral-100">
        <header className="flex flex-col gap-2">
          <p className="text-sm font-semibold tracking-widest text-neutral-400">46th NUTMEGハッカソン 速報</p>
          <h1 className="rainbow-text text-4xl leading-tight font-black sm:text-5xl">
            <span className="inline-block">追い込み</span>
            <span className="inline-block">半端ないって！！</span>
          </h1>
        </header>

        <EvaTimer freezeAt={freezeAt} />

        {data ? <Body data={data} now={now} frozen={frozen} /> : <Loading failed={failed} />}
      </main>
    </>
  )
}

function Body({ data, now, frozen }: { data: SokuhoData; now: number; frozen: boolean }) {
  const today = useCountUp(data.today, 1400)
  const done = today === data.today
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
    // 今日の棒は全部、時間の順に虹色にする（色は時間の位置をなぞるだけで、数の大小は表さない）
    accent: true,
    pulse: h === nowHour,
  }))

  const updated = jstParts(Date.parse(data.updatedAt))

  return (
    <>
      <section className="flex flex-col gap-1">
        <p className="text-sm text-neutral-400">今日（{lastDay?.date.slice(5).replace('-', '/')}）の commit</p>
        <div className="relative flex flex-wrap items-end gap-x-4 gap-y-1">
          <p key={done ? 'done' : 'counting'} className={`rainbow-text text-8xl leading-none font-black ${done ? 'pop' : ''}`}>
            {today.toLocaleString()}
          </p>
          {done && (
            <span className="dopa-in rainbow-text my-3 text-2xl font-black whitespace-nowrap sm:text-3xl" aria-hidden>
              限界開発気持ちぇぇ～～～！！！
            </span>
          )}
        </div>
        <p className="mt-2 text-sm text-neutral-400">
          2 週間ぶん {data.total.toLocaleString()} 件のうち <span className="font-bold text-neutral-100">{share}%</span> が今日です
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
        <h2 className="text-lg font-bold">ほかにも</h2>
        <ul className="flex flex-col gap-2 leading-relaxed">
          {data.punchlines.map((p, i) => (
            <li key={p} className="flex gap-3">
              <span
                className="mt-2.5 size-2 shrink-0 rounded-full"
                style={{ background: `hsl(${(i * 70) % 360} 100% 60%)` }}
                aria-hidden
              />
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </section>

      <footer className="mt-auto flex flex-col gap-2 border-t border-neutral-800 pt-6 text-sm text-neutral-400">
        <p className="font-bold text-neutral-100">水分と糖分もコミットしてね。</p>
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
    <p className="text-sm text-neutral-400">
      {failed ? '数字を読み込めませんでした。少しして開き直してみてください。' : '数字を読み込んでいます…'}
    </p>
  )
}
