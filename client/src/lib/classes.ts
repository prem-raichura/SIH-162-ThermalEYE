import type { SourceClass } from './types'

export const CLASS_LABELS: Record<SourceClass, string> = {
  refinery: 'Refinery',
  gas_flare: 'Gas Flare',
  lng_gas: 'LNG / Gas',
  power_thermal: 'Power Plant',
  chemical: 'Chemical',
  steel_metal: 'Steel / Metal',
  cement: 'Cement',
  brick_kiln: 'Brick Kiln',
  mining: 'Mining',
  industrial_fire: 'Industrial Fire',
  other_industrial: 'Other Industrial',
  crop_burning: 'Crop Burning',
  forest_fire: 'Forest Fire',
  waste_fire: 'Waste Fire',
  other_unknown: 'Other / Unknown',
  nonthermal_control: 'Non-thermal Control',
}
