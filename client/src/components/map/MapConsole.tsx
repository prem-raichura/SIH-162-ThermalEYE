import type { ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { FileText, Table2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ReadingsStrip, type Reading } from './ReadingsStrip'
import { ThermalLegend } from './ThermalLegend'
import { TimeWindowPicker } from './TimeWindowPicker'
import { useFullBleed } from '@/lib/layout'
import type { Role } from '@/lib/roles'

/**
 * The map-first page shell.
 *
 * The map is the page: it takes the whole content area, and everything that used to sit above
 * or below it — the readings, the selection, the record table — floats over it in panels that
 * fold away. Only one row of chrome sits outside the map, because a title and a set of
 * readings have to stay legible whatever imagery is underneath them.
 *
 * Below the compact breakpoint there is no room to float anything, so the page renders its
 * `fallback` — the ordinary stacked layout — and the shell gives the scroll back.
 */
export function MapConsole({
  role,
  title,
  readings,
  timeControl,
  listAction,
  action,
  map,
  docks,
  fallback,
}: {
  role: Role
  title: string
  readings: Reading[]
  /** Replaces the general time filter, for a console that narrows by something else. */
  timeControl?: ReactNode
  /** The way to the records as text. The console shows the country, not the rows. */
  listAction?: { label: string; onClick: () => void }
  action?: { label: string; onClick: () => void }
  map: ReactNode
  /** The right-hand column of `MapDock`s. */
  docks?: ReactNode
  fallback: ReactNode
}) {
  const { section } = useParams()
  const fullBleed = useFullBleed(role.id, section)

  if (!fullBleed) return <>{fallback}</>

  return (
    <div className="bg-card border-line flex h-full min-h-0 flex-col overflow-hidden rounded-[14px] border">
      {/* Wraps rather than clips: on a narrow console the readings drop to their own row
          instead of sliding under the window picker. */}
      <div className="border-line flex min-h-12 shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b px-4 py-2">
        <h2 className="font-display shrink-0 truncate text-[17px] leading-none">{title}</h2>
        <ReadingsStrip items={readings} className="flex-wrap gap-y-1.5" />

        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
          {timeControl ?? <TimeWindowPicker />}
          <ThermalLegend />
          {listAction && (
            <Button
              size="sm"
              variant="outline"
              onClick={listAction.onClick}
              className="gap-1.5 rounded-[9px]"
            >
              <Table2 size={14} strokeWidth={1.8} />
              {listAction.label}
            </Button>
          )}
          {action && (
            <Button size="sm" onClick={action.onClick} className="gap-1.5 rounded-[9px]">
              <FileText size={14} strokeWidth={1.8} />
              {action.label}
            </Button>
          )}
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        {map}

        {/* The full height of the right-hand side: the map keeps all of its own chrome on
            the left, so there is nothing here to start below or stop short of. The padding
            keeps a focus ring on an edge dock from being clipped by the column's scroll,
            and lines the docks up with the map controls opposite them. */}
        {docks && (
          <div className="panel-scroll pointer-events-none absolute top-2 right-2 bottom-2 z-10 flex w-[344px] flex-col overflow-y-auto p-1">
            <div className="pointer-events-auto flex min-h-0 flex-1 flex-col gap-2">{docks}</div>
          </div>
        )}
      </div>
    </div>
  )
}
