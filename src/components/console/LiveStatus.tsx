import { useEffect, useState } from 'react'
import { istClock } from '@/lib/format'
import type { Role } from '@/lib/roles'

export function LiveStatus({ role, lineCount }: { role: Role; lineCount: number }) {
  const [sync, setSync] = useState(() => istClock())

  useEffect(() => {
    const id = window.setInterval(() => setSync(istClock()), 1000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <div className="bg-con-panel border-con-line flex h-full flex-col gap-3 rounded-[10px] border px-3.5 py-3">
      <div>
        <p className="text-con-text text-[12px] font-semibold">Live Status</p>
        <p className="mt-1.5 flex items-center gap-2 text-[11.5px]">
          <span className="bg-con-success h-2 w-2 rounded-full" />
          <span className="text-con-success">All systems operational</span>
        </p>
      </div>

      <div className="flex items-center gap-2 text-[11.5px]">
        <role.icon size={14} strokeWidth={1.8} style={{ color: role.accent }} />
        <span className="text-con-text">
          Active role: <span className="font-semibold">{role.short}</span>
        </span>
      </div>

      <div className="text-con-faint mt-auto font-mono text-[10.5px]">
        <div className="tnum">Last sync {sync} IST</div>
        <div className="tnum">{lineCount} lines buffered</div>
      </div>
    </div>
  )
}
