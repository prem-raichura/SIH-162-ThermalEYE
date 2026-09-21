import { useMemo, useState } from 'react'
import { Download, FileJson, FileSpreadsheet } from 'lucide-react'
import { PageHeader } from '@/components/shell/PageHeader'
import { Panel } from '@/components/panels/Panel'
import { StatTile } from '@/components/panels/StatTile'
import { Button } from '@/components/ui/button'
import { useNrscData } from './useNrscData'
import { DEFAULT_PROVENANCE, useNrsc } from '@/store/useNrsc'
import { useSettingsFor } from '@/store/useRoleSettings'
import {
  EXPORT_FIELDS,
  FIELD_GROUP_LABEL,
  downloadText,
  sitesToCsv,
  sitesToExportGeoJson,
  type FieldGroup,
} from '@/lib/exportSites'
import { meta } from '@/lib/data'
import { nf } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Role } from '@/lib/roles'

const GROUPS: FieldGroup[] = ['identity', 'thermal', 'temporal', 'provenance']

const stamp = () => new Date().toISOString().slice(0, 10)

/** Cross-publication hand-off. The file is built in the browser; nothing is uploaded. */
export function NrscExport({ role }: { role: Role }) {
  const { filtered, published } = useNrscData()
  const provenance = useNrsc((s) => s.provenance)
  // The saved format is the one offered as the primary action.
  const preferJson = useSettingsFor('nrsc').exportFormat === 'json'
  const [group, setGroup] = useState<FieldGroup | 'all'>('all')
  const [lastFile, setLastFile] = useState<string | null>(null)

  const rows = useMemo(() => (group === 'all' ? EXPORT_FIELDS : EXPORT_FIELDS.filter((f) => f.group === group)), [group])
  const preview = useMemo(() => published[0], [published])

  const filtersOn =
    provenance.register !== DEFAULT_PROVENANCE.register ||
    provenance.match !== DEFAULT_PROVENANCE.match ||
    provenance.dataQuality !== DEFAULT_PROVENANCE.dataQuality ||
    provenance.sentinel1 !== DEFAULT_PROVENANCE.sentinel1 ||
    provenance.sentinel2 !== DEFAULT_PROVENANCE.sentinel2 ||
    provenance.minSarQuality > DEFAULT_PROVENANCE.minSarQuality ||
    provenance.minOpticalQuality > DEFAULT_PROVENANCE.minOpticalQuality ||
    provenance.maxCloudFraction < DEFAULT_PROVENANCE.maxCloudFraction ||
    provenance.maxTemporalGap < DEFAULT_PROVENANCE.maxTemporalGap

  const exportGeoJson = () => {
    const name = `thermaleye-sites-${stamp()}.geojson`
    downloadText(name, 'application/geo+json', JSON.stringify(sitesToExportGeoJson(published), null, 2))
    setLastFile(name)
  }

  const exportCsv = () => {
    const name = `thermaleye-sites-${stamp()}.csv`
    downloadText(name, 'text/csv', sitesToCsv(published))
    setLastFile(name)
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        role={role}
        eyebrow="Hand-off"
        title="Export"
        description="The published schema and a copy of the current selection. The file is built in this browser from the bundled data — nothing is uploaded and nothing is fetched."
        meta={[
          { label: 'Selected', value: nf(published.length) },
          { label: 'Fields', value: nf(EXPORT_FIELDS.length) },
          { label: 'Window ends', value: meta.windowEnd },
        ]}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <StatTile
          icon={FileJson}
          label="Records in the file"
          value={nf(published.length)}
          caption={filtersOn ? `${nf(filtered.length)} in the layer before provenance filters` : 'The whole filtered layer'}
        />
        <StatTile icon={FileSpreadsheet} label="Columns" value={nf(EXPORT_FIELDS.length)} caption="Same fields in CSV and GeoJSON" />
        <StatTile
          icon={Download}
          label="Last file written"
          value={lastFile ? '1' : '—'}
          caption={lastFile ?? 'Nothing exported yet in this session'}
          tone={lastFile ? 'good' : 'neutral'}
        />
      </div>

      <Panel
        title="Download"
        subtitle="GeoJSON reopens in the map; CSV carries the same columns"
        action={
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={preferJson ? 'default' : 'outline'}
              className="gap-1.5 rounded-[9px]"
              onClick={exportGeoJson}
            >
              <FileJson size={14} strokeWidth={1.8} />
              GeoJSON
            </Button>
            <Button
              size="sm"
              variant={preferJson ? 'outline' : 'default'}
              className="gap-1.5 rounded-[9px]"
              onClick={exportCsv}
            >
              <FileSpreadsheet size={14} strokeWidth={1.8} />
              CSV
            </Button>
          </div>
        }
      >
        <p className="text-ink-soft text-[12.5px]">
          The export follows whatever is selected on the Full Site Layer and Provenance pages — class, state, search and
          every provenance filter. {filtersOn ? 'Provenance filters are active.' : 'No provenance filter is active.'}
        </p>
        <p className="text-ink-faint mt-2 text-[11.5px]">
          Geometry is a point at the site centroid in WGS 84. Fields that have no value are written as null in GeoJSON
          and left empty in CSV — an unavailable acquisition is never filled in with a placeholder.
        </p>
      </Panel>

      <Panel title="Schema" subtitle={`${nf(rows.length)} of ${nf(EXPORT_FIELDS.length)} fields shown`}>
        <div className="mb-3 flex flex-wrap gap-1.5">
          <Chip on={group === 'all'} onClick={() => setGroup('all')}>
            All fields
          </Chip>
          {GROUPS.map((g) => (
            <Chip key={g} on={group === g} onClick={() => setGroup(g)}>
              {FIELD_GROUP_LABEL[g]}
            </Chip>
          ))}
        </div>

        <div className="panel-scroll max-h-[480px] overflow-auto overscroll-contain">
          <table className="w-full min-w-[640px] text-[12.5px]">
            <thead className="text-ink-faint sticky top-0 z-10 text-[10.5px] [&_th]:bg-card [&_th]:border-line [&_th]:border-b">
              <tr>
                <th className="py-2 pr-3 text-left font-normal">Field</th>
                <th className="px-3 py-2 text-left font-normal">Type</th>
                <th className="px-3 py-2 text-left font-normal">Meaning</th>
                <th className="py-2 pl-3 text-right font-normal">First record</th>
              </tr>
            </thead>
            <tbody className="divide-line divide-y">
              {rows.map((field) => {
                const value = preview ? field.read(preview) : null
                return (
                  <tr key={field.key}>
                    <td className="tnum py-2 pr-3 font-mono text-[11.5px]">{field.key}</td>
                    <td className="text-ink-soft px-3 py-2">{field.type}</td>
                    <td className="text-ink-soft max-w-[420px] px-3 py-2">{field.description}</td>
                    <td className="tnum text-ink-faint max-w-[160px] truncate py-2 pl-3 text-right font-mono text-[11px]">
                      {value === null ? 'null' : String(value)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  )
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'border-line rounded-full border px-2.5 py-1 text-[11.5px]',
        on ? 'bg-ink text-paper border-ink' : 'hover:border-ink-faint',
      )}
    >
      {children}
    </button>
  )
}
