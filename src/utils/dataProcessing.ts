import type { OilField, Metrics, InvestmentOption } from '../types';

// Oil price configuration
export const OIL_PRICE_CONFIG = {
  basePrice: 80, // USD per barrel
  yearlyAdjustmentRange: { min: -0.05, max: 0.05 }, // -5% to +5% yearly
  currentPrice: 80,
};

// Norwegian tax configuration
export const TAX_CONFIG = {
  petroleumTaxRate: 0.78, // 78% tax on petroleum revenue
  corporateTaxRate: 0.22, // 22% corporate tax
  specialPetroleumTaxRate: 0.56, // 56% special petroleum tax
};

/**
 * Calculate oil price for a given year with random fluctuation
 */
export function calculateOilPrice(year: number, baseYear: number = 2024): number {
  const yearsDiff = year - baseYear;
  let price = OIL_PRICE_CONFIG.basePrice;
  
  // Apply yearly adjustments (simplified random walk)
  for (let i = 0; i < Math.abs(yearsDiff); i++) {
    const adjustment = (Math.random() - 0.5) * 2 * 
      (OIL_PRICE_CONFIG.yearlyAdjustmentRange.max - OIL_PRICE_CONFIG.yearlyAdjustmentRange.min) + 
      OIL_PRICE_CONFIG.yearlyAdjustmentRange.min;
    price *= (1 + adjustment);
  }
  
  return Math.max(price, 20); // Minimum price floor
}

/**
 * Calculate field-specific dividend based on production and oil price
 */
export function calculateFieldDividend(
  field: OilField,
  year: number,
  oilPrice: number
): number {
  const yearData = field.production[year];
  if (!yearData || !yearData.productionOil) return 0;
  
  const grossRevenue = yearData.productionOil * 1000000 * oilPrice; // Convert to barrels and multiply by price
  const taxableRevenue = grossRevenue * TAX_CONFIG.petroleumTaxRate;
  
  return grossRevenue - taxableRevenue; // Net revenue after taxes
}

/**
 * Calculate total Norwegian petroleum revenue for a year
 */
export function calculateTotalPetroleumRevenue(
  fields: OilField[],
  year: number,
  oilPrice: number
): number {
  return fields.reduce((total, field) => {
    const yearData = field.production[year];
    if (!yearData || !yearData.productionOil) return total;
    
    const grossRevenue = yearData.productionOil * 1000000 * oilPrice;
    const taxRevenue = grossRevenue * TAX_CONFIG.petroleumTaxRate;
    
    return total + taxRevenue;
  }, 0);
}

/**
 * Calculate emission intensity for a field (emissions per barrel)
 */
export function calculateEmissionIntensity(field: OilField, year: number): number {
  const yearData = field.production[year];
  if (!yearData || !yearData.productionOil || !yearData.emission) return 0;
  
  return yearData.emission / (yearData.productionOil * 1000000); // kg CO2 per barrel
}

/**
 * Calculate total emissions for all active fields (including exported emissions)
 */
export function calculateTotalEmissions(
  fields: OilField[],
  year: number,
  phasedOutFields: Set<string>
): number {
  return fields.reduce((total, field) => {
    if (phasedOutFields.has(field.id)) return total;
    
    const yearData = field.production[year];
    if (!yearData || !yearData.emission || !yearData.productionOil) return total;
    
    // Direct emissions from production
    const directEmissions = yearData.emission;
    
    // Exported emissions: ~3.2 tonnes CO2 per barrel of oil when burned
    // This is the downstream emissions from Norwegian oil exports
    const exportedEmissions = yearData.productionOil * 1000000 * 3.2; // Convert to barrels and multiply by CO2 factor
    
    return total + directEmissions + exportedEmissions;
  }, 0);
}

/**
 * Calculate metrics impact from investments
 */
export function calculateInvestmentImpact(
  activeInvestments: { investment: InvestmentOption; startYear: number }[],
  currentYear: number,
  baseMetrics: Metrics
): Partial<Metrics> {
  const impact: Partial<Metrics> = {};
  
  activeInvestments.forEach(({ investment, startYear }) => {
    const yearsActive = currentYear - startYear;
    if (yearsActive >= 0 && yearsActive < investment.timeline) {
      // Apply investment effects
      Object.entries(investment.effect).forEach(([key, value]) => {
        if (key in baseMetrics && value !== undefined) {
          impact[key as keyof Metrics] = (impact[key as keyof Metrics] || 0) + value;
        }
      });
    }
  });
  
  return impact;
}

/**
 * Project future production based on historical trends
 */
export function projectFutureProduction(
  field: OilField,
  targetYear: number
): { productionOil?: number; emission?: number } {
  const years = Object.keys(field.production)
    .map(Number)
    .filter(year => !isNaN(year))
    .sort((a, b) => b - a); // Most recent first
  
  if (years.length < 2) return {};
  
  const recentYears = years.slice(0, 3); // Use last 3 years for trend
  const avgDeclineRate = recentYears.slice(1).reduce((sum, year, index) => {
    const currentData = field.production[year];
    const previousData = field.production[recentYears[index]];
    
    if (currentData?.productionOil && previousData?.productionOil) {
      return sum + (currentData.productionOil - previousData.productionOil) / previousData.productionOil;
    }
    return sum;
  }, 0) / (recentYears.length - 1);
  
  const latestYear = years[0];
  const latestData = field.production[latestYear];
  const yearsDiff = targetYear - latestYear;
  
  if (!latestData) return {};
  
  const projectedProduction = latestData.productionOil 
    ? latestData.productionOil * Math.pow(1 + avgDeclineRate, yearsDiff)
    : undefined;
  
  const projectedEmission = latestData.emission && projectedProduction && latestData.productionOil
    ? (latestData.emission / latestData.productionOil) * projectedProduction
    : undefined;
  
  return {
    productionOil: projectedProduction ? Math.max(0, projectedProduction) : undefined,
    emission: projectedEmission ? Math.max(0, projectedEmission) : undefined,
  };
} 