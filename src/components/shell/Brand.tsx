import { cn } from '@/lib/utils'

/** The mark: an aperture ring around a hot centre. Used on the rail and the login page. */
export function BrandMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} aria-hidden="true">
      <circle cx="16" cy="16" r="15" fill="var(--color-terracotta)" />
      <circle cx="16" cy="16" r="9" fill="none" stroke="var(--color-paper)" strokeWidth="2" />
      <circle cx="16" cy="16" r="3.4" fill="var(--color-ramp-4)" />
    </svg>
  )
}

export function Brand({ size = 'md', className }: { size?: 'md' | 'lg'; className?: string }) {
  const large = size === 'lg'
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <BrandMark size={large ? 44 : 32} />
      <div className="leading-none">
        <div className={cn('font-display text-ink', large ? 'text-3xl' : 'text-[19px]')}>ThermalEye</div>
        <div
          className={cn(
            'text-ink-faint mt-1 font-mono uppercase',
            large ? 'text-[11px] tracking-[0.18em]' : 'text-[9px] tracking-[0.16em]',
          )}
        >
          See. Understand. Act.
        </div>
      </div>
    </div>
  )
}
