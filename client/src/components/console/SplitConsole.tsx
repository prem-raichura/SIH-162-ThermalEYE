import { useCallback, useEffect, useMemo, useRef } from 'react'
import { ChevronDown, ChevronUp, Download, Eraser, RefreshCw } from 'lucide-react'
import { LogStream } from './LogStream'
import { LiveStatus } from './LiveStatus'
import { useConsole } from '@/store/useConsole'
import { ROLE_LIST, type Role } from '@/lib/roles'
import { cn } from '@/lib/utils'

const HEADER_H = 40
const MIN_H = 140

/**
 * Bottom-docked operator log. Every user action in the app writes a line here, which is
 * what makes a static dataset read as a live system.
 */
export function SplitConsole({ role }: { role: Role }) {
  const { lines, filter, autoScroll, collapsed, height } = useConsole()
  const { clear, setFilter, setAutoScroll, setCollapsed, setHeight } = useConsole()
  const dragFrom = useRef<{ y: number; h: number } | null>(null)

  const visible = useMemo(
    () => (filter === 'all' ? lines : lines.filter((l) => l.tag === filter)),
    [lines, filter],
  )

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (collapsed) return
      e.currentTarget.setPointerCapture(e.pointerId)
      dragFrom.current = { y: e.clientY, h: height }
      document.body.style.userSelect = 'none'
    },
    [collapsed, height],
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragFrom.current) return
      const max = Math.round(window.innerHeight * 0.5)
      const next = Math.min(max, Math.max(MIN_H, dragFrom.current.h + (dragFrom.current.y - e.clientY)))
      setHeight(next)
    },
    [setHeight],
  )

  const endDrag = useCallback(() => {
    dragFrom.current = null
    document.body.style.userSelect = ''
  }, [])

  const exportLog = () => {
    const body = visible
      .map((l) => `${l.at.toISOString()} [${String(l.tag).toUpperCase()}] ${l.message}`)
      .join('\n')
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const url = URL.createObjectURL(new Blob([`${body}\n`], { type: 'text/plain' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `thermaleye-console-${stamp}.log`
    a.click()
    URL.revokeObjectURL(url)
    useConsole.getState().log('SUCCESS', `Exported ${visible.length} console lines`)
  }

  return (
    <section
      aria-label="Split console"
      className="bg-con-bg text-con-text shrink-0 overflow-hidden"
      style={{ height: collapsed ? HEADER_H : height }}
    >
      {/* The whole header is the resize handle — a 4px strip is too small to hit reliably. */}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onDoubleClick={() => setCollapsed(!collapsed)}
        role="separator"
        aria-orientation="horizontal"
        aria-label="Resize console"
        className={cn(
          'flex h-[40px] touch-none items-center px-4 select-none',
          collapsed ? 'cursor-pointer' : 'cursor-ns-resize',
        )}
      >
        <span className="bg-con-line mr-3 h-0.5 w-8 rounded-full" aria-hidden="true" />
        <span className="text-[12px] font-semibold">Split Console</span>
        <span className="text-con-faint ml-3 font-mono text-[10.5px]">
          {visible.length}/{lines.length}
        </span>
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expand console' : 'Collapse console'}
          className="text-con-faint hover:text-con-text ml-auto rounded p-1 transition-colors"
        >
          {collapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {!collapsed && (
        <div
          className="grid gap-3 px-4 pb-3"
          style={{ height: height - HEADER_H - 12, gridTemplateColumns: 'minmax(0,180px) minmax(0,1fr) 220px 128px' }}
        >
          <ul className="console-scroll overflow-y-auto pr-1">
            <li>
              <SourceRow label="Overview" active={filter === 'all'} onClick={() => setFilter('all')} />
            </li>
            {ROLE_LIST.map((r) => (
              <li key={r.id}>
                <SourceRow
                  label={r.short}
                  color={r.accent}
                  active={filter === r.id}
                  onClick={() => setFilter(r.id)}
                />
              </li>
            ))}
          </ul>

          <div className="bg-con-panel border-con-line min-w-0 rounded-[10px] border">
            <LogStream lines={visible} autoScroll={autoScroll} />
          </div>

          <LiveStatus role={role} lineCount={lines.length} />

          <div className="flex flex-col gap-2">
            <ConsoleButton icon={Eraser} label="Clear" onClick={clear} />
            <ConsoleButton icon={Download} label="Export" onClick={exportLog} />
            <button
              type="button"
              onClick={() => setAutoScroll(!autoScroll)}
              aria-pressed={autoScroll}
              className="border-con-line hover:border-con-faint flex items-center gap-2 rounded-[8px] border px-2.5 py-2 text-[11.5px] transition-colors"
            >
              <RefreshCw size={13} strokeWidth={1.8} />
              <span className="flex-1 text-left">Auto scroll</span>
              <span
                className={cn(
                  'relative h-4 w-7 rounded-full transition-colors',
                  autoScroll ? 'bg-con-success' : 'bg-con-line',
                )}
              >
                <span
                  className={cn(
                    'absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all',
                    autoScroll ? 'left-3.5' : 'left-0.5',
                  )}
                />
              </span>
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

function SourceRow({
  label,
  color,
  active,
  onClick,
}: {
  label: string
  color?: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-[6px] py-1.5 pr-2 pl-2.5 text-left text-[11.5px] transition-colors',
        active ? 'bg-con-panel text-con-text' : 'text-con-faint hover:text-con-text',
      )}
      style={active ? { boxShadow: `inset 2px 0 0 ${color ?? 'var(--color-con-info)'}` } : undefined}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: color ?? 'var(--color-con-info)' }} />
      {label}
    </button>
  )
}

function ConsoleButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Eraser
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="border-con-line hover:border-con-faint flex items-center gap-2 rounded-[8px] border px-2.5 py-2 text-[11.5px] transition-colors"
    >
      <Icon size={13} strokeWidth={1.8} />
      {label}
    </button>
  )
}

// Module-level so the sequence plays once per session, not once per mount. React's dev
// double-invoke would otherwise swallow it.
let booted = false

/** Replays a short boot sequence the first time the shell mounts. */
export function useConsoleBoot(role: Role, lines: string[]) {
  useEffect(() => {
    if (booted) return
    booted = true
    const log = useConsole.getState().log
    const tagFor = (i: number) => (i === lines.length - 1 ? 'SUCCESS' : i % 2 === 0 ? 'INFO' : role.id)

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      lines.forEach((message, i) => log(tagFor(i), message))
      return
    }
    lines.forEach((message, i) => {
      window.setTimeout(() => log(tagFor(i), message), 140 * (i + 1))
    })
  }, [role, lines])
}
