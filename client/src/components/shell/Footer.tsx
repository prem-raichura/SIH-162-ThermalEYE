import { useEffect, useState } from 'react'
import { istClock, istDate } from '@/lib/format'

export function Footer() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <footer className="border-line text-ink-faint flex h-9 items-center justify-between border-t px-4 font-mono text-[10.5px]">
      <span>v1.0.0</span>
      <span className="hidden sm:block">Geospatial insight for a safer, cleaner tomorrow</span>
      <span className="tnum">
        {istDate(now)} · {istClock(now)} IST
      </span>
    </footer>
  )
}
