import { useEffect, useRef } from 'react'
import { ROLES, isRoleId } from '@/lib/roles'
import type { LogLine, LogTag } from '@/store/useConsole'

const TAG_COLOR: Record<string, string> = {
  INFO: 'var(--color-con-info)',
  SUCCESS: 'var(--color-con-success)',
  WARN: 'var(--color-con-warn)',
  ERROR: 'var(--color-con-error)',
}

const tagColor = (tag: LogTag) => (isRoleId(tag) ? ROLES[tag].accent : (TAG_COLOR[tag] ?? 'var(--color-con-faint)'))

const clock = (d: Date) =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`

export function LogStream({ lines, autoScroll }: { lines: LogLine[]; autoScroll: boolean }) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Scroll the log container itself. scrollIntoView would walk up the ancestors and drag the
  // whole page with it, which is what made the dashboard jump on every new line.
  useEffect(() => {
    const el = scrollRef.current
    if (!el || !autoScroll) return
    el.scrollTop = el.scrollHeight
  }, [lines.length, autoScroll])

  if (lines.length === 0) {
    return (
      <div className="text-con-faint grid h-full place-items-center px-4 text-center font-mono text-[11.5px]">
        Nothing logged for this source yet. Switch to Overview to see every line.
      </div>
    )
  }

  return (
    <div
      ref={scrollRef}
      className="console-scroll h-full overflow-y-auto overscroll-contain px-3 py-2 font-mono text-[11.5px] leading-[1.75]"
    >
      {lines.map((line) => (
        <div key={line.id} className="flex gap-3">
          <span className="text-con-faint tnum shrink-0">{clock(line.at)}</span>
          <span className="w-[74px] shrink-0" style={{ color: tagColor(line.tag) }}>
            [{isRoleId(line.tag) ? ROLES[line.tag].short.toUpperCase() : line.tag}]
          </span>
          <span className="text-con-text min-w-0">{line.message}</span>
        </div>
      ))}
    </div>
  )
}
