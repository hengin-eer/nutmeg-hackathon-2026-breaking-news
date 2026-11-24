import { useEffect, useRef, useState } from 'react'

export type SokuhoData = {
  updatedAt: string
  freezeAt: string
  total: number
  today: number
  mergedPrs: number
  byDay: { date: string; n: number }[]
  byHour: number[]
  todayByHour: number[]
  punchlines: string[]
}

const RELOAD_MS = 5 * 60 * 1000

/** data.json を読み、5 分ごとに読み直す（ページを開いたままでも数字が伸びるように） */
export function useSokuhoData() {
  const [data, setData] = useState<SokuhoData | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        const res = await fetch(`${import.meta.env.BASE_URL}data.json?t=${Date.now()}`)
        if (!res.ok) throw new Error(String(res.status))
        const json = (await res.json()) as SokuhoData
        if (alive) {
          setData(json)
          setFailed(false)
        }
      } catch {
        if (alive) setFailed(true)
      }
    }
    load()
    const id = setInterval(load, RELOAD_MS)
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [])

  return { data, failed }
}

/** 1 秒ごとに今の時刻を返す */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}

/** 数字を前の値から新しい値までカウントアップする */
export function useCountUp(target: number, durationMs = 900) {
  const [shown, setShown] = useState(0)
  const shownRef = useRef(0)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const from = shownRef.current
    const set = (v: number) => {
      shownRef.current = v
      setShown(v)
    }
    if (reduce || from === target) {
      set(target)
      return
    }
    let raf = 0
    const start = performance.now()
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / durationMs)
      const eased = 1 - (1 - p) ** 3
      set(Math.round(from + (target - from) * eased))
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, durationMs])

  return shown
}

/** JST の時・日付を取り出す（見る人の端末のタイムゾーンに左右されないように） */
const jst = new Intl.DateTimeFormat('ja-JP', {
  timeZone: 'Asia/Tokyo',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hourCycle: 'h23',
})

export function jstParts(ms: number) {
  const parts = Object.fromEntries(jst.formatToParts(ms).map((p) => [p.type, p.value]))
  return {
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: parts.minute,
  }
}
