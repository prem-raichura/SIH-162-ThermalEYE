import { PageHeader } from '@/components/shell/PageHeader'
import { Panel } from '@/components/panels/Panel'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LAYERS } from '@/store/useLayers'
import { useSettings } from '@/store/useSettings'
import { useFilters } from '@/store/useFilters'
import { logLine } from '@/store/useConsole'
import type { TimeWindow } from '@/lib/types'
import type { Role } from '@/lib/roles'

const WINDOWS: { id: TimeWindow; label: string }[] = [
  { id: '7d', label: 'Last 7 days' },
  { id: '30d', label: 'Last 30 days' },
  { id: '1y', label: 'Last year' },
  { id: 'all', label: 'All six years' },
]

/** Settings change what the other pages actually do — nothing here is decorative. */
export function CpcbSettings({ role }: { role: Role }) {
  const {
    units,
    defaultWindow,
    minCoverageQuality,
    defaultLayers,
    setUnits,
    setDefaultWindow,
    setMinCoverageQuality,
    toggleDefaultLayer,
  } = useSettings()
  const setWindow = useFilters((s) => s.setWindow)

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        role={role}
        eyebrow="Preferences"
        title="Settings"
        description="Defaults for this browser. They apply immediately and survive a refresh."
      />

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="Readings" subtitle="How temperatures are shown across the role">
          <Row label="Temperature unit" hint="Retrieval is in kelvin; Celsius is a display conversion.">
            <Select
              value={units}
              onValueChange={(value) => {
                setUnits(value as 'K' | 'C')
                logLine(role.id, `Temperature unit set to ${value === 'C' ? 'Celsius' : 'kelvin'}`)
              }}
            >
              <SelectTrigger className="h-8 w-[150px] text-[12.5px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="K">Kelvin (K)</SelectItem>
                <SelectItem value="C">Celsius (°C)</SelectItem>
              </SelectContent>
            </Select>
          </Row>

          <Row label="Default time window" hint="Applied when the role is opened.">
            <Select
              value={defaultWindow}
              onValueChange={(value) => {
                setDefaultWindow(value as TimeWindow)
                setWindow(value as TimeWindow)
                logLine(role.id, `Default time window set to ${value}`)
              }}
            >
              <SelectTrigger className="h-8 w-[168px] text-[12.5px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WINDOWS.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Row>
        </Panel>

        <Panel title="Unmapped queue" subtitle="How much mapping effort a candidate needs before it is listed">
          <Row
            label="Minimum coverage quality"
            hint="Absence of a facility only carries information where mapping effort is high (section 11.2)."
          >
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={0.9}
                step={0.05}
                value={minCoverageQuality}
                onChange={(e) => setMinCoverageQuality(Number(e.target.value))}
                onMouseUp={() => logLine(role.id, `Coverage floor set to ${minCoverageQuality.toFixed(2)}`)}
                className="accent-terracotta w-40"
              />
              <span className="tnum font-mono text-[12px]">{minCoverageQuality.toFixed(2)}</span>
            </div>
          </Row>
          <p className="text-ink-faint mt-1 text-[11.5px]">
            At 0.00 every candidate is listed, including those in poorly mapped districts where absence proves nothing.
          </p>
        </Panel>

        <Panel title="Default map layers" subtitle="What is switched on when a map first loads">
          <ul className="divide-line divide-y">
            {LAYERS.map((layer) => (
              <li key={layer.id} className="flex items-center justify-between gap-4 py-2">
                <span className="text-[12.5px]">{layer.label}</span>
                <Switch
                  checked={defaultLayers.includes(layer.id)}
                  onCheckedChange={() => {
                    toggleDefaultLayer(layer.id)
                    logLine(role.id, `${layer.label} default ${defaultLayers.includes(layer.id) ? 'off' : 'on'}`)
                  }}
                />
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="About this build">
          <div className="text-ink-soft space-y-2 text-[12.5px]">
            <p>
              Facility names, coordinates, capacities and register counts come from the collected dataset. Thermal time
              series, model metrics and alert timings are deterministic stand-ins for pipeline output.
            </p>
            <p>
              Nothing here leaves the browser. Settings are stored locally and the only network request the app can make
              is the optional satellite basemap.
            </p>
          </div>
        </Panel>
      </div>
    </div>
  )
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="border-line flex items-start justify-between gap-6 border-b py-3 last:border-b-0">
      <div className="min-w-0">
        <p className="text-[12.5px] font-medium">{label}</p>
        {hint && <p className="text-ink-faint mt-0.5 text-[11.5px]">{hint}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}
