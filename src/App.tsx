import React, { useEffect, useMemo, useState } from 'react'

type FloodIndex = {
  generatedAt: string
  timeZone: string
  hourPath: string
  source: string
  totalItems: number
  floodCount: number
  warningCount?: number
  items: Array<{
    code: string
    name: string
    observedAt?: string
    placePref?: string
    placeCity?: string
    placeRiver?: string
    level?: number
    fladLevel?: number | null
    isFlood?: boolean
    isWarning?: boolean
    latitude?: number
    longitude?: number
  }>
}

export const App: React.FC = () => {
  const [data, setData] = useState<FloodIndex | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const url = `/data/latest.json`

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setLoading(true)
        const res = await fetch(url)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = (await res.json()) as FloodIndex
        if (!alive) return
        setData(json)
      } catch (e: any) {
        if (!alive) return
        setError(e?.message ?? String(e))
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [url])

  const alerts = useMemo(
    () => (data?.items ? data.items.filter((it) => it.isFlood || it.isWarning) : []),
    [data]
  )

  if (loading) return <div>Loading…</div>
  if (error) return <div>Error: {error}</div>
  if (!data) return <div>No data</div>

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: 16 }}>
      <h1>河川氾濫情報（最新）</h1>
      <p>
        生成: <code>{data.generatedAt}</code> / 時間帯: <code>{data.hourPath}</code>
      </p>
      <p>
        収集件数: <b>{data.totalItems}</b> / 氾濫件数: <b>{data.floodCount}</b>
        {typeof data.warningCount === 'number' ? (
          <>
            {' '}/ 警戒件数: <b>{data.warningCount}</b>
          </>
        ) : null}
      </p>
      <ul>
        {alerts.slice(0, 20).map((it) => (
          <li key={it.code}>
            {it.placePref ?? ''} {it.placeCity ?? ''} {it.placeRiver ?? it.name} —
            {it.isFlood ? '[FLOOD] ' : it.isWarning ? '[WARN] ' : ''}
            {typeof it.level === 'number' ? ` Lv: ${it.level}` : ''}
          </li>
        ))}
      </ul>
      {alerts.length > 20 ? (
        <p>(他 {alerts.length - 20} 件)</p>
      ) : null}
    </div>
  )
}
