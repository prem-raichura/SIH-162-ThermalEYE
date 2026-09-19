/**
 * Section 32 — the non-claims list, carried in full.
 *
 * NRSC republishes the site layer, so the caveats have to travel with the data rather than
 * living in a design document. Nothing here is decoration: each line is a statement the
 * product must never make.
 */
export const NON_CLAIMS: string[] = [
  'FIRMS itself identifies industrial fires.',
  'Sentinel-1 detects heat.',
  'OSM always contains the correct industry.',
  'Every thermal anomaly is a fire.',
  'Every industrial fire is captured.',
  'Every explosion is captured.',
  'Sentinel-1/2 is always available at event time.',
  'A nearby facility proves causality.',
  'Every gas leak is detectable from thermal satellite data.',
  'The retrieved subpixel temperature and source area are exact measurements. They are two-band estimates carrying uncertainty, and they are undefined for sensor-saturated pixels.',
  'The system has zero latency.',
  'OSM-derived labels are independent ground truth.',
  'OSM or any facility register is complete. Coverage is uneven by region and by facility class, and absence of a mapped facility is not evidence that no facility exists.',
]

/** The wording section 32 asks for in place of the claims above. */
export const PREFERRED_WORDING =
  'The system estimates the likely source and abnormality of a satellite-observed thermal event using multimodal thermal, temporal, optical, SAR, land-cover and geographic evidence.'
