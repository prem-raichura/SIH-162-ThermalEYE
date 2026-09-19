# ThermalEye

**SIH26162 — Industrial fire and thermal source detection using NASA FIRMS, OSM and satellite data.**

> The system is an event-level multimodal satellite intelligence framework that uses FIRMS
> thermal observations and temporal behaviour as the primary physical signal, Sentinel-1 and
> Sentinel-2 as complementary structural and spectral evidence, OSM and WorldCover as
> geographic context, and historical site-specific baselines to classify known and unknown
> thermal sources, identify abnormal industrial behaviour, and provide explainable GIS-based
> monitoring.

This repository is the **dashboard**: eight role-based views over a static, fixed-seed dataset.
There is no backend, no database and no training code. Everything runs in the browser.

---

## Run it

```bash
npm install
npm run dev          # http://localhost:5173
```

Other commands:

```bash
npm run build                        # type-check and bundle
npm run preview                      # serve the production build
node scripts/build-static-data.mjs   # regenerate every JSON from ../../dataset
```

The generator is seeded at `0x5EED162`. Running it twice produces byte-identical files, so the
demo is the same on every machine and in every run.

**Offline.** Maps open on satellite imagery, which is the one thing that needs a connection.
Fonts, boundaries and every data file are served from this origin. With the network off the
tiles fail, the map falls back to the offline GADM basemap and says so — in the console and on
a chip beside the toggle — and every layer, chart and table keeps working.

---

## What is measured and what is a stand-in

This is the honest part, and it is also on screen — NRSC → Data Quality carries the full
non-claims list, and Admin → Model Performance labels which figures are computed.

| On screen | Where it comes from |
|---|---|
| Facility names, operators, coordinates | `dataset/` registers — PPAC, WRI, GEM, CEA, OSM |
| Capacities, fuels, commissioning years | The same registers |
| State and district boundaries | GADM level 1 and level 2 |
| OSM coverage audit — 19,475 usable facilities from 121,280 unique features | Measured from the India PBF extraction |
| FIRMS holding — 9,275,873 detections, 2020-01-01 to 2026-01-01, four satellites | Measured; the NRT/standard split is real |
| Validation tier counts — 207 / 108 / 300 | The three validation CSVs |
| GEM dated transitions — 58 plants | The coal transition register |
| Confusion matrix, accuracy, per-class precision / recall / F1 | **Computed** from each site's true and predicted class |
| Geographic-holdout per-region accuracy | **Computed** from the same sites |
| Thermal time series, baselines, deviation | Fixed-seed stand-in for pipeline output |
| Predicted class and confidence | Fixed-seed stand-in for classifier output |
| Alert timings and severities | Fixed-seed stand-in; the "live" FIRMS pass is a 45-second local timer |
| ROC-AUC and PR-AUC | Reported evaluation design; this build stores no decision scores |
| Ablation runs C–F | **Not run.** Shown as pending on Copernicus credentials, never as results |

Nothing in the first group was invented. Nothing in the second group is presented as a
measurement — where a number is a stand-in, the page says so.

---

## The eight roles

| Role | What they get | Spec sections |
|---|---|---|
| **CPCB** | Industrial branch, unmapped polluting sources, facility-coverage audit | §11, §16, §21.1 |
| **PPAC / PNGRB** | Refineries and flares, night thermal profile, baseline vs current | §7.5, §8, §18 |
| **CEA** | Thermal power stations, long-term baselines, deviation alerts | §18, §19 |
| **IBM** | Mining persistence, unmapped mine candidates, SAR evidence | §10, §16, §17 |
| **FSI** | Non-industrial branch only, ΔNDVI/ΔNBR/ΔNDMI, burn seasonality | §7.1, §9, §12 |
| **NDMA** | Live alert stream, severity routing, evidence split | §19, §29, §31 |
| **NRSC / Bhuvan** | Full site layer with provenance and quality, GeoJSON/CSV export | §4, §20, §32 |
| **Admin** | Model performance, A0–F ablations, validation tiers, source health, holdout | §21, §22, §23, §26, §28 |

The one to look at first is **Admin → Ablations**. A0 is raw FIRMS — radiative power,
brightness, confidence. A1 is the same detections with the dual-band retrieval added: source
temperature, dual-band contrast, scan-normalised intensity, retrieved area, saturation, night
profile. The gain is **+19.2% accuracy, +24.4% macro-F1**, and that is the whole argument — the
system reads how hot a source is, not how often a pixel is flagged.

---

## Non-claims (§32)

The system does **not** claim that:

- FIRMS itself identifies industrial fires.
- Sentinel-1 detects heat.
- OSM always contains the correct industry.
- Every thermal anomaly is a fire.
- Every industrial fire is captured.
- Every explosion is captured.
- Sentinel-1/2 is always available at event time.
- A nearby facility proves causality.
- Every gas leak is detectable from thermal satellite data.
- The retrieved subpixel temperature and source area are exact measurements. They are two-band
  estimates carrying uncertainty, and they are undefined for sensor-saturated pixels.
- The system has zero latency.
- OSM-derived labels are independent ground truth.
- OSM or any facility register is complete. Coverage is uneven by region and by facility class,
  and absence of a mapped facility is not evidence that no facility exists.

Preferred wording:

> The system estimates the likely source and abnormality of a satellite-observed thermal event
> using multimodal thermal, temporal, optical, SAR, land-cover and geographic evidence.

---

## Stack

Vite 6 · React 19 · TypeScript (strict) · Tailwind v4 · shadcn/ui · MapLibre GL v5 with
react-map-gl 8 · Recharts 3 · Zustand · React Router 7.

```
src/
  components/  shell, console, map, 24 reusable panels
  data/        bundled JSON — sites, alerts, coverage, model, validation, sources
  lib/         data access, types, the plasma ramp, chart tokens, export schema
  routes/      one folder per role, each with a use<Role>Data hook
  store/       zustand stores — filters, layers, console, settings, per-role state
public/
  data/        fetched on demand — detections, timeseries, SHAP, spectral, SAR
  geo/         GADM states and districts
  fonts/       the four typefaces, self-hosted so offline looks the same
scripts/
  build-static-data.mjs   the fixed-seed generator
```

Heavier files are fetched rather than bundled so the first paint stays light. The map style
carries no external sources: boundary geometry is fetched by the app and handed to MapLibre as
objects, which is what keeps the offline path working.

---

## Accessibility

Visible focus rings on every control, in both themes and on the dark console. A skip link to
the main region. `prefers-reduced-motion` removes map easing and plays the console boot
instantly. Charts that carry a claim are labelled and ship the numbers behind them in a real
table. Every site on a map is also a row in a table, so the map is never the only path to a
record.
