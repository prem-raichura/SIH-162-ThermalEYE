// Per-class thermal and temporal profiles.
// Ranges are shaped by the physics in section 7 of the context document:
// small very hot sources give a large dual-band delta_T; broad cooler burns give a small one.

export const CLASS_PROFILE = {
  refinery:        { tHot: [1350, 1750], dT: [38, 88], area: [40, 260],     night: [0.52, 0.72], sat: [0.08, 0.42], det: [420, 1900], persist: [600, 2100], frp: [25, 140],  branch: 'industrial' },
  gas_flare:       { tHot: [1450, 1850], dT: [45, 95], area: [15, 120],     night: [0.58, 0.78], sat: [0.12, 0.48], det: [500, 2100], persist: [700, 2150], frp: [18, 95],   branch: 'industrial' },
  lng_gas:         { tHot: [1300, 1700], dT: [35, 80], area: [20, 180],     night: [0.50, 0.70], sat: [0.05, 0.35], det: [220, 1100], persist: [400, 1800], frp: [15, 80],   branch: 'industrial' },
  steel_metal:     { tHot: [1200, 1600], dT: [32, 76], area: [60, 420],     night: [0.44, 0.64], sat: [0.04, 0.30], det: [300, 1500], persist: [500, 2000], frp: [22, 130],  branch: 'industrial' },
  cement:          { tHot: [920, 1300],  dT: [24, 56], area: [110, 820],    night: [0.38, 0.58], sat: [0.00, 0.10], det: [180, 900],  persist: [400, 1900], frp: [14, 85],   branch: 'industrial' },
  brick_kiln:      { tHot: [880, 1240],  dT: [22, 52], area: [140, 900],    night: [0.30, 0.52], sat: [0.00, 0.06], det: [90, 520],   persist: [180, 900],  frp: [8, 48],    branch: 'industrial' },
  chemical:        { tHot: [1050, 1480], dT: [28, 68], area: [50, 380],     night: [0.42, 0.62], sat: [0.02, 0.22], det: [160, 860],  persist: [380, 1800], frp: [16, 96],   branch: 'industrial' },
  power_thermal:   { tHot: [820, 1220],  dT: [20, 48], area: [220, 1500],   night: [0.40, 0.56], sat: [0.00, 0.08], det: [260, 1600], persist: [500, 2100], frp: [20, 120],  branch: 'industrial' },
  mining:          { tHot: [700, 1020],  dT: [14, 40], area: [320, 3000],   night: [0.28, 0.50], sat: [0.00, 0.05], det: [120, 780],  persist: [260, 1700], frp: [10, 70],   branch: 'industrial' },
  industrial_fire: { tHot: [1000, 1500], dT: [26, 70], area: [80, 900],     night: [0.35, 0.60], sat: [0.02, 0.25], det: [20, 180],   persist: [2, 60],     frp: [60, 320],  branch: 'industrial' },
  other_industrial:{ tHot: [780, 1180],  dT: [18, 46], area: [120, 1200],   night: [0.32, 0.54], sat: [0.00, 0.08], det: [80, 620],   persist: [200, 1500], frp: [9, 62],    branch: 'industrial' },
  crop_burning:    { tHot: [600, 820],   dT: [4, 18],  area: [2200, 20000], night: [0.03, 0.14], sat: [0, 0],       det: [30, 260],   persist: [8, 70],     frp: [12, 90],   branch: 'non_industrial' },
  forest_fire:     { tHot: [640, 900],   dT: [7, 25],  area: [3000, 40000], night: [0.14, 0.34], sat: [0, 0.02],    det: [25, 320],   persist: [5, 90],     frp: [18, 160],  branch: 'non_industrial' },
  waste_fire:      { tHot: [600, 860],   dT: [9, 28],  area: [500, 5200],   night: [0.18, 0.42], sat: [0, 0],       det: [40, 420],   persist: [30, 520],   frp: [6, 44],    branch: 'non_industrial' },
  other_unknown:   { tHot: [620, 1000],  dT: [8, 34],  area: [400, 9000],   night: [0.18, 0.48], sat: [0, 0.04],    det: [20, 240],   persist: [10, 400],   frp: [7, 70],    branch: 'non_industrial' },
  nonthermal_control: { tHot: [0, 0], dT: [0, 0], area: [0, 0], night: [0, 0], sat: [0, 0], det: [0, 0], persist: [0, 0], frp: [0, 0], branch: 'control' },
}

export const CLASS_LABEL = {
  refinery: 'Refinery',
  gas_flare: 'Gas Flare',
  lng_gas: 'LNG / Gas',
  steel_metal: 'Steel / Metal',
  cement: 'Cement',
  brick_kiln: 'Brick Kiln',
  chemical: 'Chemical',
  power_thermal: 'Power Plant',
  mining: 'Mining',
  industrial_fire: 'Industrial Fire',
  other_industrial: 'Other Industrial',
  crop_burning: 'Crop Burning',
  forest_fire: 'Forest Fire',
  waste_fire: 'Waste Fire',
  other_unknown: 'Other / Unknown',
  nonthermal_control: 'Non-thermal Control',
}

// Where the classifier plausibly slips. Used to build an honest confusion matrix.
export const CONFUSABLE = {
  refinery: ['gas_flare', 'chemical'],
  gas_flare: ['refinery', 'lng_gas'],
  lng_gas: ['gas_flare', 'chemical'],
  steel_metal: ['other_industrial', 'cement'],
  cement: ['brick_kiln', 'other_industrial'],
  brick_kiln: ['cement', 'other_industrial'],
  chemical: ['refinery', 'other_industrial'],
  power_thermal: ['other_industrial', 'mining'],
  mining: ['other_industrial', 'waste_fire'],
  industrial_fire: ['other_industrial', 'waste_fire'],
  other_industrial: ['cement', 'steel_metal'],
  crop_burning: ['waste_fire', 'other_unknown'],
  forest_fire: ['crop_burning', 'other_unknown'],
  waste_fire: ['crop_burning', 'other_industrial'],
  other_unknown: ['waste_fire', 'crop_burning'],
  nonthermal_control: ['other_unknown'],
}

// Seasonal weighting by month index (0 = Jan). Drives detection timing.
export const SEASONALITY = {
  crop_burning: [0.3, 0.3, 0.4, 0.9, 1.4, 0.6, 0.3, 0.3, 0.6, 3.2, 3.6, 0.8],
  forest_fire: [0.5, 1.1, 2.4, 3.1, 2.8, 1.2, 0.2, 0.2, 0.2, 0.3, 0.4, 0.4],
  waste_fire: [1.3, 1.2, 1.1, 1.0, 1.0, 0.7, 0.5, 0.5, 0.7, 1.1, 1.4, 1.5],
  default: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
}
