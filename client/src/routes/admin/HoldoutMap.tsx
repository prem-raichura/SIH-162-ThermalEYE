import { useMemo, useState } from 'react'
import Map, { Layer, NavigationControl, Popup, Source, type MapLayerMouseEvent } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import { INDIA_BOUNDS, offlineStyle } from '@/lib/mapStyle'
import { loadStates, model } from '@/lib/data'
import { useAsyncData } from '@/hooks/useAsyncData'
import { LoadingOverlay } from '@/components/shell/Loader'
import { nf, pct } from '@/lib/format'
import type { HoldoutRegion } from '@/lib/types'

const TRAINING_FILL = 'rgba(47, 110, 122, 0.20)'
const TEST_FILL = 'rgba(193, 74, 51, 0.38)'
const UNASSIGNED_FILL = 'rgba(154, 148, 134, 0.10)'

interface Hover {
  lat: number
  lon: number
  state: string
  region: string
  role: string
  sites: number
  accuracy: number | null
}

/**
 * The split of section 22, drawn. Whole zones train and one zone is never seen, so the map is
 * the argument: the test region is a contiguous block of the country, not a random scatter of
 * points taken from facilities the model already learned.
 */
export function HoldoutMap() {
  const [hover, setHover] = useState<Hover | null>(null)
  // The state fills are the whole figure, so an uncovered load is a blank map that looks
  // like the split itself is missing.
  const { data: statesGeo } = useAsyncData(loadStates, 'State boundaries')

  // A plain record rather than a Map: the maplibre `Map` component shadows the global here.
  const regionOf = useMemo(() => {
    const index: Record<string, HoldoutRegion> = {}
    for (const region of model.holdout.regions) for (const state of region.states) index[state] = region
    return index
  }, [])

  // One match expression over the state name, so the fill is decided by the same region table
  // the figures come from.
  const fillColor = useMemo(() => {
    const pairs: string[] = []
    for (const region of model.holdout.regions) {
      for (const state of region.states) pairs.push(state, region.role === 'test' ? TEST_FILL : TRAINING_FILL)
    }
    return ['match', ['get', 'NAME_1'], ...pairs, UNASSIGNED_FILL] as unknown as string
  }, [])

  const onMove = (e: MapLayerMouseEvent) => {
    const feature = e.features?.[0]
    if (!feature) {
      setHover(null)
      return
    }
    const state = String((feature.properties as Record<string, string>).NAME_1)
    const region = regionOf[state]
    setHover({
      lat: e.lngLat.lat,
      lon: e.lngLat.lng,
      state,
      region: region?.region ?? 'Not in the split',
      role: region?.role ?? 'unassigned',
      sites: region?.sites ?? 0,
      accuracy: region?.accuracy ?? null,
    })
  }

  return (
    <div className="relative h-[520px] overflow-hidden rounded-[14px]">
      {!statesGeo && <LoadingOverlay label="Loading state boundaries" className="z-40" />}
      <Map
        initialViewState={{ longitude: 79.5, latitude: 22.5, zoom: 3.6 }}
        mapStyle={offlineStyle()}
        maxBounds={INDIA_BOUNDS}
        minZoom={3.2}
        maxZoom={8}
        interactiveLayerIds={statesGeo ? ['holdout-fill'] : []}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
        cursor={hover ? 'pointer' : 'grab'}
        attributionControl={{ compact: true }}
        style={{ width: '100%', height: '100%' }}
      >
        {statesGeo && (
          <Source id="holdout" type="geojson" data={statesGeo}>
            <Layer id="holdout-fill" type="fill" paint={{ 'fill-color': fillColor }} />
            <Layer
              id="holdout-line"
              type="line"
              paint={{ 'line-color': 'rgba(120,112,98,0.55)', 'line-width': 0.6 }}
            />
          </Source>
        )}

        <NavigationControl position="bottom-right" showCompass={false} />

        {hover && (
          <Popup longitude={hover.lon} latitude={hover.lat} closeButton={false} closeOnClick={false} offset={12}>
            <div className="bg-card border-line min-w-[190px] rounded-[10px] border px-3 py-2">
              <p className="text-[12.5px] font-semibold">{hover.state}</p>
              <p className="text-ink-soft text-[11.5px]">
                {hover.region} · {hover.role}
              </p>
              <p className="text-ink-faint tnum mt-1 font-mono text-[10.5px]">
                {nf(hover.sites)} sites
                {hover.accuracy !== null && ` · accuracy ${pct(hover.accuracy, 1)}`}
              </p>
            </div>
          </Popup>
        )}
      </Map>

      <div className="bg-card border-line absolute top-3 left-3 rounded-[12px] border px-3.5 py-3">
        <p className="text-[12.5px] font-semibold">The split</p>
        <ul className="mt-2 space-y-1.5 text-[12px]">
          <li className="flex items-center gap-2">
            <span className="h-3 w-5 rounded-[3px]" style={{ backgroundColor: TRAINING_FILL, border: '1px solid rgba(47,110,122,0.6)' }} />
            Training regions
          </li>
          <li className="flex items-center gap-2">
            <span className="h-3 w-5 rounded-[3px]" style={{ backgroundColor: TEST_FILL, border: '1px solid rgba(193,74,51,0.7)' }} />
            Held out — {model.holdout.testRegion}
          </li>
        </ul>
      </div>
    </div>
  )
}
