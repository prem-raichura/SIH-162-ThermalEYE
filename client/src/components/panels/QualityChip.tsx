import { cn } from '@/lib/utils'
import { STATUS } from '@/lib/chart'
import { useActiveSettings } from '@/store/useRoleSettings'

/** A 0-1 quality or coverage score, shown as a meter so "how much to trust this" is visible. */
export function QualityChip({
  label,
  score,
  className,
  width = 52,
}: {
  label?: string
  score: number
  className?: string
  width?: number
}) {
  // The "trustworthy" line is the signed-in role's own, so a meter and the count beside it
  // can never disagree about what counts as well mapped.
  const settings = useActiveSettings()
  const good = 'trustworthyCoverage' in settings ? settings.trustworthyCoverage : 0.66
  const color = score >= good ? STATUS.good : score >= good * 0.6 ? STATUS.warning : STATUS.critical
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-[11.5px]', className)}>
      {label && <span className="text-ink-soft">{label}</span>}
      <span className="bg-line relative h-1.5 overflow-hidden rounded-full" style={{ width }}>
        <span
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${Math.round(score * 100)}%`, backgroundColor: color }}
        />
      </span>
      <span className="tnum font-mono text-[11px]">{score.toFixed(2)}</span>
    </span>
  )
}
