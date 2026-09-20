import { RotateCw } from 'lucide-react'
import { Brand } from './Brand'
import { BrandSpinner } from './BrandSpinner'
import { cn } from '@/lib/utils'

/**
 * Three ways to say "working", sharing one mark.
 *
 * Each one is a live region with real text rather than motion alone: under
 * prefers-reduced-motion the global rule in `index.css` freezes the arc, and a frozen
 * spinner says nothing.
 */

/** The whole viewport, for the first paint. */
export function LoadingScreen({ label = 'Starting ThermalEye' }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-paper fixed inset-0 z-50 grid place-items-center"
    >
      <div className="flex flex-col items-center gap-6">
        <Brand size="lg" />
        <div className="flex items-center gap-3">
          <BrandSpinner size="md" />
          <span className="text-ink-soft text-[13px]">{label}</span>
        </div>
      </div>
    </div>
  )
}

/**
 * Over a region that already has content behind it — the page area during a navigation, or
 * the map while its layers arrive. Translucent, so the thing being replaced stays visible
 * and the app does not read as a full reload.
 */
export function LoadingOverlay({
  label = 'Loading',
  className,
}: {
  label?: string
  className?: string
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'bg-paper/70 absolute inset-0 z-30 grid place-items-center backdrop-blur-[2px]',
        className,
      )}
    >
      <div className="flex flex-col items-center gap-2.5">
        <BrandSpinner size="md" />
        <span className="text-ink-soft text-[12.5px]">{label}</span>
      </div>
    </div>
  )
}

/**
 * A panel's own box while its file is in flight.
 *
 * It keeps the height of the chart it stands in for, so nothing below it jumps when the data
 * lands — the reason the four existing call sites used a sized `Skeleton` rather than a bare
 * spinner. On failure the same box states what is missing and offers the retry, because a
 * spinner with no way out is just a hang.
 */
export function PanelLoader({
  height,
  label = 'Loading',
  error,
  onRetry,
  className,
}: {
  height: number
  label?: string
  /** What could not be fetched, named as the reader would name it. */
  error?: string | null
  onRetry?: () => void
  className?: string
}) {
  if (error) {
    return (
      <div
        className={cn(
          'border-line bg-paper-deep/40 grid place-items-center rounded-[10px] border px-4 text-center',
          className,
        )}
        style={{ height }}
      >
        <div>
          <p className="text-[12.5px] font-medium">{error}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="border-line hover:border-ink-faint text-ink-soft hover:text-ink mt-2.5 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] transition-colors"
            >
              <RotateCw size={12} strokeWidth={1.9} />
              Try again
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn('bg-accent/60 grid place-items-center rounded-[10px]', className)}
      style={{ height }}
    >
      <div className="flex flex-col items-center gap-2">
        <BrandSpinner size="sm" />
        <span className="text-ink-faint text-[11.5px]">{label}</span>
      </div>
    </div>
  )
}
