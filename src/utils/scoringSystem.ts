// Progressive scoring system for the oil phase-out game

export interface ScoringConfig {
  co2BaseCost: number; // NOK per tonne CO2 (starting cost)
  co2CostIncrease: number; // Additional NOK per tonne for each cumulative tonne
  energyBaseValue: number; // NOK per TWh saved (starting value)
  energyValueDecrease: number; // Reduction in value per TWh for each cumulative TWh
  maxCo2Budget: number; // Total CO2 budget for scoring calculations
  maxEnergyBudget: number; // Total energy budget for scoring calculations
}

export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  co2BaseCost: 500, // Start at 500 NOK per tonne CO2
  co2CostIncrease: 50, // Increase by 50 NOK per tonne for each additional tonne
  energyBaseValue: 1000000, // Start at 1M NOK per TWh saved
  energyValueDecrease: 50000, // Decrease by 50K NOK per TWh for each additional TWh
  maxCo2Budget: 100000000, // 100M tonnes total budget
  maxEnergyBudget: 1000, // 1000 TWh total budget
};

export interface YearlyMetrics {
  co2Emissions: number; // tonnes CO2 this year
  energyConsumption: number; // TWh this year
  economicImpact: number; // NOK this year (revenue lost)
}

export interface CumulativeMetrics {
  totalCo2Saved: number; // tonnes CO2 saved vs business as usual
  totalEnergySaved: number; // TWh saved vs business as usual
  totalEconomicImpact: number; // NOK total impact
  yearsActive: number; // number of years played
}

/**
 * Calculate progressive CO2 cost - each additional tonne costs more
 */
export function calculateCo2Score(
  co2Saved: number, 
  config: ScoringConfig = DEFAULT_SCORING_CONFIG
): number {
  if (co2Saved <= 0) return 0;
  
  // Progressive cost: base cost + (cumulative amount * increase rate)
  // Using integral formula for progressive cost calculation
  const avgCostPerTonne = config.co2BaseCost + (co2Saved * config.co2CostIncrease) / 2;
  return co2Saved * avgCostPerTonne;
}

/**
 * Calculate diminishing energy savings value - first TWh saves more than later ones
 */
export function calculateEnergyScore(
  energySaved: number,
  config: ScoringConfig = DEFAULT_SCORING_CONFIG
): number {
  if (energySaved <= 0) return 0;
  
  // Diminishing returns: base value - (cumulative amount * decrease rate)
  const avgValuePerTwh = Math.max(
    config.energyBaseValue - (energySaved * config.energyValueDecrease) / 2,
    config.energyBaseValue * 0.1 // Minimum 10% of base value
  );
  return energySaved * avgValuePerTwh;
}

/**
 * Calculate total game score
 */
export function calculateTotalScore(
  cumulative: CumulativeMetrics,
  config: ScoringConfig = DEFAULT_SCORING_CONFIG
): {
  co2Score: number;
  energyScore: number;
  speedBonus: number;
  totalScore: number;
  breakdown: {
    co2Benefit: number;
    energyBenefit: number;
    economicCost: number;
    speedMultiplier: number;
  };
} {
  const co2Score = calculateCo2Score(cumulative.totalCo2Saved, config);
  const energyScore = calculateEnergyScore(cumulative.totalEnergySaved, config);
  
  // Speed bonus: Earlier completion gets higher multiplier
  const maxYears = 26; // 2024-2050
  const speedMultiplier = Math.max(1.0, 2.0 - (cumulative.yearsActive / maxYears));
  const speedBonus = (co2Score + energyScore) * (speedMultiplier - 1);
  
  const totalBenefit = co2Score + energyScore + speedBonus;
  const netScore = totalBenefit - cumulative.totalEconomicImpact;
  
  return {
    co2Score,
    energyScore,
    speedBonus,
    totalScore: netScore,
    breakdown: {
      co2Benefit: co2Score,
      energyBenefit: energyScore,
      economicCost: cumulative.totalEconomicImpact,
      speedMultiplier,
    },
  };
}

/**
 * Generate oil price with realistic volatility
 */
export function generateOilPrice(
  year: number,
  baseYear: number = 2024,
  basePrice: number = 80,
  volatility: number = 0.15,
  trendSlope: number = -0.5 // Gradual decline per year
): number {
  const yearsDiff = year - baseYear;
  
  // Long-term trend (gradual decline as renewables grow)
  const trendPrice = basePrice + (trendSlope * yearsDiff);
  
  // Add realistic volatility using sine wave + random component
  const cyclicalComponent = Math.sin((yearsDiff * Math.PI) / 7) * (basePrice * 0.1); // 7-year cycle
  const randomComponent = (Math.random() - 0.5) * (basePrice * volatility);
  
  // Ensure price stays within reasonable bounds
  const finalPrice = trendPrice + cyclicalComponent + randomComponent;
  return Math.max(30, Math.min(120, finalPrice));
}

/**
 * Convert metrics to star rating (1-5 stars)
 */
export function metricsToStars(value: number, thresholds: number[]): number {
  for (let i = 0; i < thresholds.length; i++) {
    if (value <= thresholds[i]) {
      return i + 1;
    }
  }
  return 5;
}

/**
 * Default thresholds for star ratings
 */
export const STAR_THRESHOLDS = {
  co2Emissions: [1000000, 5000000, 10000000, 20000000], // tonnes CO2/year
  energyConsumption: [10, 25, 50, 100], // TWh/year
  economicImpact: [10000000000, 50000000000, 100000000000, 200000000000], // NOK/year
};

/**
 * Format large numbers for display
 */
export function formatNumber(num: number, unit: string): string {
  if (num >= 1e12) return `${(num / 1e12).toFixed(1)}T ${unit}`;
  if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B ${unit}`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M ${unit}`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K ${unit}`;
  return `${num.toFixed(1)} ${unit}`;
}

/**
 * Generate star display string
 */
export function generateStarDisplay(stars: number): string {
  return '⭐'.repeat(stars) + '☆'.repeat(5 - stars);
} 