// Helper functions to display unit labels
export const STOCK_UNIT_LABELS: Record<string, string> = {
  tons: "Tons",
  large_bales: "Large Bales",
  small_bales: "Small Bales",
}

export const SELLING_UNIT_LABELS: Record<string, string> = {
  tons: "per Ton",
  large_bales: "per Large Bale",
  small_bales: "per Small Bale",
}

export function getStockUnitLabel(unit: string): string {
  return STOCK_UNIT_LABELS[unit] || unit
}

export function getSellingUnitLabel(unit: string): string {
  return SELLING_UNIT_LABELS[unit] || `per ${unit}`
}
