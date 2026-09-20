/**
 * A clock time for records that only carry a date.
 *
 * FIRMS ships an acquisition date and a day/night flag per detection, not a timestamp, so
 * nothing in the dataset can answer "which hour". This module derives one so the hour filters
 * have something to bite on. It is **simulation for the demo, not measurement** — the source
 * files under `src/data` and `public/data` are never modified, and nothing here is presented
 * as a retrieved value.
 *
 * Two things keep it honest rather than arbitrary:
 *  - it is deterministic, hashed from the record id, so a site sits at the same hour on every
 *    render and every reload;
 *  - it obeys the one real time signal present. A detection flagged `D` lands in daylight and
 *    one flagged `N` lands after dark, so the derived hour never contradicts the data.
 */

/** FNV-1a. Small, fast, and stable across reloads — the point is repeatability, not crypto. */
function hash(id: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0) / 0xffffffff
}

/** Daylight runs 06:00–18:00; everything else is the night half. */
const DAY_START = 6
const DAY_HOURS = 12

/**
 * Hour of the acquisition day, 0–24.
 *
 * `night` constrains which half of the clock the record lands in, and is only passed for
 * detections, which carry a real `daynight` flag that the derived hour must not contradict.
 *
 * Sites and candidates pass nothing. They are places rather than single observations — their
 * `lastDetection` is a date with no flag attached, and `nightRatio` is a proportion across
 * many passes, not a statement about the last one — so their hour spreads over the whole day.
 * That also keeps the short windows populated, which a half-day band would not.
 */
export function acqHour(id: string, night?: boolean): number {
  const t = hash(id)
  if (night === undefined) return t * 24
  return night ? (DAY_START + DAY_HOURS + t * DAY_HOURS) % 24 : DAY_START + t * DAY_HOURS
}

/**
 * Age in fractional days, counting the derived hour.
 *
 * The map layers and the table filters both compare against a day count, so hours arrive here
 * as fractions of one — three hours is 0.125 days. `DATA_NOW` is midnight ending the dataset's
 * last day, which makes the most recent record roughly zero days old.
 */
export function ageInDays(iso: string | null, now: Date, id: string, night?: boolean): number {
  if (iso === null) return 99999
  const midnight = new Date(`${iso}T00:00:00Z`).getTime()
  const at = midnight + acqHour(id, night) * 3600000
  return (now.getTime() - at) / 86400000
}
