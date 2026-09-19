import { create } from 'zustand'
import type { ColumnId } from '@/components/panels/SiteTable'
import type { DataQuality, MatchConfidence, RegisterSource } from '@/lib/types'

export type Availability = 'any' | 'yes' | 'no'

/** Provenance filters. Every column of the provenance table can narrow the published set. */
export interface ProvenanceFilters {
  register: RegisterSource | 'all'
  match: MatchConfidence | 'all'
  dataQuality: DataQuality | 'all'
  sentinel1: Availability
  sentinel2: Availability
  /** Minimum SAR and optical quality scores a record must carry to be published. */
  minSarQuality: number
  minOpticalQuality: number
  /** Cloud fraction ceiling and temporal-gap ceiling, both inclusive. */
  maxCloudFraction: number
  maxTemporalGap: number
}

export const DEFAULT_PROVENANCE: ProvenanceFilters = {
  register: 'all',
  match: 'all',
  dataQuality: 'all',
  sentinel1: 'any',
  sentinel2: 'any',
  minSarQuality: 0,
  minOpticalQuality: 0,
  maxCloudFraction: 1,
  maxTemporalGap: 90,
}

/** The columns the cross-publication table opens with. */
export const DEFAULT_COLUMNS: ColumnId[] = ['name', 'class', 'state', 'operator', 'confidence', 'lastDetection']

interface NrscState {
  provenance: ProvenanceFilters
  columns: ColumnId[]
  setProvenance: <K extends keyof ProvenanceFilters>(key: K, value: ProvenanceFilters[K]) => void
  resetProvenance: () => void
  setColumns: (ids: ColumnId[]) => void
}

export const useNrsc = create<NrscState>((set) => ({
  provenance: DEFAULT_PROVENANCE,
  columns: DEFAULT_COLUMNS,
  setProvenance: (key, value) => set((s) => ({ provenance: { ...s.provenance, [key]: value } })),
  resetProvenance: () => set({ provenance: DEFAULT_PROVENANCE }),
  setColumns: (columns) => set({ columns }),
}))
