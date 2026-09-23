import { BrandMark } from './Brand'
import { cn } from '@/lib/utils'

const SIZE = { sm: 28, md: 44, lg: 76 } as const

export type SpinnerSize = keyof typeof SIZE

/**
 * The mark, waiting.
 *
 * The ring spins, not the mark. The mark is a badge with the name set around its rim, so
 * rotating it would drag the wordmark upside down, and distorting it to fake motion would
 * mean shipping a second version of the logo. An arc sweeping the outside reads as motion
 * and leaves the identity alone.
 *
 * The glow outside the arc is tinted from the role accent, so the loader arrives in the
 * colour of whichever desk is open.
 */
export function BrandSpinner({
  size = 'md',
  className,
}: {
  size?: SpinnerSize
  className?: string
}) {
  const box = SIZE[size]

  return (
    <span
      className={cn('relative inline-grid shrink-0 place-items-center', className)}
      style={{ width: box, height: box }}
    >
      <svg
        viewBox="0 0 48 48"
        className="te-spin absolute inset-0 h-full w-full"
        style={{ filter: 'drop-shadow(0 0 6px var(--role-accent-dim))' }}
        aria-hidden="true"
      >
        <circle cx="24" cy="24" r="22" fill="none" stroke="var(--color-line)" strokeWidth="2" />
        <circle
          cx="24"
          cy="24"
          r="22"
          fill="none"
          stroke="var(--role-accent)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="34 104"
        />
      </svg>

      <BrandMark size={Math.round(box * 0.56)} />
    </span>
  )
}
