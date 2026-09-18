import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Brand } from '@/components/shell/Brand'
import { ROLE_LIST } from '@/lib/roles'
import { useRoleStore } from '@/store/useRole'
import { logLine } from '@/store/useConsole'
import { meta, model } from '@/lib/data'
import { nf } from '@/lib/format'

export function LoginPage() {
  const navigate = useNavigate()
  const setRole = useRoleStore((s) => s.setRole)

  const stats: [string, string][] = [
    ['FIRMS detections', nf(meta.realSources.firmsDetections)],
    ['Thermal sites', nf(meta.counts.sites)],
    ['Unmapped candidates', nf(meta.counts.unmapped)],
    ['Macro-F1', model.macroF1.toFixed(3)],
  ]

  return (
    <div className="bg-paper text-ink min-h-dvh">
      <div className="mx-auto grid min-h-dvh max-w-[1240px] grid-cols-1 gap-10 px-6 py-10 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-16 lg:py-0">
        <section>
          <Brand size="lg" />

          <h1 className="font-display mt-10 text-[clamp(34px,4.4vw,54px)] leading-[1.05]">
            Something is hot.
            <br />
            The question is what, and whether that is normal.
          </h1>

          <p className="text-ink-soft mt-5 max-w-[58ch] text-[15px]">
            ThermalEye groups six years of NASA FIRMS detections into thermal sites, retrieves source temperature and
            size from the dual-band signal, classifies the likely source, and compares today against each site&rsquo;s
            own history. Facility maps are context, not the answer.
          </p>

          <dl className="border-line divide-line mt-9 flex max-w-[560px] divide-x border-t pt-5">
            {stats.map(([label, value]) => (
              <div key={label} className="flex-1 px-4 first:pl-0">
                <dt className="text-ink-faint text-[10px] tracking-[0.1em] uppercase">{label}</dt>
                <dd className="font-display tnum mt-1 text-[22px]">{value}</dd>
              </div>
            ))}
          </dl>

          <p className="font-hand text-ink-faint mt-8 text-[19px]">From signals to safer tomorrows.</p>
        </section>

        <section className="bg-card border-line rounded-[18px] border p-2">
          <div className="px-4 pt-4 pb-3">
            <h2 className="text-[15px] font-semibold">Choose a view</h2>
            <p className="text-ink-soft mt-1 text-[13px]">
              Each organisation sees the part of the system it owns. Pick one to continue.
            </p>
          </div>

          <ul>
            {ROLE_LIST.map((role) => (
              <li key={role.id}>
                <button
                  type="button"
                  onClick={() => {
                    setRole(role.id)
                    logLine('INFO', `Signed in as ${role.short}`)
                    navigate(`/${role.id}`)
                  }}
                  className="hover:bg-paper-deep group flex w-full items-center gap-3.5 rounded-[12px] px-4 py-3 text-left transition-colors"
                >
                  <span
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px]"
                    style={{ backgroundColor: role.accentDim, color: role.accent }}
                  >
                    <role.icon size={18} strokeWidth={1.8} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-medium">{role.org}</span>
                    <span className="text-ink-soft block truncate text-[12.5px]">{role.remit}</span>
                  </span>
                  <ArrowRight
                    size={16}
                    className="text-ink-faint shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                  />
                </button>
              </li>
            ))}
          </ul>

          <p className="text-ink-faint border-line mt-2 border-t px-4 py-3 text-[11.5px]">
            Demo build. Roles are not authenticated and every figure is pre-computed from the collected dataset.
          </p>
        </section>
      </div>
    </div>
  )
}
