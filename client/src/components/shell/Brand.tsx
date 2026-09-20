import { cn } from '@/lib/utils'

/**
 * The mark: one half the observed world, the other half the retrieval and what it is looking at.
 * Used on the rail, the login page and inside the loader.
 *
 * Served at 256px and drawn at 32-44, so it stays sharp on a 3x display without shipping the
 * full-resolution original.
 */
export function BrandMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <img
      src="/thermaleye.png"
      width={size}
      height={size}
      className={className}
      alt=""
      aria-hidden="true"
      draggable={false}
      style={{ objectFit: 'contain' }}
    />
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
