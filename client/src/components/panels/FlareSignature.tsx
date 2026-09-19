import { Check, Minus } from 'lucide-react'
import type { SignatureCheck } from '@/routes/ppac/usePpacData'
import { STATUS } from '@/lib/chart'

/**
 * Why a site reads as a flare (section 7.5). Every condition shows the site's own retrieved
 * value against the threshold, so the verdict is auditable instead of asserted.
 */
export function FlareSignature({ checks, siteName }: { checks: SignatureCheck[]; siteName: string }) {
  const passed = checks.filter((c) => c.pass).length

  return (
    <div>
      <p className="text-ink-soft text-[12.5px]">
        {siteName} matches <strong className="text-ink">{passed} of {checks.length}</strong> conditions in the flare
        signature. The retrieval is measured from the dual-band signal, not inferred from the facility map.
      </p>

      <ul className="divide-line mt-3 divide-y">
        {checks.map((check) => (
          <li key={check.label} className="flex items-center gap-3 py-2">
            <span
              className="grid h-5 w-5 shrink-0 place-items-center rounded-full"
              style={{
                backgroundColor: check.pass ? 'var(--color-forest-dim)' : 'var(--color-paper-deep)',
                color: check.pass ? STATUS.good : 'var(--color-ink-faint)',
              }}
            >
              {check.pass ? <Check size={12} strokeWidth={2.4} /> : <Minus size={12} strokeWidth={2.4} />}
            </span>
            <span className="min-w-0 flex-1 text-[12.5px]">{check.label}</span>
            <span className="tnum font-mono text-[11.5px]">{check.value}</span>
            <span className="text-ink-faint w-[132px] text-right text-[11px]">{check.threshold}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
