import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Map, {
  AttributionControl,
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
  incidentClusterLayer,
  incidentIconLayer,
  landcoverLayer,
  siteLayer,
  unmappedLayer,
} from './layers'
import { ensureIncidentIcons } from './incidentIcons'
import { BasemapToggle } from './BasemapToggle'
import { LayerPanel } from './LayerPanel'
import { LoadingOverlay } from '@/components/shell/Loader'
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
import type { Alert, Detection, ThermalSite, UnmappedCandidate } from '@/lib/types'
import type { FeatureCollection } from 'geojson'
import { useFilters } from '@/store/useFilters'
import { useLayers, type LayerId } from '@/store/useLayers'
import { logLine } from '@/store/useConsole'
import type { Role } from '@/lib/roles'
import { cn } from '@/lib/utils'
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery'
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
  alerts,
  alertMode = 'points',
  onAlertSelect,
  availableLayers,
  controls = true,
  chrome,
  controlPosition = 'bottom-right',
  panelSide = 'right',
  shape = 'fill',
  tableHint = 'The site table below lists every one of them.',
  className,
}: {
  role: Role
  sites: ThermalSite[]
  unmapped?: UnmappedCandidate[]
  /** Defaults to the alerts belonging to the sites in view. */
  alerts?: Alert[]
  /** 'incidents' draws severity triangles that cluster at low zoom, for the response view. */
  alertMode?: 'points' | 'incidents'
  onAlertSelect?: (alert: Alert) => void
  availableLayers?: LayerId[]
  /** Off for thumbnails: the basemap toggle, layer panel, legend and window picker are hidden. */
  controls?: boolean
  /**
   * Which pieces of built-in chrome the map paints. Everything is on by default; a host that
   * re-homes a control into its own bar switches just that one off. `controls={false}` still
   * wins over all of them.
   */
  chrome?: Partial<Record<'basemap' | 'layers' | 'window' | 'legend', boolean>>
  /**
   * Which bottom corner the map's own zoom, scale bar and attribution sit in. A console puts
   * its panels down the right-hand side, so there it moves them out from under them.
   */
  controlPosition?: 'bottom-right' | 'bottom-left'
  /**
   * Which side the basemap toggle and layer switcher sit on. A console fills the right-hand
   * side with its own panels, so there the map's chrome gathers on the left instead of
   * expanding into them.
   */
  panelSide?: 'left' | 'right'
  /** 'square' sizes the canvas from its own width, for maps in a narrow column. */
  shape?: 'fill' | 'square'
  /**
   * How the screen reader is told to reach the same rows as text. The default assumes a table
   * directly below; a console that keeps its table in a drawer says so instead.
   */
  tableHint?: string
  className?: string
}) {
  const mapRef = useRef<MapRef>(null)
  const [detections, setDetections] = useState<Detection[]>([])
  const [statesGeo, setStatesGeo] = useState<FeatureCollection | null>(null)
  const [districtsGeo, setDistrictsGeo] = useState<FeatureCollection | null>(null)
  const [hover, setHover] = useState<HoverInfo | null>(null)
  /** Covers the first fetch of the layers the map cannot draw without. */
  const [layersPending, setLayersPending] = useState(true)
  const [districtsPending, setDistrictsPending] = useState(false)
  const reducedMotion = usePrefersReducedMotion()

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

  const paints = (id: 'basemap' | 'layers' | 'window' | 'legend') => controls && chrome?.[id] !== false

  useEffect(() => {
    // Both are needed before the map says anything true, so the overlay lifts when the pair
    // settles rather than when the first one does.
    Promise.allSettled([
      loadDetections()
        .then(setDetections)
        .catch((e) => {
          logLine('ERROR', 'Detection layer could not be loaded')
          throw e
        }),
      loadStates()
        .then(setStatesGeo)
        .catch((e) => {
          logLine('ERROR', 'State boundaries could not be loaded')
          throw e
        }),
    ]).then(() => setLayersPending(false))
  }, [])

  // Districts are 1.1 MB, so they only load the first time the layer is switched on.
  useEffect(() => {
    if (!visible.districts || districtsGeo) return
    setDistrictsPending(true)
    loadDistricts()
      .then(setDistrictsGeo)
      .catch(() => logLine('ERROR', 'District boundaries could not be loaded'))
      .finally(() => setDistrictsPending(false))
  }, [visible.districts, districtsGeo])

  const days = WINDOW_DAYS[window]
  const siteIds = useMemo(() => new Set(sites.map((s) => s.id)), [sites])

  const heatData = useMemo(
    () => detectionsToGeoJson(detections.filter((d) => d.siteId === null || siteIds.has(d.siteId))),
    [detections, siteIds],
  )
  const siteData = useMemo(() => sitesToGeoJson(sites), [sites])
  const unmappedData = useMemo(() => unmappedToGeoJson(unmapped), [unmapped])
  const alertRows = useMemo(
    () => alerts ?? allAlerts.filter((a) => siteIds.has(a.siteId)),
    [alerts, siteIds],
  )
  const alertData = useMemo(() => alertsToGeoJson(alertRows), [alertRows])

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
    mapRef.current.easeTo({
      center: [target.lon, target.lat],
      zoom: Math.max(mapRef.current.getZoom(), 8.5),
      duration: reducedMotion ? 0 : 900,
    })
  }, [selected, selectedUnmapped, reducedMotion])

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
    if (feature.layer.id === 'alerts-cluster') {
      mapRef.current?.easeTo({
        center: [e.lngLat.lng, e.lngLat.lat],
        zoom: (mapRef.current?.getZoom() ?? 4) + 2,
        duration: reducedMotion ? 0 : 600,
      })
      return
    }
    if (feature.layer.id === 'alerts-circle' || feature.layer.id === 'alerts-icon') {
      const alert = alertRows.find((a) => a.id === String(props.id))
      if (alert && onAlertSelect) onAlertSelect(alert)
      else selectSite(props.siteId)
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
    if (feature.layer.id === 'alerts-cluster') {
      setHover({
        lon: e.lngLat.lng,
        lat: e.lngLat.lat,
        title: `${p.point_count} incidents`,
        sub: 'Zoom in to separate them',
        readings: ['clustered below zoom 7'],
      })
      return
    }
    if (feature.layer.id === 'alerts-icon') {
      setHover({
        lon: e.lngLat.lng,
        lat: e.lngLat.lat,
        title: String(p.title ?? 'Incident'),
        sub: `${p.siteName ?? ''} · ${p.severity ?? ''} severity`,
        readings: [`+${p.deviationPct ?? 0}% over normal`],
      })
      return
    }
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

  const incidents = alertMode === 'incidents'
  // In incident mode the alerts are the point of the map, so they are not behind a toggle.
  const showAlerts = incidents || shows('alerts')

  const interactive = [
    shows('sites') ? 'sites-circle' : null,
    shows('unmapped') ? 'unmapped-ring' : null,
    showAlerts && !incidents ? 'alerts-circle' : null,
    showAlerts && incidents ? 'alerts-icon' : null,
    showAlerts && incidents ? 'alerts-cluster' : null,
  ].filter((v): v is string => v !== null)

  return (
    <section
      aria-label={`${role.short} thermal map — ${sites.length} sites in view. ${tableHint}`}
      className={cn(
        'relative overflow-hidden rounded-[14px]',
        // A square canvas takes its height from its own width, so a map in a narrow column
        // never ends up as a letterbox strip.
        // A square canvas below the compact breakpoint would be taller than the viewport,
        // so it becomes a fixed-height band like every other map there.
        shape === 'square'
          ? 'h-[420px] w-full xl:aspect-square xl:h-auto xl:max-h-[620px] xl:min-h-[340px]'
          : 'h-full',
        className,
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
        onLoad={(e) => {
          if (incidents) ensureIncidentIcons(e.target)
          fitToSites()
        }}
        onStyleData={(e) => {
          // Switching the basemap reloads the style, which drops every registered image.
          if (incidents) ensureIncidentIcons(e.target)
        }}
        cursor={hover ? 'pointer' : 'grab'}
        // Rendered as its own control below, so it can follow `controlPosition` too.
        attributionControl={false}
        // Absolute rather than height:100%. Where the wrapper takes its height from a
        // min-height inside an auto-height flex column, a percentage height has nothing
        // definite to resolve against and collapses the canvas to zero.
        style={{ position: 'absolute', inset: 0 }}
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

        {showAlerts &&
          (incidents ? (
            <Source id="alerts" type="geojson" data={alertData} cluster clusterRadius={46} clusterMaxZoom={6}>
              <Layer id="alerts-cluster" {...incidentClusterLayer} />
              <Layer id="alerts-icon" {...incidentIconLayer} />
            </Source>
          ) : (
            <Source id="alerts" type="geojson" data={alertData}>
              <Layer id="alerts-circle" {...alertLayer} />
            </Source>
          ))}

        {controls && <NavigationControl position={controlPosition} showCompass={false} />}
        <ScaleControl position={controlPosition} maxWidth={90} unit="metric" />
        <AttributionControl position={controlPosition} compact />

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

      {layersPending && <LoadingOverlay label="Loading map layers" className="z-40" />}

      {controls && (
        <div className="pointer-events-none absolute inset-0 p-3">
          {/* On a console both controls stack in one left-hand column: the layer switcher
              grows downwards when it opens, and on the right it would open straight into the
              dock column. Everywhere else they keep a corner each. */}
          {panelSide === 'left' ? (
            <div className="pointer-events-auto absolute top-3 left-3 flex w-[190px] flex-col items-start gap-2">
              {paints('basemap') && <BasemapToggle />}
              {paints('layers') && <LayerPanel available={availableLayers} busy={districtsPending} />}
            </div>
          ) : (
            <>
              {paints('basemap') && (
                <div className="pointer-events-auto absolute top-3 left-3">
                  <BasemapToggle />
                </div>
              )}
              {paints('layers') && (
                <div className="pointer-events-auto absolute top-3 right-3 w-[190px]">
                  <LayerPanel available={availableLayers} busy={districtsPending} />
                </div>
              )}
            </>
          )}
          {/* One row of chrome along the bottom: the window first, the scale that reads it
              next to it, wrapping only when the map is too narrow to hold both. */}
          {(paints('window') || paints('legend')) && (
            <div className="pointer-events-auto absolute bottom-10 left-3 flex max-w-[calc(100%-7.5rem)] flex-wrap items-center gap-2">
              {paints('window') && <TimeWindowPicker />}
              {paints('legend') && <ThermalLegend />}
            </div>
          )}
        </div>
      )}
    </section>
  )
}