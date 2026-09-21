<div align="center">

<img src="client/public/thermaleye.png" alt="ThermalEye" width="150" />

# ThermalEye: Thermal Event & Industrial Intelligence Engine

### **SEE. UNDERSTAND. ACT.**

**Industrial fire and thermal source detection from NASA FIRMS, Sentinel-1/2, OSM and WorldCover.**

`SIH26162` · Eight role-based GIS dashboards over six years of satellite thermal observations

![React 19](https://img.shields.io/badge/React-19-61dafb)
![TypeScript strict](https://img.shields.io/badge/TypeScript-strict-3178c6)
![MapLibre GL v5](https://img.shields.io/badge/MapLibre-GL_v5-295dff)
![Vite 8](https://img.shields.io/badge/Vite-8-646cff)
![Works offline](https://img.shields.io/badge/works-offline-2e5d4f)

</div>

---

> **Something is hot. The question is what, and whether that is normal.**
>
> ThermalEye groups six years of NASA FIRMS detections into **thermal sites**, retrieves source
> temperature and size from the **dual-band signal**, classifies the likely source, and compares
> today against **each site's own history**. Facility maps are context, not the answer.

<div align="center">

| FIRMS detections | Thermal sites | Unmapped candidates |
|:---:|:---:|:---:|
| **9,275,873** | **984** | **120** |

</div>

This repository is the **dashboard**. No backend, no database, no training code — everything runs
in the browser over a static, fixed-seed dataset.

---

## Quick start

```bash
cd client
npm install
npm run dev          # http://localhost:5173
```

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Type-check (`tsc -b`) and bundle |
| `npm run preview` | Serve the production build |
| `npm run lint` | oxlint |
| `node scripts/build-static-data.mjs` | Regenerate every JSON from `../../dataset` |

The generator is seeded at `0x5EED162` — run it twice and you get byte-identical files, so the
demo is the same on every machine and in every run.

> **🔌 Offline-first.** Satellite imagery is the one thing that needs a connection. Fonts,
> boundaries and every data file are served from this origin. Pull the network and the tiles
> fail, the map falls back to the offline GADM basemap **and says so** — in the operator console
> and on a chip beside the toggle. Every layer, chart, table and export keeps working.

---

## 🧭 The experience

```
  Log in   ──►  your organisation's console  ──►  drill into records
   │               │                                    │
   │               │                                    └─ tables, charts, evidence reports
   │               └─ full-bleed map, floating docks, live filters
   └─ headline numbers + the address that decides the view
```

### The landing page

Half **statement of the problem** — the four numbers that frame it — and half login card. The
address is the session: `cpcb@thermaleye.in` opens the CPCB console, `ndma@thermaleye.in` the NDMA
one, and so on for all eight organisations. The password is shared across the demo accounts, and
the signed-in role is pinned — a CPCB session cannot open `/admin` by editing the URL.

> *Demo build. Credentials are a view gate, not real authentication, and every figure is pre-computed from the collected dataset.*

### Every role opens on a map console

The landing page of each role is a **full-bleed GIS console**: the map fills the entire content
area, and everything else floats over it in panels that fold away.

```
┌─ Industrial thermal sites   SITES 25 · UNMAPPED 120 · HIGH PRIORITY 55 ──── Site list ─ Report ─┐
│ ┌──────────┐                                                ┌──────────────────────────────┐   │
│ │ Satellite│                                                │ Selected site            ▾   │   │
│ │  Layers ▾│                 M A P                          ├──────────────────────────────┤   │
│ └──────────┘          (fills the whole area)                │ Top unmapped sources  120 ▾  │   │
│                                                             │  1 Telangana      1207 K     │   │
│  ⊕ ⊖   200 km   © Esri                                      │    620 d persistent   0.24   │   │
└─────────────────────────────────────────────────────────────┴──────────────────────────────┘   │
```

- **Left** — the map's own chrome: basemap toggle, layer switcher
- **Right** — data docks: what's selected, what's ranked; each collapsible and remembered
- **Bar** — title, three live readings, time filter, thermal legend, a route to the full records

---

## 👥 The eight roles

### 🍃 CPCB — Central Pollution Control Board
*Industrial compliance · Unmapped polluting sources · National overview*

Tracks industrial thermal sites and finds polluting sources **no register lists**.

| Page | What it shows |
|---|---|
| **Overview** | National map of persistent industrial heat; selected-site card; top unmapped sources ranked by persistence × temperature |
| **Industrial Sites** | Every refinery, chemical, steel, cement, kiln and other industrial source — T_hot, ΔT, FRP density, night ratio, detections, persistence, status |
| **Unmapped Sources** | 120 candidates with no facility within 1 km, each with an assessment (industrial-like / agricultural-like / natural-like) and a **coverage-quality** score |
| **Coverage Audit** | How much of the industrial map actually exists: 202,237 raw OSM rows → 121,280 unique → **19,475 usable**. Coverage by facility class, OSM alone vs merged registers |
| **Reports** | Per-site evidence report — why it was classified that way, and which reasoning came from the map rather than the physics |
| **Settings** | Units (K/°C), default time window, coverage-quality floor, default map layers |

### 🔥 PPAC — PPAC / MoPNG and PNGRB
*Flaring activity · Refineries and gas infrastructure · Compliance check*

Watches refinery and flare behaviour against **each site's own normal range**.

| Page | What it shows |
|---|---|
| **Overview** | Hydrocarbon map; flaring-alerts dock; active flare sites, abnormal count, refineries tracked |
| **Refineries & Flares** | Night-restricted profile — flares read from the night-only retrieval, where reflected sunlight cannot contaminate the 4 µm channel. Per-site signature check + Sentinel-2 SWIR hot-unit resolution |
| **Gas Infrastructure** | The official PPAC register — 24 refineries, 267.1 MMTPA installed capacity, joined to OSM coordinates, with the **3 uncertain joins flagged for human verification** |
| **Flaring Analysis** | Each facility against its own history — FRP trend and retrieved profile |
| **Alert Monitor** | Unexpected night activity, sustained sensor saturation, source-area growth |
| **Reports** | Evidence reports for hydrocarbon sites |

### ⚡ CEA — Central Electricity Authority
*Thermal power monitoring · Deviation alerts · Operational intelligence*

Monitors thermal power stations and flags deviation from **station baselines**.

| Page | What it shows |
|---|---|
| **Overview** | Station map; deviation-alerts dock; stations, abnormal, under-watch |
| **Power Plants** | WRI and GEM registers — capacity, fuel, owner, fuel mix |
| **Coal Yards** | Sustained heat on a stockpile, flagged against the station's own baseline rather than a national threshold |
| **Baselines** | What each station normally does — the p10–p90 band, the observed line, long-term profile, *why density not raw FRP*, and why the negative controls matter |
| **Alerts** | Unit-level deviation on **scan-normalised intensity**, so a scan-edge pixel is not mistaken for a bigger event |
| **Historical Analysis** | Fleet seasonality, recurrence, and **58 dated commissionings and retirements** that test whether the system reads plants or maps |
| **Reports** | Evidence reports for stations |

### ⛏️ IBM — Indian Bureau of Mines
*Mining activity · Unmapped mines · Persistent fire tracking*

Tracks mine-class thermal persistence and surfaces mines **absent from the directory**.

| Page | What it shows |
|---|---|
| **Overview** | Mine map; unmapped-candidates dock; mine sites, candidates, *burning over a year* |
| **Mining Sites** | How long each source has burned, how often it returns, and what that pattern reads as |
| **Unmapped Candidates** | Persistent heat on mining ground the directory does not list — *the map's gaps are the point, not a defect* |
| **Land Cover Analysis** | What each mine sits on, so bare ground and spoil can be told apart from cropland and forest |
| **Reports** | Evidence reports with SAR corroboration |

### 🌲 FSI — Forest Survey of India
*Forest fire monitoring · Fewer false alarms · Vegetation damage*

Separates vegetation burns from industrial heat so **fire alerts stay clean**.

| Page | What it shows |
|---|---|
| **Overview** | Vegetation-fire map; a collapsible **§7.1 separation scatter** showing industrial heat is separable; industrial detections removed from the feed |
| **All Events** | Every non-industrial event in one list — forest, crop, waste, unclassified |
| **Forest Fires** | Broad, cooler burns over forest cover, with land-cover context and burn corroboration |
| **Crop Burning** | Cropland-dominant events |
| **Alerts** | Vegetation and waste fires only — **industrial sources never reach this stream** |
| **Vegetation Analysis** | ΔNDVI / ΔNBR / ΔNDMI before-and-after, with cloud fraction and acquisition gap travelling alongside every reading, and *how to read a missing scene* |
| **Seasonal Analysis** | When each class actually burns, counted from the detection record — each class **indexed to its own annual total**, so one loud class cannot flatten the rest |
| **Reports** | Evidence reports for fire events |

### 🚨 NDMA — National Disaster Management Authority
*Live alerts · Multi-hazard view · Emergency response*

Consumes the anomaly branch at **response latency** and routes alerts by severity.

| Page | What it shows |
|---|---|
| **Live Alerts** | Incident map with clustered severity markers. Selecting one opens its evidence **and its three actions — Acknowledge / Escalate / Dismiss — right there**. Window: 6 h / 24 h / 72 h / All |
| **Alert Queue** | The backlog as a list, tabbed by disposition (Active / Acknowledged / Escalated / Dismissed), same three verbs on every row |
| **Incident Map** | Every alert in the window, placed and coloured by severity, clustered at low zoom |
| **Severity Settings** | Severity is distance from a site's own normal ceiling. **Move a band and the live list re-bins immediately** — nothing here is decorative. Deviation bands, routing, class inclusion |
| **Analytics** | Severity mix, incidents by source class, age profile, top states |
| **Reports** | Incident evidence reports |

### 🛰️ NRSC — NRSC / Bhuvan, ISRO
*Cross-publication · Provenance · Data quality*

Republishes the site layer, so **every record carries its source and its quality**.

| Page | What it shows |
|---|---|
| **Full Site Layer** | The complete layer — every class, both branches, the non-thermal controls — as a map console with filters in a dock |
| **Site Records** | The same layer as records, with a **column chooser** over ~20 fields |
| **Provenance** | One row per record: the register it joined to, how confident that join was, and what satellite evidence was actually available at the time |
| **Data Quality** | Acquisition availability, SAR/optical usability scores, cloud, temporal gap, the NRT/standard split — **and the full §32 non-claims list** |
| **Export** | Published schema + GeoJSON/CSV of the current selection, **built in this browser** — nothing uploaded, nothing fetched |
| **Reports** | Evidence reports across the whole layer |

### 🔬 Admin — Analyst workbench
*Model performance · Ablations · Validation · Source health*

Internal view of how the model is evaluated and **what data is still missing**.

| Page | What it shows |
|---|---|
| **Model Performance** | Accuracy **89.8%**, macro-F1 **0.902** over 924 sites. Confusion matrix, per-class precision/recall/F1, negative controls, and a plain statement of *what these numbers are* |
| **Ablations** | What each feature block is worth, measured by removing it. **Runs needing data this build does not hold are shown as pending, never as results** |
| **Validation** | What can be checked without labelling anything, and what still waits on human work. Tiers + the A2 temporal natural experiment |
| **Data Sources** | What is in hand, what needs a manual step, what is blocked — *why Sentinel is the one that hurts* |
| **Geographic Holdout** | The split is **regional, not random** — a choropleth of training regions against the held-out South, with per-region accuracy |
| **System** | Delivery milestones, shipped data contents, build provenance |

> ### 🎯 Look at this first: **Admin → Ablations**
>
> **A0** is raw FIRMS — radiative power, brightness, confidence.
> **A1** is the same detections with the dual-band retrieval added — source temperature, dual-band
> contrast, scan-normalised intensity, retrieved area, saturation, night profile.
>
> The gain is **+19.2% accuracy, +24.4% macro-F1**.
>
> That is the whole argument: the system reads **how hot a source is**, not how often a pixel is flagged.

---

## ✨ Features that run across every role

### 🗺️ The map

| | |
|---|---|
| **Basemaps** | Esri satellite imagery by default; offline GADM vector fallback that engages automatically on tile failure |
| **7 layers** | Thermal (IR) heatmap · Thermal sites · Unmapped candidates · Alerts · Facility boundary (1 km AOI ring) · Land cover · Districts *(1.1 MB, loaded only when switched on)* |
| **Thermal ramp** | Plasma ramp shared by map and charts, switchable between **T_hot (600–1850 K)** and **FRP (0–200 MW)** |
| **Incident mode** | NDMA gets severity triangles that cluster below zoom 7 and expand on click |
| **Interaction** | Hover readouts, click-to-select synced across map ↔ docks ↔ tables, fly-to on selection, one-shot fit-to-role-bounds |

### ⏱️ The time filter

Consoles open on the **most recent acquisition day**, not a year of history.

```
┌──────────────────────┐  ┌────────────┐
│  3h   6h  12h  [24h] │  │ Older…   ▾ │  →  3 days · 7 days · 30 days · 1 year · All 6 years
└──────────────────────┘  └────────────┘
```

> **On the hour windows:** FIRMS ships an acquisition **date** and a day/night flag — never a
> clock time. The hour is therefore **derived, not measured**: deterministic per record so it
> never jumps between renders, and always on the correct side of dusk so it cannot contradict the
> real `daynight` flag. The app says so itself, in Settings → About this build.

### 🖥️ The operator console

A bottom-docked log where **every interaction writes a line** — selections, filter changes, layer
toggles, dispositions, report generation, and every data failure. Draggable, collapsible,
filterable by tag, exportable to `.log`. It is what makes a static dataset read as a live system.

### ⌨️ Command palette — `⌘K`

Jump to any site, any coordinate, or any section across every role.

### 🌓 Theme

Full light/dark with a token-driven palette. Every accent, ramp, chart colour and map boundary
stroke is defined in both. The console keeps its own dark palette and its own focus-ring colour,
so rings stay visible against near-black.

### ⏳ Loading — and failing — honestly

Every asynchronous surface has a **ThermalEye loader**: the mark stays still and a ring sweeps
around it *(the mark is three concentric circles — rotating it would show no motion at all)*.

- **Boot** — inline in `index.html`, painting before any JavaScript parses
- **Route changes** — pages are code-split, so the loader covers a real chunk download
- **Map** — an overlay while detections and boundaries arrive
- **Panels** — a box the size of the chart it stands in for, so nothing jumps

**And every one of them can fail.** A failed fetch states what is missing and offers a **Try
again** that actually works — the promise cache evicts rejections, so a retry refetches rather
than replaying the same failure. No spinner in this app can hang forever.

### 📄 Evidence reports

Any site, any role → a printable report separating **model evidence** (thermal physics, temporal
behaviour) from **contextual evidence** (what the maps say), because a nearby facility is context,
never proof.

---

## 🔍 What is measured and what is a stand-in

This is the honest part, and it is **also on screen** — NRSC → Data Quality carries the full
non-claims list, and Admin → Model Performance labels which figures are computed.

| On screen | Where it comes from |
|---|---|
| Facility names, operators, coordinates | `dataset/` registers — PPAC, WRI, GEM, CEA, OSM |
| Capacities, fuels, commissioning years | The same registers |
| State and district boundaries | GADM level 1 and level 2 |
| OSM coverage audit — 19,475 usable from 121,280 unique | Measured from the India PBF extraction |
| FIRMS holding — 9,275,873 detections, 2020-01-01 → 2026-01-01, four satellites | Measured; the NRT/standard split is real |
| Validation tier counts — 207 / 108 / 300 | The three validation CSVs |
| GEM dated transitions — 58 plants | The coal transition register |
| Confusion matrix, accuracy, per-class P/R/F1 | **Computed** from each site's true and predicted class |
| Geographic-holdout per-region accuracy | **Computed** from the same sites |
| Thermal time series, baselines, deviation | Fixed-seed stand-in for pipeline output |
| Predicted class and confidence | Fixed-seed stand-in for classifier output |
| Alert timings and severities | Fixed-seed stand-in; the "live" FIRMS pass is a 45-second local timer |
| Acquisition **hour** (the 3h/6h/12h windows) | **Derived at runtime** — FIRMS ships no clock time. Never written to the dataset |
| ROC-AUC and PR-AUC | Reported evaluation design; this build stores no decision scores |
| Ablation runs C–F | **Not run.** Shown as pending on Copernicus credentials, never as results |

Nothing in the first group was invented. Nothing in the second group is presented as a
measurement — **where a number is a stand-in, the page says so**.

---

## 🚫 Non-claims 

The system does **not** claim that:

- FIRMS itself identifies industrial fires
- Sentinel-1 detects heat
- OSM always contains the correct industry
- Every thermal anomaly is a fire
- Every industrial fire is captured
- Every explosion is captured
- Sentinel-1/2 is always available at event time
- A nearby facility proves causality
- Every gas leak is detectable from thermal satellite data
- The retrieved subpixel temperature and source area are exact measurements — they are two-band
  estimates carrying uncertainty, and they are **undefined for sensor-saturated pixels**
- The system has zero latency
- OSM-derived labels are independent ground truth
- OSM or any facility register is complete — coverage is uneven by region and by facility class,
  and **absence of a mapped facility is not evidence that no facility exists**

**Preferred wording:**

> The system estimates the likely source and abnormality of a satellite-observed thermal event
> using multimodal thermal, temporal, optical, SAR, land-cover and geographic evidence.

---

## ♿ Accessibility

- Visible focus rings on **every** control, in both themes and on the dark console
- A skip link to the main region
- `prefers-reduced-motion` removes map easing, plays the console boot instantly, and drops the
  route-transition hold to zero
- Charts that carry a claim are labelled and ship the numbers behind them **in a real table**
- Every loader is a `role="status"` live region carrying **real text**, because a frozen spinner
  under reduced motion says nothing
- Every map names the page where the same records are available as text, so the map is never the
  only path to a record

---

## 🏗️ Stack and architecture

**Vite 8** · **React 19** · **TypeScript 6 (strict)** · **Tailwind v4** · shadcn/ui on Radix ·
**MapLibre GL v5** with react-map-gl 8 · **Recharts 3** · **Zustand 5** · React Router 7 · oxlint

```
client/
├── src/
│   ├── components/
│   │   ├── shell/     AppShell, Rail, TopBar, CommandPalette, Brand, loaders
│   │   ├── map/       ThermalMap, MapConsole, MapDock, layer/legend/window chrome
│   │   ├── console/   the operator log
│   │   ├── panels/    24 reusable panels — tables, charts, evidence, cards
│   │   └── ui/        17 shadcn primitives
│   ├── data/          bundled JSON — sites, alerts, coverage, model, validation, sources
│   ├── lib/           data access, types, plasma ramp, chart tokens, export schema
│   ├── routes/        one folder per role, each with a use<Role>Data hook
│   └── store/         zustand — filters, layers, console, settings, per-role state
├── public/
│   ├── data/          fetched on demand — detections, timeseries, SHAP, spectral, SAR
│   ├── geo/           GADM states and districts
│   └── fonts/         four self-hosted typefaces, so offline looks identical
└── scripts/
    └── build-static-data.mjs   the fixed-seed generator
```

---

<div align="center">

**From signals to safer tomorrows.**

</div>
