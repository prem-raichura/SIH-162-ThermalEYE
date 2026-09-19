import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Map, {
  Layer,
  NavigationControl,
  Popup,
  ScaleControl,
  Source,
  type MapLayerMouseEvent,
  type MapRef,
} from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'

import { offlineStyle, satelliteStyle, BOUNDARY_PAINT, INDIA_BOUNDS } from '@/lib/mapStyle'
import {
  aoiRing,
  alertsToGeoJson,
  detectionsToGeoJson,
  sitesToGeoJson,
  unmappedToGeoJson,
} from '@/lib/mapData'
import {
  aoiLayer,
  abnormalRingLayer,
  alertLayer,
  heatLayer,
  landcoverLayer,
  siteLayer,
  unmappedLayer,
} from './layers'
import { BasemapToggle } from './BasemapToggle'
import { LayerPanel } from './LayerPanel'
import { ThermalLegend } from './ThermalLegend'
import { TimeWindowPicker } from './TimeWindowPicker'
import {
  alerts as allAlerts,
  landcover,
  loadDetections,
  loadDistricts,
  loadStates,
  unmapped as allUnmapped,
  WINDOW_DAYS,
} from '@/lib/data'
import type { Detection, ThermalSite, UnmappedCandidate } from '@/lib/types'
import type { FeatureCollection } from 'geojson'
import { useFilters } from '@/store/useFilters'
import { useLayers, type LayerId } from '@/store/useLayers'
import { logLine } from '@/store/useConsole'
import type { Role } from '@/lib/roles'
import { cn } from '@/lib/utils'
import { kelvin, megawatt } from '@/lib/format'

interface HoverInfo {
  lon: number
  lat: number
  title: string
  sub: string
  readings: string[]
}

export function ThermalMap({
  role,
  sites,
  unmapped = allUnmapped,
  availableLayers,
  controls = 'overlay',
  aspect = 'square',
  className,
}: {
  role: Role
  sites: ThermalSite[]
  unmapped?: UnmappedCandidate[]
  availableLayers?: LayerId[]
  /** 'below' moves the controls into a bar under the map, for small panels. */
  controls?: 'overlay' | 'below'
  /** Canvas shape when the controls sit below — the map sizes itself from its width. */
  aspect?: 'square' | 'landscape' | 'tall'
  className?: string
}) {
  const mapRef = useRef<MapRef>(null)
  const [detections, setDetections] = useState<Detection[]>([])
  const [statesGeo, setStatesGeo] = useState<FeatureCollection | null>(null)
  const [districtsGeo, setDistrictsGeo] = useState<FeatureCollection | null>(null)
  const [hover, setHover] = useState<HoverInfo | null>(null)

  const window = useFilters((s) => s.window)
  const selectedSiteId = useFilters((s) => s.selectedSiteId)
  const selectedUnmappedId = useFilters((s) => s.selectedUnmappedId)
  const selectSite = useFilters((s) => s.selectSite)
  const selectUnmapped = useFilters((s) => s.selectUnmapped)
  const visible = useLayers((s) => s.visible)
  const basemap = useLayers((s) => s.basemap)
  const setBasemap = useLayers((s) => s.setBasemap)
  const setTilesFailed = useLayers((s) => s.setTilesFailed)

  // The style object must be stable: a fresh object each render makes react-map-gl rebuild
  // the style and the data layers never settle.
  const mapStyle = useMemo(() => (basemap === 'satellite' ? satelliteStyle() : offlineStyle()), [basemap])

  const shows = useCallback(
    (id: LayerId) => visible[id] && (!availableLayers || availableLayers.includes(id)),
    [visible, availableLayers],
  )

  useEffect(() => {
    loadDetections()
      .then(setDetections)
      .catch(() => logLine('ERROR', 'Detection layer could not be loaded'))
    loadStates()
      .then(setStatesGeo)
      .catch(() => logLine('ERROR', 'State boundaries could not be loaded'))
  }, [])

  // Districts are 1.1 MB, so they only load the first time the layer is switched on.
  useEffect(() => {
    if (!visible.districts || districtsGeo) return
    loadDistricts()
      .then(setDistrictsGeo)
      .catch(() => logLine('ERROR', 'District boundaries could not be loaded'))
  }, [visible.districts, districtsGeo])

  const days = WINDOW_DAYS[window]
  const siteIds = useMemo(() => new Set(sites.map((s) => s.id)), [sites])

  const heatData = useMemo(
    () => detectionsToGeoJson(detections.filter((d) => d.siteId === null || siteIds.has(d.siteId))),
    [detections, siteIds],
  )
  const siteData = useMemo(() => sitesToGeoJson(sites), [sites])
  const unmappedData = useMemo(() => unmappedToGeoJson(unmapped), [unmapped])
  const alertData = useMemo(() => alertsToGeoJson(allAlerts.filter((a) => siteIds.has(a.siteId))), [siteIds])

  const landcoverData = useMemo(() => {
    const features = sites.slice(0, 400).map((s) => {
      const mix = landcover[s.id]
      const dominant = mix
        ? (Object.entries(mix).sort((a, b) => b[1] - a[1])[0][0] as string)
        : 'builtup'
      return {
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [s.lon, s.lat] },
        properties: { dominant },
      }
    })
    return { type: 'FeatureCollection' as const, features }
  }, [sites])

  const selected = useMemo(() => sites.find((s) => s.id === selectedSiteId) ?? null, [sites, selectedSiteId])
  const selectedUnmapped = useMemo(
    () => unmapped.find((u) => u.id === selectedUnmappedId) ?? null,
    [unmapped, selectedUnmappedId],
  )
  const aoi = useMemo(() => {
    const target = selected ?? selectedUnmapped
    return target ? aoiRing(target.lat, target.lon) : null
  }, [selected, selectedUnmapped])

  // Frame the role's own sites once the map is ready, so PPAC opens on the refinery belt and
  // FSI on the forest states without hand-tuned coordinates per role.
  const fitted = useRef(false)
  const siteRef = useRef(sites)
  siteRef.current = sites

  const fitToSites = useCallback(() => {
    const rows = siteRef.current
    if (fitted.current || !mapRef.current || rows.length === 0) return
    fitted.current = true
    const lons = rows.map((s) => s.lon)
    const lats = rows.map((s) => s.lat)
    mapRef.current.fitBounds(
      [
        [Math.min(...lons), Math.min(...lats)],
        [Math.max(...lons), Math.max(...lats)],
      ],
      { padding: 48, maxZoom: 6.5, duration: 0 },
    )
  }, [])

  // Fly whenever a selection is made anywhere in the app — table row, palette, alert card.
  useEffect(() => {
    const target = selected ?? selectedUnmapped
    if (!target || !mapRef.current) return
    mapRef.current.easeTo({ center: [target.lon, target.lat], zoom: Math.max(mapRef.current.getZoom(), 8.5), duration: 900 })
  }, [selected, selectedUnmapped])

  const onClick = (e: MapLayerMouseEvent) => {
    const feature = e.features?.[0]
    if (!feature) {
      selectSite(null)
      return
    }
    const props = feature.properties as Record<string, string>
    if (feature.layer.id === 'unmapped-ring') {
      selectUnmapped(props.id)
      logLine(role.id, `Selected unmapped candidate #${props.rank} — ${props.state}`)
      return
    }
    if (feature.layer.id === 'alerts-circle') {
      selectSite(props.siteId)
      logLine(role.id, `Opened alert ${props.id} — ${props.siteName}`)
      return
    }
    selectSite(props.id)
    logLine(role.id, `Selected ${props.name} — ${props.classLabel}, ${props.state}`)
  }

  const onMove = (e: MapLayerMouseEvent) => {
    const feature = e.features?.[0]
    if (!feature) {
      setHover(null)
      return
    }
    const p = feature.properties as Record<string, string | number>
    if (feature.layer.id === 'unmapped-ring') {
      setHover({
        lon: e.lngLat.lng,
        lat: e.lngLat.lat,
        title: `#${p.rank} ${p.label}`,
        sub: `${p.assessment} · coverage ${p.coverage}`,
        readings: [kelvin(Number(p.tHot)), `${p.persistence} d persistent`],
      })
      return
    }
    setHover({
      lon: e.lngLat.lng,
      lat: e.lngLat.lat,
      title: String(p.name ?? p.siteName ?? 'Site'),
      sub: `${p.classLabel ?? p.title ?? ''} · ${p.state ?? ''}`,
      readings: [kelvin(Number(p.tHot) || null), megawatt(Number(p.frpMean) || null), `${p.persistence ?? 0} d`],
    })
  }

  const interactive = [
    shows('sites') ? 'sites-circle' : null,
    shows('unmapped') ? 'unmapped-ring' : null,
    shows('alerts') ? 'alerts-circle' : null,
  ].filter((v): v is string => v !== null)

  const overlay = controls === 'overlay'
  const ASPECT = { square: 'aspect-square', landscape: 'aspect-[4/3]', tall: 'aspect-[3/4]' }

  return (
    <div className={cn('flex min-h-0 flex-col gap-2', className)}>
      <div
        className={cn(
          'relative overflow-hidden rounded-[14px]',
          // With the controls below, the canvas takes its height from its own width so it
          // never ends up as a letterbox strip inside a narrow column.
          overlay ? 'h-full min-h-0 flex-1' : cn('w-full max-h-[600px] min-h-[320px]', ASPECT[aspect]),
        )}
      >
      <Map
        ref={mapRef}
        initialViewState={{ longitude: role.mapFocus[0], latitude: role.mapFocus[1], zoom: role.mapFocus[2] }}
        mapStyle={mapStyle}
        maxBounds={INDIA_BOUNDS}
        minZoom={3.2}
        maxZoom={14}
        interactiveLayerIds={interactive}
        onClick={onClick}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
        onError={(e) => {
          const sourceId = (e as unknown as { sourceId?: string }).sourceId
          if (sourceId === 'imagery') {
            setTilesFailed(true)
            setBasemap('offline')
            logLine('WARN', 'Satellite tiles unavailable — fell back to the offline basemap')
          }
        }}
        onLoad={fitToSites}
        cursor={hover ? 'pointer' : 'grab'}
        attributionControl={{ compact: true }}
        style={{ width: '100%', height: '100%' }}
      >
        {statesGeo && (
          <Source id="states" type="geojson" data={statesGeo}>
            <Layer
              id="state-fill"
              type="fill"
              paint={{ 'fill-color': BOUNDARY_PAINT[basemap].fill, 'fill-outline-color': 'rgba(0,0,0,0)' }}
            />
            <Layer
              id="state-line"
              type="line"
              paint={{
                'line-color': BOUNDARY_PAINT[basemap].state,
                'line-width': ['interpolate', ['linear'], ['zoom'], 3, 0.5, 8, 1.1],
              }}
            />
          </Source>
        )}

        {districtsGeo && shows('districts') && (
          <Source id="districts" type="geojson" data={districtsGeo}>
            <Layer
              id="district-line"
              type="line"
              minzoom={5}
              paint={{ 'line-color': BOUNDARY_PAINT[basemap].district, 'line-width': 0.45 }}
            />
          </Source>
        )}

        {shows('landcover') && (
          <Source id="landcover" type="geojson" data={landcoverData}>
            <Layer id="landcover-circle" {...landcoverLayer} />
          </Source>
        )}

        {shows('thermal') && (
          <Source id="detections" type="geojson" data={heatData}>
            <Layer id="thermal-heat" {...heatLayer} filter={['<=', ['get', 'ageDays'], days]} />
          </Source>
        )}

        {aoi && shows('boundary') && (
          <Source id="aoi" type="geojson" data={aoi}>
            <Layer id="aoi-line" {...aoiLayer} />
          </Source>
        )}

        {shows('sites') && (
          <Source id="sites" type="geojson" data={siteData}>
            <Layer id="sites-circle" {...siteLayer} filter={['<=', ['get', 'ageDays'], days]} />
            <Layer id="sites-abnormal" {...abnormalRingLayer} />
          </Source>
        )}

        {shows('unmapped') && (
          <Source id="unmapped" type="geojson" data={unmappedData}>
            <Layer id="unmapped-ring" {...unmappedLayer} filter={['<=', ['get', 'ageDays'], days]} />
          </Source>
        )}

        {shows('alerts') && (
          <Source id="alerts" type="geojson" data={alertData}>
            <Layer id="alerts-circle" {...alertLayer} />
          </Source>
        )}

        <NavigationControl position="bottom-right" showCompass={false} />
        <ScaleControl position="bottom-right" maxWidth={90} unit="metric" />

        {hover && (
          <Popup longitude={hover.lon} latitude={hover.lat} closeButton={false} closeOnClick={false} offset={14}>
            <div className="bg-card border-line min-w-[190px] rounded-[10px] border px-3 py-2">
              <p className="text-[12.5px] font-semibold">{hover.title}</p>
              <p className="text-ink-soft text-[11.5px]">{hover.sub}</p>
              <p className="text-ink-faint tnum mt-1 font-mono text-[10.5px]">{hover.readings.join(' · ')}</p>
            </div>
          </Popup>
        )}
      </Map>

      {overlay && (
        <div className="pointer-events-none absolute inset-0 p-3">
          <div className="pointer-events-auto absolute top-3 left-3">
            <BasemapToggle />
          </div>
          <div className="pointer-events-auto absolute top-3 right-3 w-[188px]">
            <LayerPanel available={availableLayers} />
          </div>
          <div className="pointer-events-auto absolute bottom-3 left-3 flex flex-col gap-2">
            <ThermalLegend />
            <TimeWindowPicker />
          </div>
        </div>
      )}
      </div>

      {!overlay && (
        <div className="bg-card border-line flex flex-col gap-2 rounded-[12px] border px-3 py-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <BasemapToggle />
            <ThermalLegend variant="inline" />
          </div>
          <LayerPanel available={availableLayers} variant="chips" />
          <TimeWindowPicker className="self-start" />
        </div>
      )}
    </div>
  )
}
